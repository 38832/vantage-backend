# UGETJOB API Endpoint Reference

Base URL in development: `http://127.0.0.1:8000`.
All endpoints below are implemented. `ApiResponse` is represented as `{"success": true, "data": ..., "meta": ..., "error": null}` unless noted.

## Health

| Method | Endpoint | Authentication | Response |
|---|---|---|---|
| GET | `/api/health` | None | `{"status":"ok","service":"...","environment":"...","database":"postgresql-asyncpg","storage":"supabase"}` |

## Public jobs and categories

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| GET | `/api/categories` | None | Active categories ordered by name |
| GET | `/api/jobs` | None | Filtered, paginated published jobs |
| GET | `/api/jobs/featured` | None | Featured published jobs |
| GET | `/api/jobs/urgent` | None | Urgent published jobs |
| GET | `/api/jobs/{job_id}` | None | Published or any status job detail (route does not filter status) |

`GET /api/jobs` parameters:

| Parameter | Type | Default | Constraints |
|---|---|---|---|
| `keyword` | string | none | Case-insensitive title, company, description, or city substring |
| `category` | UUID or category slug | none | Unknown category slug produces no category condition |
| `country` | string | none | Case-insensitive exact match |
| `city` | string | none | Case-insensitive substring |
| `employment_type` | string | none | Exact string |
| `visa_required` | boolean | none | Exact boolean |
| `experience_min` | integer | none | `>= 0` |
| `experience_max` | integer | none | `>= 0` |
| `urgent_only` | boolean | false | |
| `featured_only` | boolean | false | |
| `page` | integer | 1 | `>= 1` |
| `limit` | integer | 20 | 1-100 |

Featured and urgent endpoints each accept `limit`, with no FastAPI bounds defined in source. A negative or oversized integer is sent to SQLAlchemy unless validation/storage rejects it.

## Applications and candidate documents

| Method | Endpoint | Authentication | Content type |
|---|---|---|---|
| POST | `/api/applications/quick-apply` | None | `application/json` |
| POST | `/api/applications/quick-apply-multipart` | None | `multipart/form-data` |
| GET | `/api/applications/candidates/{candidate_id}/resumes` | None | None |
| POST | `/api/applications/{application_id}/documents` | None | `multipart/form-data` |

### JSON quick apply

```json
{
  "full_name": "Mohd Basheer",
  "email": "basheer@example.com",
  "phone": "+971500000000",
  "whatsapp": "+971500000000",
  "job_id": "22222222-2222-2222-2222-222222222201",
  "nationality": "Indian",
  "current_country": "India",
  "current_city": "Kochi",
  "passport_status": "ready",
  "passport_number": "P1234567",
  "passport_expiry": "2028-06-30",
  "years_experience": 7,
  "current_job_title": "HVAC Chiller Specialist",
  "current_salary": 350000,
  "preferred_country": "Saudi Arabia",
  "preferred_city": "Riyadh",
  "preferred_job_category": "hvac",
  "visa_status": "required",
  "notice_period": "30 days",
  "willing_to_relocate": true,
  "cover_letter": "Interested in Gulf placement.",
  "consent_to_contact": true,
  "resume_url": null,
  "drive_link": null,
  "resume_source": "drive_link"
}
```

Required JSON fields are `full_name`, `phone`, and Pydantic defaults for booleans. `email`, when provided, must be a valid email. `job_id`, when provided, must be a UUID and an existing job ID.

Success:

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

### Multipart quick apply fields

Required: `full_name`, `phone`.

Optional:
`email`, `whatsapp`, `job_id`, `nationality`, `current_country`, `current_city`,
`passport_status` (default `ready`), `passport_number`, `years_experience` (default `0`),
`current_job_title`, `current_role`, `drive_link`, `resume_source`, `preferred_country`,
`preferred_job_category`, `visa_status` (default `required`), `notice_period`,
`willing_to_relocate` (default true), `cover_letter`, `consent_to_contact` (default true),
and uploaded file field `resume`.

Success:

```json
{
  "success": true,
  "data": {
    "application_id": "uuid",
    "candidate_id": "uuid",
    "resume_url": "signed-or-fallback-url",
    "resume_source": "uploaded_file",
    "message": "Candidate applied successfully with resume registered."
  },
  "meta": null,
  "error": null
}
```

Resume records use UUID candidate lookup and fields such as `original_filename`, `storage_bucket`, `storage_path`, `mime_type`, `file_size_bytes`, `source`, `drive_link`, `is_primary`, and timestamps.

Supporting document multipart fields:

| Field | Required | Type | Default |
|---|---|---|---|
| `file` | Yes | binary file | none |
| `document_type` | No | string | `resume` |

Suggested frontend document types: `resume`, `passport`, `certificate`, `photo`, `other`. The backend does not validate this list.

## Employer inquiries and service requests

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| POST | `/api/inquiries/employer` | None | Create/update employer master and add manpower inquiry |
| POST | `/api/inquiries/service` | None | Create a service request |

Employer request JSON required fields: `company_name`, `contact_name`, `email`, `phone`. Optional fields are `requirement_type` (default `manpower`), `industry`, `job_title`, `number_of_positions` (default 1), `country`, `city`, `work_location` (default `overseas`), `budget_range`, `urgency` (default `normal`), `timeline`, and `notes`.

```json
{
  "company_name": "Riyadh Metro Works",
  "contact_name": "Ali Khan",
  "email": "ali@company.com",
  "phone": "+966500000000",
  "requirement_type": "manpower",
  "industry": "construction",
  "job_title": "Electrical Foreman",
  "number_of_positions": 12,
  "country": "Saudi Arabia",
  "city": "Riyadh",
  "work_location": "overseas",
  "budget_range": "SAR 2500-4000",
  "urgency": "urgent",
  "timeline": "within 2 weeks",
  "notes": "Need qualified professionals"
}
```

Service request required fields: `service_type`, `contact_name`, `email`, `phone`. Optional fields: `company_name`, `city`, `notes`.

```json
{
  "service_type": "visa",
  "company_name": "ABC Logistics",
  "contact_name": "Nadia",
  "email": "nadia@example.com",
  "phone": "+971500123456",
  "city": "Dubai",
  "notes": "Visa and documentation for five workers."
}
```

Both return HTTP 200 and the standard success envelope containing an ID, status `received`, and message.

## Admin and ATS

**No authentication is implemented or enforced on these routes. Treat them as unprotected until authentication is added.**

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| GET | `/api/admin/dashboard` | None in current implementation | ATS KPI counts |
| GET | `/api/admin/ats/applications` | None in current implementation | Search, filter, and paginate applications |
| PATCH | `/api/admin/ats/applications/{application_id}` | None in current implementation | Update ATS stages, recruiter, interview, statuses, and notes |
| POST | `/api/admin/ats/applications/{application_id}/notes` | None in current implementation | Add internal note |
| PATCH | `/api/admin/jobs/{job_id}` | None in current implementation | Update selected job fields |
| DELETE | `/api/admin/jobs/{job_id}` | None in current implementation | Soft-close or hard-delete |
| GET | `/api/admin/logging` | None in current implementation | Check dynamic terminal logging status |
| POST | `/api/admin/logging/toggle` | None in current implementation | Dynamically switch detailed logging ON/OFF (`{"enabled": true/false}`) |

ATS list query parameters: `status`, `recruiter_assigned`, `search`, `page` (default 1, minimum 1), `limit` (default 20, 1-100).

Valid application statuses: `new`, `contacted`, `shortlisted`, `interview_scheduled`, `interviewed`, `document_pending`, `medical_pending`, `visa_pending`, `visa_approved`, `rejected`, `hired`, `archived`.

Application update JSON example:

```json
{
  "application_status": "interview_scheduled",
  "recruiter_assigned": "Nouman",
  "shortlisted_by": "Nouman",
  "interview_date": "2026-11-05T10:00:00Z",
  "interview_notes": "Valid GCC experience",
  "document_status": "pending",
  "medical_status": "pending",
  "visa_status": "not_started",
  "notes": "Follow up on passport"
}
```

All fields in this update model are optional. Unknown fields are ignored by Pydantic default behavior unless OpenAPI/validation behavior changes; send only documented fields.

Job update JSON fields are optional: `title`, `status`, `urgent`, `featured`, `openings_count`, `salary_min`, `salary_max`, `requirements`, `benefits`.

Valid job statuses: `draft`, `published`, `paused`, `closed`, `filled`.

Delete query parameter: `hard_delete` boolean (default false). With false the job is set to `closed`; with true it is permanently deleted.

## Common errors

| Status | Meaning |
|---|---|
| 422 | Pydantic/FastAPI query, path, body, email, UUID, or enum validation failure; response is FastAPI `detail` format, not `ApiResponse` |
| 404 | Known route found no matching job or application |
| 500 | Unhandled database or storage/provider failure |

`/api/inquiries/*` currently do not return typed responses; FastAPI validates requests and database errors are unhandled.
