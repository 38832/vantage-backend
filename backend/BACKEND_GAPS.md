# Backend Gap and Verification Report

## Verification status

- Source inspection and OpenAPI generation: **completed**.
- Automated backend tests: **30 passed**.
- Tests used an in-memory SQLite database and dependency overrides, not the real Supabase PostgreSQL deployment.
- Supabase credentials and live Storage behavior: **not verified**.
- Live production database connectivity and RLS: **not verified**.
- Generated paths were inspected from the FastAPI app without starting a live server.

## Critical implemented security gaps

1. **Admin routes have no authentication or role authorization.**
   Every dashboard, ATS, job-update, and job-delete route is callable anonymously. `AdminUser` exists in models and schema SQL, but there is no login, token, dependency, or role check.
2. **Candidate and document read/upload routes have no authentication.**
   Candidate resumes can be listed by guessed UUID. Supporting documents can be uploaded by application UUID.
3. **Secrets are not part of authentication.**
   `SECRET_KEY` is configured but unused by source searches.
4. **Resume-storage policy may conflict with privacy.**
   SQL sets a public insert policy for `candidate-resumes` while authenticated reads are allowed. Backend uploads use service-role access and may create signed URLs. Storage and table-level access must be audited against actual Supabase deployment.
5. **No table-level RLS policies appear in the schema SQL.**
   Public API access through the backend is only protected by backend authorization; direct Supabase access may depend on external configuration. The backend uses the service role, so Supabase RLS does not protect backend SQL.

## Route and model inconsistencies

- Public job detail by UUID does not filter by `published`. A draft, paused, closed, or filled job is returned if UUID is known.
- JSON quick apply sets a candidate in the database and also creates a `CandidateResume` record with an external link.
- Multipart quick apply always creates a new candidate and does not deduplicate by phone, unlike JSON quick apply. This can create duplicate candidate records.
- Invalid multipart `job_id` is silently converted to null; JSON quick apply validates UUID via Pydantic.
- Invalid multipart `resume_source` and enum-like values are not validated by the route. Candidate assignment `candidate.resume_source = ResumeSource.uploaded_file` is still safe for uploaded files; drive path assigns none when no recognized source because the string is unused unless JSON quick apply.
- Supporting documents are always uploaded through `upload_resume`, placing passport/certificate/photo content in the candidate-resumes bucket rather than a document-specific configured bucket.
- No backend file-size or MIME validation exists, despite a 10 MB and MIME allowlist in schema storage configuration.
- Storage configuration mismatch: `.env.example` sets company bucket to `company-document` while SQL/model configuration uses plural `company-documents`.
- Both storage and database failures can be masked. The storage service catches provider exceptions and returns public fallback URLs.
- Hard-delete response always says `deleted: true`; the database job delete may fail due to foreign-key constraints for applications unless the database is configured with an expected cascade behavior. Applications has `ON DELETE SET NULL`, so it should be possible, but DB state must be verified.
- SQLAlchemy enum behavior differs between SQLite tests and PostgreSQL native enums; live schema compatibility is not fully validated.

## Missing CRUD and workflows

No implemented endpoint exists to:

- Create, list, update, or delete job categories.
- Create or publish jobs; jobs can only be updated/deleted through admin routes.
- List candidates independently.
- Get/update/delete candidate profile.
- Retrieve application details by application ID.
- List an applicant's applications.
- Upload a candidate resume without simultaneously creating an application.
- List, update, or delete application documents.
- Download documents through an application endpoint.
- List/retrieve employer inquiries.
- List/retrieve service requests.
- List/update/delete ATS notes.
- Create/update/delete admin users.
- Login/logout/refresh credentials.
- Enforce recruiter permissions.
- Read recruiter identity from a token.
- Record job-search activity despite `job_search_activity` table.
- Run jobs category hierarchy (parent category exists in DB/model but category responses omit it).

## Tables without API endpoints

The following models/tables have no direct API endpoint:

| Table | Available API interaction |
|---|---|
| `employer_inquiries` | Created by public POST; no read/list endpoint |
| `employers` | Created implicitly; no direct endpoint |
| `service_requests` | Created by public POST; no read/list endpoint |
| `application_documents` | Upload created; no list/get/delete endpoint |
| `candidate_resumes` | Created/upload-listed by candidate ID; no update/delete endpoint |
| `ats_notes` | Created; no list/update/delete endpoint |
| `admin_users` | None |
| `job_search_activity` | None |

`job_categories`, `jobs`, `candidates`, and `applications` have limited public/admin interactions only.

## API/Data mismatches

- Candidate model has `current_role` property compatibility, but database SQL does not have a current_role column; it maps to `current_job_title`.
- `JobUpdate` is not able to change category ID, description, location, visa fields, deadlines, or many fields in `JobDetailOut`.
- Candidate JSON schema exposes `current_role`, but candidate output models are not used by any route.
- `EmployerInquiryOut` and `ServiceRequestOut` schemas exist, but inquiries routes return ad hoc dictionaries without response models.
- Supporting document response type is ad hoc and not documented by a Pydantic model.
- `AdminUser` has password hash storage but no authentication implementation.
- Schema SQL creates storage buckets but the API cannot provision missing buckets itself; it catches failures and falls back.
- Schema has `company_documents` bucket but `.env.example` has `company-document`; verify actual deployment bucket name.
- No API endpoint exists for `company-documents` or `job-attachments`, despite configured bucket settings and storage helper methods.

## Candidate and resume privacy issues

- `GET /api/applications/candidates/{candidate_id}/resumes` exposes storage paths and drive URLs when a UUID is known.
- Candidate resume listing response includes storage bucket/path and external URL fields.
- Document upload response returns a signed URL/fallback public URL.
- Public JSON quick apply creates and updates candidate records based only on phone number; no OTP or ownership verification.
- There is no duplicate check, candidate deletion, or candidate consent proof endpoint.

## Error handling gaps

- Validation errors are FastAPI standard 422 responses.
- Application and job database/runtime errors are generally unhandled.
- The storage service catches all provider exceptions and silently substitutes mock/fallback URLs, which can hide misconfiguration.
- Inquiry routes do not declare a response model or error code.
- Featured and urgent limits have no bounds even though bulk job route limits do.

## Broken or unverified items

- Live Supabase upload signed URLs cannot be verified without credentials and a live database.
- Whether SQL bucket and policy statements execute successfully cannot be verified from source alone.
- Real PostgreSQL enum names/values should be checked against migration state because SQLAlchemy creates enum types differently depending on metadata creation paths.
- Production public fallback URLs may expose private objects if a bucket is assumed public or an upload fails silently.
- Server startup against the configured `.env` and real database was not performed in this audit.

## Recommended implementation priorities

1. Add login/token dependencies to admin routes and optionally recruiter- and candidate-specific routes.
2. Add authorization checks based on verified identity and roles.
3. Add server-side file size/MIME/filename validation and configurable duration for signed URLs.
4. Stop returning signed URLs or storage paths for unauthenticated resume/document endpoints.
5. Add list/get/refresh/download/revoke endpoints for resumes and application documents.
6. Add candidates and inquiries read APIs or scoped admin-only read APIs.
7. Make category creation a separate admin operation and support job creation.
8. Fix the multipart candidate duplicate behavior and invalid-job-ID behavior.
9. Add robust storage error responses rather than public fallback URLs on every provider failure.
10. Implement table RLS independently and test direct Supabase client access, not just backend service-role access.
