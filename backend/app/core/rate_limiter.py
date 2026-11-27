import ipaddress
import time
import asyncio
from collections import OrderedDict
from typing import Optional, Set, List
from fastapi import Request, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


_CREATE_TABLE_SQL = text(
    """
    CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        key VARCHAR(128) PRIMARY KEY,
        window_start BIGINT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0
    )
    """
)

_UPSERT_BUCKET_SQL = text(
    """
    INSERT INTO rate_limit_buckets (key, window_start, count)
    VALUES (:key, :window_start, 1)
    ON CONFLICT (key) DO UPDATE SET
        count = CASE
            WHEN rate_limit_buckets.window_start = :window_start
            THEN rate_limit_buckets.count + 1
            ELSE 1
        END,
        window_start = :window_start
    RETURNING count, window_start
    """
)

_DELETE_EXPIRED_SQL = text(
    "DELETE FROM rate_limit_buckets WHERE window_start < :expired_before"
)


class DatabaseRateLimiter:
    """
    Multi-process rate limiter backed by PostgreSQL/SQLite atomic upserts when a
    database session is provided, with an in-memory fallback for standalone calls.
    """
    def __init__(
        self,
        requests_limit: int = 10,
        window_seconds: int = 60,
        max_tracked_ips: int = 10000,
        trusted_proxies: Optional[Set[str]] = None,
        namespace: str = "public",
    ):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.max_tracked_ips = max_tracked_ips
        self.namespace = namespace
        # Defaults to local loopback / private proxy addresses if unspecified
        self.trusted_proxies = trusted_proxies or {
            "127.0.0.1", "::1", "localhost", "testclient"
        }
        self._records: OrderedDict[str, List[float]] = OrderedDict()
        self._lock = asyncio.Lock()
        self._last_cleanup = time.time()
        self._table_verified = False

    async def check_rate_limit(
        self,
        request: Request,
        custom_limit: int | None = None,
        db: Optional[AsyncSession] = None,
    ) -> None:
        """
        Check rate limit for client IP.
        Uses atomic DB counters across worker processes when `db` is provided.
        Raises HTTPException(429) with Retry-After header if limit exceeded.
        """
        limit = custom_limit if custom_limit is not None else self.requests_limit
        now = time.time()
        client_ip = self._get_client_ip(request)

        if db is not None:
            await self._check_db_limit(db=db, client_ip=client_ip, limit=limit, now=now)
            return

        async with self._lock:
            # Periodic cleanup of completely stale records every 5 minutes
            if now - self._last_cleanup > 300:
                self._evict_stale(now)
                self._last_cleanup = now

            timestamps = self._records.get(client_ip, [])
            # Filter timestamps within current sliding window
            cutoff = now - self.window_seconds
            valid_timestamps = [t for t in timestamps if t > cutoff]

            if len(valid_timestamps) >= limit:
                # Calculate remaining seconds before oldest request rolls out of window
                oldest = valid_timestamps[0]
                retry_after = max(1, int(self.window_seconds - (now - oldest)))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                    headers={"Retry-After": str(retry_after)},
                )

            valid_timestamps.append(now)
            # Maintain LRU ordering
            self._records[client_ip] = valid_timestamps
            self._records.move_to_end(client_ip)

            # Enforce hard memory bound to prevent OOM
            if len(self._records) > self.max_tracked_ips:
                self._records.popitem(last=False)

    async def _check_db_limit(
        self,
        db: AsyncSession,
        client_ip: str,
        limit: int,
        now: float,
    ) -> None:
        if not self._table_verified:
            await db.execute(_CREATE_TABLE_SQL)
            self._table_verified = True

        window_start = (int(now) // self.window_seconds) * self.window_seconds
        bucket_key = f"{self.namespace}:{client_ip}"[:128]

        result = await db.execute(
            _UPSERT_BUCKET_SQL,
            {"key": bucket_key, "window_start": window_start},
        )
        row = result.one()
        count = int(row[0])

        if now - self._last_cleanup > 300:
            await db.execute(
                _DELETE_EXPIRED_SQL,
                {"expired_before": window_start - (self.window_seconds * 2)},
            )
            self._last_cleanup = now

        # Persist counter immediately so failed downstream validation still counts
        await db.commit()

        if count > limit:
            retry_after = max(1, int((window_start + self.window_seconds) - now))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": str(retry_after)},
            )

    def _get_client_ip(self, request: Request) -> str:
        """
        Extract client IP from request, safely taking proxy headers into account
        only if coming from trusted reverse proxies.
        """
        direct_ip = request.client.host if (request.client and request.client.host) else "unknown"

        # Only trust forwarded headers if request originates from trusted proxy or test harness
        if direct_ip in self.trusted_proxies or direct_ip == "unknown" or direct_ip.startswith("127."):
            forwarded_for = request.headers.get("x-forwarded-for")
            if forwarded_for:
                candidate = forwarded_for.split(",")[0].strip()
                if self._is_valid_ip(candidate):
                    return candidate

            real_ip = request.headers.get("x-real-ip")
            if real_ip:
                candidate = real_ip.strip()
                if self._is_valid_ip(candidate):
                    return candidate

        return direct_ip

    @staticmethod
    def _is_valid_ip(ip_str: str) -> bool:
        try:
            ipaddress.ip_address(ip_str)
            return True
        except ValueError:
            return False

    def _evict_stale(self, now: float) -> None:
        cutoff = now - self.window_seconds
        stale_keys = [
            ip for ip, times in self._records.items()
            if not times or times[-1] <= cutoff
        ]
        for key in stale_keys:
            self._records.pop(key, None)

    def reset(self) -> None:
        """Helper to clear in-memory limiter state (primarily for tests)."""
        self._records.clear()
        self._table_verified = False


# Backward-compatible alias for existing imports/tests
InMemoryRateLimiter = DatabaseRateLimiter

# Default singleton instance for public submissions: 10 requests per minute per IP
public_submission_limiter = DatabaseRateLimiter(requests_limit=10, window_seconds=60)
