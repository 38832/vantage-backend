import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.config import settings

# Standard library logger
logger = logging.getLogger("ugetjob")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# ANSI Color Codes for Terminal Output
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
CYAN = "\033[36m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
RED = "\033[31m"
WHITE = "\033[37m"
BG_BLUE = "\033[44m"
BG_MAGENTA = "\033[45m"

# Dynamic logging toggle state (defaults to settings.enable_detailed_logs)
_DETAILED_LOGGING_OVERRIDE: Optional[bool] = None

SENSITIVE_KEY_NAMES = {
    "password",
    "access_token",
    "refresh_token",
    "token",
    "secret",
    "secret_key",
    "authorization",
    "api_key",
    "service_role",
    "supabase_key",
    "credentials",
}


def is_sensitive_key(key: str) -> bool:
    """Check if a dictionary key name is sensitive and should be redacted."""
    key_lower = key.lower()
    if key_lower in {"pass", "pwd"}:
        return True
    return any(sens in key_lower for sens in SENSITIVE_KEY_NAMES)


def sanitize_payload(data: Any) -> Any:
    """
    Recursively sanitize sensitive fields (passwords, tokens, secrets)
    from request/response bodies before terminal logging.
    Returns a copy without mutating the original input.
    """
    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            if is_sensitive_key(str(k)):
                sanitized[k] = "[REDACTED]"
            else:
                sanitized[k] = sanitize_payload(v)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_payload(item) for item in data]
    elif isinstance(data, str):
        # If the string is a serialized JSON object, parse and sanitize it
        trimmed = data.strip()
        if (trimmed.startswith("{") and trimmed.endswith("}")) or (trimmed.startswith("[") and trimmed.endswith("]")):
            try:
                parsed = json.loads(trimmed)
                return json.dumps(sanitize_payload(parsed))
            except Exception:
                pass
        # If the string looks like a JWT token (e.g. eyJhbGci...)
        if data.startswith("eyJ") and data.count(".") == 2 and len(data) > 40:
            return "[REDACTED_JWT]"
        # If the string starts with Bearer
        if data.lower().startswith("bearer eyJ"):
            return "Bearer [REDACTED_JWT]"
        return data
    return data


def is_detailed_logging_enabled() -> bool:
    """
    Check if dynamic detailed console logging is currently enabled.
    Can be controlled via settings.enable_detailed_logs or runtime override.
    """
    if _DETAILED_LOGGING_OVERRIDE is not None:
        return _DETAILED_LOGGING_OVERRIDE
    return getattr(settings, "enable_detailed_logs", True)

def set_detailed_logging(enabled: bool) -> bool:
    """
    Dynamically turn detailed console logging ON (True) or OFF (False).
    """
    global _DETAILED_LOGGING_OVERRIDE
    _DETAILED_LOGGING_OVERRIDE = enabled
    state_str = f"{GREEN}ENABLED (VERBOSE){RESET}" if enabled else f"{YELLOW}DISABLED (QUIET){RESET}"
    print(f"\n{BOLD}{CYAN}[UGETJOB CONFIG]{RESET} Dynamic detailed terminal logging is now {state_str}\n")
    return enabled


def _format_json_safely(data: Any, max_length: int = 15000) -> str:
    """Format dictionary or JSON string with indentation, bounds checking, and credential sanitization."""
    try:
        clean_data = sanitize_payload(data)
        if isinstance(clean_data, (dict, list)):
            formatted = json.dumps(clean_data, indent=2, default=str)
        elif isinstance(clean_data, str):
            try:
                parsed = json.loads(clean_data)
                formatted = json.dumps(parsed, indent=2, default=str)
            except Exception:
                formatted = clean_data
        else:
            formatted = str(clean_data)

        if len(formatted) > max_length:
            return formatted[:max_length] + f"\n... [Truncated {len(formatted) - max_length} bytes]"
        return formatted
    except Exception as e:
        return f"[Error formatting JSON: {e}]"


def log_http_request(
    method: str,
    path: str,
    query_params: Optional[Dict[str, Any]] = None,
    client_host: Optional[str] = None,
    body: Any = None,
    content_type: Optional[str] = None
):
    """Log an incoming HTTP request in detail to the terminal."""
    if not is_detailed_logging_enabled():
        return

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    method_color = GREEN if method == "GET" else (YELLOW if method in ("POST", "PUT") else (MAGENTA if method == "PATCH" else RED))

    print(f"\n{BOLD}{CYAN}┌─── [INCOMING REQUEST] {method_color}{method}{RESET} {BOLD}{path}{RESET} {DIM}────────────────────────────{RESET}")
    print(f"{CYAN}│{RESET} {BOLD}Time:{RESET} {now_str} | {BOLD}Client:{RESET} {client_host or 'Unknown'}")
    
    if query_params:
        clean_params = sanitize_payload(query_params)
        params_str = ", ".join(f"{k}='{v}'" for k, v in clean_params.items())
        print(f"{CYAN}│{RESET} {BOLD}Query Parameters:{RESET} {YELLOW}{params_str}{RESET}")
    else:
        print(f"{CYAN}│{RESET} {BOLD}Query Parameters:{RESET} {DIM}None{RESET}")

    if content_type:
        print(f"{CYAN}│{RESET} {BOLD}Content-Type:{RESET} {content_type}")

    if body:
        formatted_body = _format_json_safely(body)
        print(f"{CYAN}│{RESET} {BOLD}Request Body (JSON):{RESET}")
        for line in formatted_body.splitlines():
            print(f"{CYAN}│{RESET}   {DIM}{line}{RESET}")
    else:
        print(f"{CYAN}│{RESET} {BOLD}Request Body:{RESET} {DIM}[Empty / None]{RESET}")
    print(f"{CYAN}└─── Processing route... ────────────────────────────────────────{RESET}")
    sys.stdout.flush()


def log_http_response(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    body: Any = None
):
    """Log the outgoing HTTP response and its payload in detail."""
    if not is_detailed_logging_enabled():
        return

    status_color = GREEN if status_code < 400 else (YELLOW if status_code < 500 else RED)
    method_color = GREEN if method == "GET" else (YELLOW if method in ("POST", "PUT") else (MAGENTA if method == "PATCH" else RED))

    print(f"{BOLD}{BLUE}┌─── [RESPONSE COMPLETED] {method_color}{method}{RESET} {BOLD}{path}{RESET} ─── {status_color}{status_code}{RESET} {DIM}({duration_ms:.1f}ms){RESET} ──────")
    
    if body:
        formatted_body = _format_json_safely(body)
        print(f"{BLUE}│{RESET} {BOLD}Response JSON Payload:{RESET}")
        for line in formatted_body.splitlines():
            print(f"{BLUE}│{RESET}   {GREEN}{line}{RESET}")
    else:
        print(f"{BLUE}│{RESET} {BOLD}Response Body:{RESET} {DIM}[Empty]{RESET}")
    print(f"{BOLD}{BLUE}└─────────────────────────────────────────────────────────────────{RESET}\n")
    sys.stdout.flush()


def log_query_details(
    entity: str,
    operation: str,
    filters: Optional[List[str]] = None,
    sorting: Optional[List[str]] = None,
    returned_count: int = 0,
    total_count: Optional[int] = None,
    sample_preview: Optional[Any] = None
):
    """
    Log database query sorting, filters, and returned record counts.
    Answers user requirement: "getting to know if all data is getting sorted returned"
    """
    if not is_detailed_logging_enabled():
        return

    print(f"{MAGENTA}├─► [DB QUERY: {operation.upper()} {entity}]{RESET}")
    
    # Applied sorting
    if sorting:
        sort_str = ", ".join(sorting)
        print(f"{MAGENTA}│   • SORTING APPLIED:{RESET} {BOLD}{YELLOW}[{sort_str}]{RESET}")
    else:
        print(f"{MAGENTA}│   • SORTING APPLIED:{RESET} {DIM}[Default / Unsorted]{RESET}")

    # Applied filters
    if filters:
        filter_str = " AND ".join(filters)
        print(f"{MAGENTA}│   • FILTERS APPLIED:{RESET} {CYAN}{filter_str}{RESET}")
    else:
        print(f"{MAGENTA}│   • FILTERS APPLIED:{RESET} {DIM}[None - Full table query]{RESET}")

    # Counts returned
    if total_count is not None:
        print(f"{MAGENTA}│   • DATA RETURNED:{RESET} {BOLD}{GREEN}{returned_count} records returned{RESET} {DIM}(Total matching in database: {total_count}){RESET}")
    else:
        print(f"{MAGENTA}│   • DATA RETURNED:{RESET} {BOLD}{GREEN}{returned_count} records returned{RESET}")

    if sample_preview:
        preview_str = str(sample_preview)
        if len(preview_str) > 200:
            preview_str = preview_str[:200] + "..."
        print(f"{MAGENTA}│   • SAMPLE RESULT:{RESET} {DIM}{preview_str}{RESET}")
    sys.stdout.flush()


def log_mutation_details(
    entity_name: str,
    entity_id: Any,
    operation: str,
    changes: Optional[Dict[str, Any]] = None,
    details: Optional[str] = None
):
    """
    Log database insertion, update, or deletion.
    Answers user requirement: "getting to know if all data is updated"
    """
    if not is_detailed_logging_enabled():
        return

    op_color = GREEN if operation.upper() == "INSERT" else (YELLOW if operation.upper() == "UPDATE" else RED)
    print(f"{op_color}├─► [DB MUTATION: {operation.upper()} {entity_name}]{RESET}")
    print(f"{op_color}│   • TARGET ID:{RESET} {BOLD}{entity_id}{RESET}")

    if details:
        print(f"{op_color}│   • NOTE:{RESET} {details}")

    if changes:
        print(f"{op_color}│   • UPDATED FIELDS:{RESET}")
        for field, val in changes.items():
            if isinstance(val, tuple) and len(val) == 2:
                old_val, new_val = val
                print(f"{op_color}│     - {field}:{RESET} {DIM}'{old_val}'{RESET} ──► {BOLD}{GREEN}'{new_val}'{RESET}")
            else:
                print(f"{op_color}│     - {field}:{RESET} {BOLD}{GREEN}{val}{RESET}")
    sys.stdout.flush()
