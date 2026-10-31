# Frontend Integration Checklist

## 1. Configure the API client

- [ ] Set the frontend API base URL to `VITE_API_BASE_URL`.
- [ ] Use `http://127.0.0.1:8000` for local development.
- [ ] Do not hard-code secrets or add `SUPABASE_SERVICE_ROLE_KEY` to frontend code.
- [ ] Add backend production and local origins to `ALLOWED_ORIGINS`.
- [ ] Send JSON requests with `Content-Type: application/json`.
- [ ] Send file requests as `multipart/form-data`; let the browser construct the boundary.
- [ ] Treat the API base URL as origin plus optional deployment prefix; the routes themselves do not use a prefix beyond `/api` or `/api/admin`.

## 2. Verify connectivity

- [ ] Call `GET /api/health`.
- [ ] Call `GET /api/categories`.
- [ ] Call `GET /api/jobs`.
- [ ] Check both Swagger and OpenAPI URLs.
- [ ] Confirm deployed HTTPS mixed-content and CORS settings.

## 3. Build job discovery

- [ ] Load active categories from `GET /api/categories`.
- [ ] Pass category UUID or slug to the `category` filter.
- [ ] Use `page`/`limit` and response `meta.total`.
- [ ] Implement the supported keyword, country, city, employment, visa, experience, urgent, and featured filters.
- [ ] Use `GET /api/jobs/featured` and `GET /api/jobs/urgent` for homepage sections.
- [ ] Fetch job details with `GET /api/jobs/{job_id}`.
- [ ] Use UUID in job-detail links and submitted `job_id` values.
- [ ] Display fields supplied by `JobListItemOut`; use detail-only fields only on detail responses.

## 4. Build candidate quick apply

- [ ] Default to JSON quick apply when the candidate supplies a Drive/external resume URL.
- [ ] Use multipart quick apply when a resume file is present.
- [ ] Send required candidate fields `full_name` and `phone`.
- [ ] Validate email locally using the same valid-email expectation as Pydantic.
- [ ] Keep UUID `job_id` optional; route unknown job IDs to the 404 UI state.
- [ ] Map `current_role` to `current_job_title` if the form uses role terminology.
- [ ] Submit consent booleans deliberately; defaults are not consent policy.
- [ ] Store `application_id` and `candidate_id` returned after submission.
- [ ] Do not assume returned `resume_url` is always a private signed URL; the storage service may also return a configured fallback public URL.

## 5. Build document handling

- [ ] Use `POST /api/applications/{application_id}/documents` for passport, certificate, photo, and other supporting files.
- [ ] Include file field name `file` exactly.
- [ ] Send `document_type` exactly (the backend supports a string, without an enforced enum).
- [ ] Keep the application ID from quick apply.
- [ ] Keep `storage_path` for admin/candidate association, but route sensitive document access through an authorized backend before release.
- [ ] Do not place Supabase service-role credentials in frontend storage.
- [ ] Respect schema bucket limits and MIME allowlists even though backend routes add no explicit size/MIME validation.

## 6. Build employer and service forms

- [ ] Validate required employer fields and `email`.
- [ ] Post manpower inquiries to `/api/inquiries/employer`.
- [ ] Post service requests to `/api/inquiries/service`.
- [ ] Handle HTTP 200 success and display the returned message.
- [ ] Do not expect an admin GET/list endpoint for either form submission.

## 7. Build recruiter/admin screens

- [ ] Treat every `/api/admin/*` route as sensitive.
- [ ] Add backend authentication before exposing these screens in a real deployment.
- [ ] Add Authorization handling only after the backend implements it; no token scheme exists today.
- [ ] Load KPIs from `/api/admin/dashboard`.
- [ ] Use status, recruiter, search, page, and limit filters on the ATS list.
- [ ] Update applications with documented patch fields.
- [ ] Add notes with application ID and body fields `author_name`, `note`.
- [ ] Update only implemented job fields.
- [ ] Default deletion UI to soft close, requiring a separate confirmed hard-delete action.

## 8. Handle responses and errors

- [ ] Success envelope: check `success` and read `data`.
- [ ] Use `meta.page`, `meta.limit`, and `meta.total` for pagination.
- [ ] Handle FastAPI 422 arrays under `detail`, since they differ from `ApiResponse.error`.
- [ ] Handle 404 for unknown UUIDs.
- [ ] Display generic recoverable errors for 500 responses.
- [ ] Do not log candidate phone numbers, passport data, resumes, or inquiry notes in analytics.

## 9. Security before production

- [ ] Do not ship the unprotected admin routes to public users until authentication and authorization are added.
- [ ] Do not rely on Supabase browser public policies for candidate documents.
- [ ] Review RLS independently from service-role backend access.
- [ ] Restrict production CORS origins; avoid wildcard origins.
- [ ] Set a strong backend `SECRET_KEY` even though auth does not currently use it.
- [ ] Use HTTPS for frontend, API, signed URLs, and cookies/tokens in any future authentication design.
