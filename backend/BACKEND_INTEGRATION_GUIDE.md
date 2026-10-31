# UGETJOB Backend Integration Guide

## 1. Executive summary

UGETJOB is a FastAPI asynchronous backend for public recruitment pages, candidate applications, employer inquiries, service requests, and an internal ATS. It uses SQLAlchemy 2.0 async sessions with `asyncpg`, PostgreSQL/Supabase, Supabase Storage, and Pydantic v2.

Verified in this audit:

- 30 automated tests pass.
- 18 API routes are registered through FastAPI routers, plus `GET /`.
- OpenAPI 3.1 is generated successfully.
- No routes use FastAPI authentication dependencies.
- Admin routes are publicly callable in the current implementation.
- No live Supabase database, credentials, or Storage operation was executed.

## 2. Runtime and application entry point

The entry point is [app/main.py](app/main.py). It creates one FastAPI application, registers CORS, and mounts these routers:

| Router module | Prefix | Tags |
|---|---|---|
| health | `/api` | Health |
| jobs | `/api` | Jobs & Categories |
| applications | `/api` | Applications & Candidates |
| inquiries | `/api` | Inquiries & Services |
| admin | `/api/admin` | Admin & ATS |

The root route is `GET /` and returns:

```json
{
  "app": "UGETJOB Backend API",
  "consultancy": "Nouman's Manpower Consultancy",
  "documentation": "/docs",
  "status": "healthy"
}
```

Run locally from the backend directory:

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## 3. Complete API inventory

| API name | Method | Endpoint | Authentication | Response | Purpose |
|---|---|---|---|---|---|
| Root status | GET | `/` | None | JSON object | Basic service status |
| Health | GET | `/api/health` | None | Health JSON | Configuration and service status |
| List categories | GET | `/api/categories` | None | `ApiResponse<JobCategory[]>` | Active categories |
| List jobs | GET | `/api/jobs` | None | Paginated `ApiResponse<JobListItem[]>` | Search/filter jobs |
| Featured jobs | GET | `/api/jobs/featured` | None | `ApiResponse<JobListItem[]>` | Featured jobs |
| Urgent jobs | GET | `/api/jobs/urgent` | None | `ApiResponse<JobListItem[]>` | Urgent jobs |
| Job detail | GET | `/api/jobs/{job_id}` | None | `ApiResponse<JobDetail>` | Job detail |
| JSON quick apply | POST | `/api/applications/quick-apply` | None | Ad hoc success JSON | Candidate/application create with link resume |
| Multipart quick apply | POST | `/api/applications/quick-apply-multipart` | None | Ad hoc success JSON | Candidate/application create with uploaded resume or link |
| Candidate resumes | GET | `/api/applications/candidates/{candidate_id}/resumes` | None | `ApiResponse<CandidateResume[]>` | Resume records |
| Supporting document | POST | `/api/applications/{application_id}/documents` | None | Ad hoc success JSON | Upload passport/certificate/other file |
| Employer inquiry | POST | `/api/inquiries/employer` | None | Ad hoc success JSON | Create manpower inquiry and employer |
| Service request | POST | `/api/inquiries/service` | None | Ad hoc success JSON | Create service request |
| ATS dashboard | GET | `/api/admin/dashboard` | **None implemented** | `ApiResponse<ATSDashboardStats>` | KPI counts |
| ATS applications | GET | `/api/admin/ats/applications` | **None implemented** | Paginated `ApiResponse<Application[]>` | Recruiter application list |
| Update application | PATCH | `/api/admin/ats/applications/{application_id}` | **None implemented** | Ad hoc success JSON | Pipeline update |
| Add ATS note | POST | `/api/admin/ats/applications/{application_id}/notes` | **None implemented** | `ApiResponse<ATSNote>` | Internal note |
| Update job | PATCH | `/api/admin/jobs/{job_id}` | **None implemented** | `ApiResponse<JobDetail>` | Update selected job fields |
| Delete/archive job | DELETE | `/api/admin/jobs/{job_id}` | **None implemented** | Ad hoc success JSON | Soft close or hard delete |

## 4. Shared response format

Most routes return this Pydantic envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0
  },
  "error": null
}
```

Some routes use a dictionary under `data` instead of a declared schema. Validation errors are FastAPI HTTP 422 bodies shaped as:

```json
{
  "detail": [
    {
      "type": "string_type",
      "loc": ["body", "full_name"],
      "msg": "Input should be a valid string",
      "input": null
    }
  ]
}
```

## 5. Endpoint details

### Health and root

#### `GET /api/health`

Headers: `Accept: application/json` recommended. Authentication: none.

Success:

```json
{
  "status": "ok",
  "service": "ugetjob-backend",
  "environment": "development",
  "database": "postgresql-asyncpg",
  "storage": "supabase"
}
```

#### `GET /`

No request data. Public.

### Categories and jobs

#### `GET /api/categories`

Returns active categories ordered by name.

```json
{
  "success": true,
  "data": [
    {
      "id": "11111111-1111-1111-1111-111111111103",
      "slug": "electrical",
      "name": "Electrical & Substation",
      "description": "Industrial electricians and substation technicians",
      "is_active": true
    }
  ],
  "meta": null,
  "error": null
}
```

#### `GET /api/jobs`

See query parameters in [API_ENDPOINTS.md](API_ENDPOINTS.md). Experience minimum filtering uses the unusual rule `job.experience_min <= applicant minimum`; experience maximum filtering accepts jobs where `experience_max` is null or greater/equal to the requested maximum. Response fields are UUID, category UUID, title, company, country/city, employment type, visa requirement, experience bounds, salary bounds/currency, urgent/featured/status, posted timestamp, skills, and openings count.

#### `GET /api/jobs/featured`, `GET /api/jobs/urgent`

Optional query `limit` defaults to 6; source does not define a minimum or maximum. Both use `posted_at DESC` and require published status plus the matching flag.

#### `GET /api/jobs/{job_id}`

`job_id` is a UUID. A 404 response returns `{"detail":"Job with ID '<id>' not found"}`. Detail responses include description, requirements, benefits, employer contact fields, deadline, work-location type, visa type, and fields listed for list items.

The route does not check that the job status is published. Do not expose this endpoint as exclusively public catalog data until that source behavior is fixed.

### JSON quick apply

Required: `full_name`, `phone`.

Optional model fields and types:

| Field | JSON type | Default/constraint |
|---|---|---|
| `email` | string/email | Valid email if supplied |
| `whatsapp` | string | Defaults to phone in candidate creation if omitted |
| `job_id` | UUID string | Existing ID if supplied |
| `nationality/current_country/current_city` | string | Optional |
| `passport_status` | string | `ready` |
| `passport_number` | string | Optional |
| `passport_expiry` | ISO date | Optional |
| `years_experience` | integer | `0` |
| `current_job_title`, `current_role` | string | Role aliases synchronized |
| `current_salary` | number | Optional |
| `preferred_country/city/job category` | string | Optional |
| `visa_status` | string | `required` |
| `notice_period` | string | Optional |
| `willing_to_relocate` | boolean | `true` |
| `cover_letter` | string | Optional |
| `consent_to_contact` | boolean | `true` |
| `resume_url`, `drive_link` | string/URL | Optional; no URL validation |
| `resume_source` | enum string | `drive_link`, `uploaded_file`, `manual_text` |

Drive link precedence is `drive_link` then `resume_url`.

Success is HTTP 200, not HTTP 201:

```json
{
  "success": true,
  "data": {
    "application_id": "uuid",
    "candidate_id": "uuid",
    "status": "new",
    "resume_url": null,
    "resume_source": "drive_link",
    "message": "Application submitted successfully. Our recruitment team will review your profile."
  },
  "meta": null,
  "error": null
}
```

Possible 404 unknown job; 422 invalid body/email/UUID.

### Multipart quick apply

Required form fields: `full_name`, `phone`. Optional form fields are listed in [API_ENDPOINTS.md](API_ENDPOINTS.md). `resume` is an optional binary file. If both resume and drive link are supplied, uploaded resume wins.

Success example:

```json
{
  "success": true,
  "data": {
    "application_id": "uuid",
    "candidate_id": "uuid",
    "resume_url": "https://storage.example/...",
    "resume_source": "uploaded_file",
    "message": "Candidate applied successfully with resume registered."
  },
  "meta": null,
  "error": null
}
```

Possible 422 missing required fields/invalid numeric/boolean conversion.

### Resume and supporting document endpoints

`GET /api/applications/candidates/{candidate_id}/resumes` has a UUID candidate path parameter and is publicly callable. Candidate Resume response fields include ID, candidate ID, original filename, storage bucket/path, MIME, byte size, resume source, optional drive link, primary flag, and timestamps. It may expose storage and external-link information.

Supporting document upload:

```text
POST /api/applications/{application_id}/documents
Content-Type: multipart/form-data

document_type=passport
file=@passport.pdf
```

Success includes document database ID, application ID, document type, storage path, and URL.

### Employer and service requests

Both endpoints require JSON for employer/service payloads, use no authentication, and return HTTP 200 with an ad hoc success envelope. Required and optional fields are documented in the concise endpoint reference.

### Admin/ATS

There is currently no token, cookie, login, or authorization mechanism. Frontend code must not rely on Authorization headers today. All `/api/admin/*` endpoints are public from the backend's perspective. If an HTTP 401 or 403 appears in a proxy, it is infrastructure-side, not implemented by FastAPI source.

Dashboard returns total applications and status counts. Application update accepts only fields from `ApplicationUpdate`; job update accepts only fields from `JobUpdate`. Add ATS note requires `author_name` and `note`.

## 6. Database structure

The schema is in [database/schema.sql](../database/schema.sql). Core tables:

| Table | Key columns/relationships |
|---|---|
| `job_categories` | UUID ID; unique slug/name; parent self-FK; active flag; timestamps |
| `jobs` | Category FK, title/company/location/salary/requirements/status/flags; category relationship |
| `candidates` | Personal, passport, employment, preferred, consent, resume metadata |
| `candidate_resumes` | Candidate UUID FK CASCADE; filename/bucket/path/MIME/size/source/primary |
| `applications` | Candidate FK CASCADE, job FK SET NULL; status, recruiter, interview and pipeline fields |
| `employers` | Company/contact data |
| `employer_inquiries` | Optional employer FK SET NULL plus copied company/request fields |
| `service_requests` | Service and contact data |
| `application_documents` | Optional application and candidate FKs; document metadata/storage path |
| `ats_notes` | Application FK CASCADE; author and note |
| `job_search_activity` | Search terms, filters, result count, IP, timestamp; no API currently |
| `admin_users` | Email, password hash, role, active flag; no API/auth currently |

Enums:

- Jobs: `draft`, `published`, `paused`, `closed`, `filled`.
- Applications: `new`, `contacted`, `shortlisted`, `interview_scheduled`, `interviewed`, `document_pending`, `medical_pending`, `visa_pending`, `visa_approved`, `rejected`, `hired`, `archived`.
- Resume source: `drive_link`, `uploaded_file`, `manual_text`.

Frontend handling:

- Public job pages should only use list/detail data marked as approved. Current detail route should be considered draft-sensitive until backend status filtering is added.
- Candidate profile and application records contain personal and passport data and should not be sent through public state or analytics.
- Employer and service fields are personal/business lead data.
- ATS stages, recruiter assignment, interview notes, internal notes, document paths, and candidate contact data are sensitive.
- The API does not currently return candidate profile, inquiry, or service-request models, so frontend admin forms need endpoints that do not exist yet.

## 7. File handling

Supabase buckets configured in source/schema:

| Bucket | Private/public | 10 MB limit | Allowed MIME |
|---|---|---|---|
| `candidate-resumes` | private | yes | PDF, DOC, DOCX, ODT, RTF, JPEG, PNG |
| `company-documents`/schema `company-documents` | private | yes | PDF, DOC, DOCX, JPEG, PNG |
| `job-attachments` | public | yes | PDF, JPEG, PNG |

Actual API usage:

- Quick multipart resume: `candidate-resumes`, path `{application_id}/{random}_{filename}`.
- Supporting documents: also uploaded to `candidate-resumes`, despite document type.
- Generic configured upload helper exists in source but is not called by a route.
- JSON and Drive links store external URLs, not uploaded objects.

The backend currently performs no route-level filename, size, extension, MIME, or bucket-name validation. Database schema storage limits are the primary enforced configuration only if those buckets have been created in Supabase and policy allows the upload.

Do not use a returned public fallback URL for a private document; it may only work if the bucket was actually public. Backend service-role access should be used for uploads and an authenticated/private signed-URL flow should be added for sensitive reads.

## 8. Authentication and authorization

Implemented: none. `AdminUser` and stored password hash exist, but no endpoints or dependencies are implemented.

Frontend current behavior:

- Do not send Authorization headers expecting backend handling.
- Do not expose admin controls publicly in production.
- Candidate resume APIs, inquiry submissions, and public jobs do not require a token.
- A deployment token at reverse proxy/CDN level could add infrastructure auth, but it must be configured and documented outside application code.

## 9. CORS

The app sets:

- Origins from `ALLOWED_ORIGINS`, otherwise `["*"]`.
- Credentials allowed.
- Methods GET, POST, PATCH, DELETE, OPTIONS.
- All headers allowed.

Set exact frontend origins in production. Multiple origins are comma-separated with no spaces required.

## 10. Environment variables

Use placeholders only; never paste real secrets into frontend repositories or docs.

| Variable | Required | Purpose | Placeholder |
|---|---|---|---|
| `APP_NAME` | No | Health and app identity | `ugetjob-backend` |
| `ENVIRONMENT` | No | Health environment label | `development` |
| `PORT` | No | Uvicorn port | `8000` |
| `DATABASE_URL` | Yes for DB routes | asyncpg PostgreSQL/Supabase URL | `postgresql+asyncpg://USER:REDACTED@HOST:5432/postgres` |
| `SUPABASE_URL` | Yes for Storage | Supabase project URL | `https://PROJECT_REF.supabase.co` |
| `SUPABASE_KEY` | Referenced configuration | Client/publishable key | `YOUR_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for service uploads | Backend Storage write/signed URL secret | `YOUR_SERVICE_ROLE_KEY` |
| `CANDIDATE_RESUMES_BUCKET` | No | Candidate resume bucket | `candidate-resumes` |
| `COMPANY_DOCUMENTS_BUCKET` | No | Company document bucket | `company-documents` |
| `JOB_ATTACHMENTS_BUCKET` | No | Public job attachment bucket | `job-attachments` |
| `ALLOWED_ORIGINS` | Production | Comma-separated CORS origins | `https://frontend.example.com` |
| `SECRET_KEY` | Recommended | Reserved configuration secret | `replace-with-random-secret` |

`SUPABASE_KEY` is not currently read by Storage code; service-role key is used.

Frontend environment example:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Production deployment:

- Serve API over HTTPS.
- Set the production frontend URL in `ALLOWED_ORIGINS`.
- Use deployment platform environment variables, never committed `.env`.
- Verify database SSL/pooler settings supported by asyncpg.
- Restrict database and service-role access to the backend service.
- Confirm object bucket policies and signed URL behavior after deployment.

## 11. OpenAPI

OpenAPI 3.1 JSON was generated from the FastAPI app successfully. Swagger is served by the app:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/openapi.json`

Google AI Studio/frontend tooling should import the production equivalent `/openapi.json`, review code-generated shapes, and override authentication where none exists. The OpenAPI schema is authoritative for router registration but can omit runtime business restrictions not represented by Pydantic.

## 12. Pagination, filtering, sorting

`GET /api/jobs` paginates and returns `meta.page`, `meta.limit`, and `meta.total`; it sorts urgent first, then featured, then newest posted date. Categories sort by name. Candidate resumes sort primary first and newest next. ATS applications sort newest first. Featured and urgent jobs sort newest first.

## 13. Verification and known gaps

See [BACKEND_GAPS.md](BACKEND_GAPS.md) for security, privacy, route completeness, schema mismatch, and live-deployment items.
