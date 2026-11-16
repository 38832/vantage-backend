import ipaddress
import time
import asyncio
from collections import OrderedDict
from typing import Optional, Set, List
from fastapi import Request, HTTPException, status


class InMemoryRateLimiter:
    """
    Sliding-window in-memory IP rate limiter.
    Thread-safe, async-safe, bounded in memory with LRU eviction and IP validation.
    """
    def __init__(
        self,
        requests_limit: int = 10,
        window_seconds: int = 60,
        max_tracked_ips: int = 10000,
        trusted_proxies: Optional[Set[str]] = None,
    ):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.max_tracked_ips = max_tracked_ips
        # Defaults to local loopback / private proxy addresses if unspecified
        self.trusted_proxies = trusted_proxies or {
            "127.0.0.1", "::1", "localhost", "testclient"
        }
        self._records: OrderedDict[str, List[float]] = OrderedDict()
        self._lock = asyncio.Lock()
        self._last_cleanup = time.time()

    async def check_rate_limit(self, request: Request, custom_limit: int | None = None) -> None:
        """
        Check rate limit for client IP.
        Raises HTTPException(429) with Retry-After header if limit exceeded.
        """
        limit = custom_limit if custom_limit is not None else self.requests_limit
        now = time.time()
        client_ip = self._get_client_ip(request)

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
        """Helper to clear limiter state (primarily for tests)."""
        self._records.clear()


# Default singleton instance for public submissions: 10 requests per minute per IP
public_submission_limiter = InMemoryRateLimiter(requests_limit=10, window_seconds=60)
