# Dynamic & Detailed Terminal Logging System for UGETJOB Backend

Comprehensive, dynamic terminal console logging for the FastAPI backend, giving full visibility into incoming request payloads, sorting and filtering criteria, database query execution, returned record counts, and data mutations, with a straightforward on/off setting in the code.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your answers during Phase 1:
> - **Log Output**: Terminal console output only with dynamic formatting and color-coded sections.
> - **Control Switch**: An explicit code-level on/off setting (`ENABLE_DETAILED_LOGS` in `app/core/config.py` and runtime toggle helper) with fallback to default settings when turned off.
> - **Captured Details**: Full request and response JSON bodies, SQL sorting/filtering operations, returned record counts, and database mutation diffs (creations, updates, and deletes).

---

## 1. Overview & Core Concept

Currently, backend routes process requests silently without terminal visibility into:
- What filters or sort orders were actually received and applied in SQL queries.
- How many records were found and returned to the client.
- What specific fields were updated, inserted, or deleted during mutations.
- The raw JSON request and response payloads.

This plan introduces a unified, non-intrusive logging architecture:
1. **Dynamic On/Off Setting in Code**: A centralized flag in `app/core/config.py` (`ENABLE_DETAILED_LOGS: bool = True`) that can be changed directly in code or via environment variable, plus a runtime helper to switch levels without stopping the server.
2. **HTTP Request & Response Logging Middleware**: Intercepts every incoming call, capturing the HTTP method, endpoint, query parameters, headers, and full JSON body; upon completion, captures duration, HTTP status code, and the complete response JSON body.
3. **Database Query & Sorting Inspector**: Logs exact sorting fields (e.g. `urgent DESC`, `posted_at DESC`), applied filter conditions (e.g. `country = 'Saudi Arabia'`, `experience_min <= 5`), and the exact number of matching rows returned.
4. **Data Mutation & Update Diffs**: Logs newly created IDs, previous vs. updated field values during `PATCH` operations, and deletion modes (`soft-close` vs. `hard-delete`).

---

## 2. Terminal Console UX & Log Formatting

The logs will be formatted cleanly in the terminal using ANSI colors and structured block dividers for readability:

```text
┌─── [REQUEST] GET /api/jobs ──────────────────────────────────────────
│ Time: 2026-10-31 07:15:02 UTC | Client: 127.0.0.1
│ Query Params: country='Saudi Arabia', category='electrical', page=1, limit=20
│ Sorting: [urgent DESC, featured DESC, posted_at DESC]
│ Filters Applied: [status = 'published', country = 'Saudi Arabia', category = 'electrical']
│ Database Result: 12 jobs returned (out of 48 total matching records)
│ Status: 200 OK | Duration: 14.2ms
└─── [RESPONSE BODY] ──────────────────────────────────────────────────
│ {
│   "success": true,
│   "data": [ { "id": "22222222-...", "title": "Substation Electrician", ... } ],
│   "meta": { "page": 1, "limit": 20, "total": 48 }
│ }
────────────────────────────────────────────────────────────────────────
```

When an update (`PATCH`) or creation (`POST`) occurs:
```text
┌─── [MUTATION] PATCH /api/admin/ats/applications/8a91c2e4-... ────────
│ Mutation Type: UPDATE (Application)
│ Target ID: 8a91c2e4-f3b1-419b-a812-984e1b302a91
│ Changes Applied:
│   • application_status: 'new' → 'interview_scheduled'
│   • recruiter_assigned: None → 'Nouman Qureshi'
│   • interview_date: None → '2026-11-05T10:00:00Z'
│ Status: 200 OK | Duration: 18.6ms
└───────────────────────────────────────────────────────────────────────
```

When detailed logging is toggled **OFF**, logging cleanly reverts to standard minimal Uvicorn access logs (`INFO: 127.0.0.1:8000 - "GET /api/jobs" 200 OK`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Centralized Code Setting with Runtime Flexibility**
  - *Chosen Approach*: Define `ENABLE_DETAILED_LOGS: bool = True` in `app/core/config.py` (overridable via `.env` or direct code assignment) and expose a lightweight toggle function `set_detailed_logging(enabled: bool)`.
  - *Why*: Allows you to turn detailed logs on or off in a single line of code, while also allowing runtime switching without process restarts.

- **Decision 2: Asynchronous Request/Response Stream Buffering**
  - *Chosen Approach*: Buffer the request body in ASGI middleware so it can be logged before route execution and then passed downstream without consuming or blocking the stream for FastAPI route handlers.
  - *Why*: Direct stream reading in Starlette/FastAPI consumes the byte buffer; caching the stream ensures multipart file uploads and JSON bodies both parse without breaking.

- **Decision 3: Dedicated Logging Module (`app/core/logger.py`)**
  - *Chosen Approach*: Build a dedicated helper with explicit methods (`log_query`, `log_mutation`, `log_request`, `log_response`) rather than injecting print statements throughout routes.
  - *Why*: Keeps business logic clean, maintains uniform formatting, and respects the on/off setting across all 18 backend endpoints.

---

## 4. Technical Architecture & Data Strategy

### System Flow & Middleware Lifecycle

```text
  Client Request (Frontend / cURL)
               │
               ▼
   ┌──────────────────────────────────────────┐
   │ RequestLoggingMiddleware (app/main.py)   │
   │  • Check settings.ENABLE_DETAILED_LOGS   │
   │  • Extract Path, Method, Query, Headers  │
   │  • Buffer & Log Full Request JSON Body   │
   └───────────────────┬──────────────────────┘
                       │
                       ▼
   ┌──────────────────────────────────────────┐
   │ Route Handler Execution                  │
   │  • jobs.py: log sorting & applied filters│
   │  • applications.py: log candidate insert │
   │  • admin.py: log PATCH field diffs       │
   │  • Count matching rows returned          │
   └───────────────────┬──────────────────────┘
                       │
                       ▼
   ┌──────────────────────────────────────────┐
   │ Response Logging & Timing                │
   │  • Calculate duration (ms)               │
   │  • Log HTTP Status & Response JSON Body  │
   └───────────────────┬──────────────────────┘
                       │
                       ▼
             Terminal Console Output
```

### Components to Create & Update

1. **`backend/app/core/config.py`**:
   - Add `enable_detailed_logs: bool = True` setting.
   - Add `log_payload_max_bytes: int = 10000` (prevents binary file uploads from flooding the terminal while keeping full JSON readable).

2. **`backend/app/core/logger.py`** (New File):
   - Custom terminal logger with ANSI color formatting.
   - Dynamic switch methods: `is_detailed_logging_enabled()`, `set_detailed_logging(bool)`.
   - Logging utilities:
     - `log_http_request(method, url, query_params, body)`
     - `log_http_response(status_code, duration_ms, body)`
     - `log_query_details(entity, filters, sorting, returned_count, total_count)`
     - `log_mutation_details(entity_name, entity_id, operation, changes_dict)`

3. **`backend/app/main.py`**:
   - Register the `RequestLoggingMiddleware` with request/response body interception.
   - Add optional admin/developer toggle endpoint `POST /api/admin/logging/toggle` for quick testing.

4. **Route Updates (`backend/app/api/routes/`)**:
   - **`jobs.py`**: Log exact query filters (category, country, city, visa), sort sequence (`urgent DESC, featured DESC, posted_at DESC`), and returned count.
   - **`applications.py`**: Log quick-apply candidate creation, deduplication check, resume source (`drive_link` vs `uploaded_file`), and created application ID.
   - **`admin.py`**: Log ATS pipeline status changes, field-by-field diffs on `PATCH /ats/applications/{id}`, and job soft-close / hard-delete operations.
   - **`inquiries.py`**: Log employer manpower requirements and service inquiries.

5. **Test Verification**:
   - Update `backend/tests/test_api.py` to ensure all existing tests pass with the new logging middleware enabled, and add a test verifying the dynamic toggle.
