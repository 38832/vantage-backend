# UGETJOB Backend — Global Workforce Solutions & ATS
### Nouman's Manpower Consultancy (FastAPI + SQLAlchemy + Supabase)

Production-grade, asynchronous backend API built with **FastAPI**, **SQLAlchemy 2.0 (asyncpg)**, and **Supabase (PostgreSQL + Object Storage)**.

---

## 🏗️ Architecture & Features

- **Public Job Board API**: High-performance search and multi-filtering across destination countries (UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain), job categories/sectors, GCC experience minimums, and visa status.
- **Candidate Quick Apply**: Dual support for standard JSON and `multipart/form-data` with automatic resume upload directly to Supabase Storage bucket `candidate-resumes`.
- **Recruiter ATS Pipeline**: Full recruitment pipeline stages:
  - `new` ➔ `contacted` ➔ `shortlisted` ➔ `interview_scheduled` ➔ `interviewed` ➔ `document_pending` ➔ `medical_pending` ➔ `visa_pending` ➔ `visa_approved` ➔ `hired` (or `rejected`/`archived`).
- **Internal ATS Recruiter Notes**: Audit log of internal comments on candidate submissions.
- **Inbound Corporate Manpower Requests**: Capture inquiries from overseas project heads and general contractors.
- **Dedicated Service Requests**: Direct booking for GAMCA medicals, visa stamping, trade testing, and workforce flight mobilization.
- **Supabase Storage Integration**: Signed URLs with bucket policies and MIME type enforcement.

---

## 📂 Project Structure

```bash
backend/
├── app/
│   ├── api/
│   │   ├── deps.py                 # Dependency injections (Async DB session)
│   │   └── routes/
│   │       ├── health.py           # /api/health
│   │       ├── jobs.py             # /api/jobs, /api/categories
│   │       ├── applications.py     # /api/applications/quick-apply
│   │       ├── inquiries.py        # /api/inquiries/employer, /api/inquiries/service
│   │       └── admin.py            # /api/admin/ats/applications, /api/admin/dashboard
│   ├── core/
│   │   └── config.py               # Pydantic Settings with .env loading
│   ├── db/
│   │   ├── base.py                 # SQLAlchemy DeclarativeBase
│   │   └── session.py              # Async engine & sessionmaker (asyncpg)
│   ├── models/                     # SQLAlchemy 2.0 mapped models
│   │   ├── job.py
│   │   ├── candidate.py
│   │   ├── application.py
│   │   ├── employer.py
│   │   ├── inquiry.py
│   │   ├── service_request.py
│   │   ├── document.py
│   │   └── ats_note.py
│   ├── schemas/                    # Pydantic v2 validation models
│   │   ├── response.py             # Standard JSON envelope
│   │   ├── job.py
│   │   ├── candidate.py
│   │   ├── application.py
│   │   └── inquiry.py
│   ├── services/
│   │   └── supabase_storage.py     # Supabase Storage client & upload helpers
│   ├── main.py                     # FastAPI application entrypoint
│   └── __init__.py
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- Python 3.10+
- PostgreSQL or Supabase project

### 2. Install Dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Database Migration in Supabase
Run the comprehensive SQL schema migration located in:
```bash
database/schema.sql
```
This initializes all PostgreSQL enums, tables, indexes, storage buckets (`candidate-resumes`, `company-documents`), RLS policies, and seed data.

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `DATABASE_URL` with your Supabase async connection string:
```env
DATABASE_URL="postgresql+asyncpg://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 5. Run the Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger API documentation will be available at:
`http://localhost:8000/docs`

---

## Render deployment

The repository includes a Render Blueprint at `../render.yaml`. It deploys:

- `ugetjob-api`: Dockerized FastAPI service rooted in this `backend` directory.
- `ugetjob-docs`: Static Vite frontend/API console.

### 1. Deploy through Render

1. Push the repository to GitHub or GitLab.
2. In Render, choose **New → Blueprint** and select the repository.
3. Render will detect `render.yaml` and create both services.
4. In the pending environment-variable prompts, enter the production Supabase and allowed-origin values.

### 2. Required API environment variables

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase async PostgreSQL URL, for example `postgresql+asyncpg://...` |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_KEY` | Anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key; keep this secret |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs |

Render supplies `PORT` automatically. The Dockerfile uses it when starting Uvicorn.

After deployment, verify `https://YOUR-SERVICE.onrender.com/api/health` and `https://YOUR-SERVICE.onrender.com/docs`.

---

## Deploying to Render

The repository includes `render.yaml` at its root and deploys both the FastAPI API and the Vite frontend.

1. Push the repository to GitHub or GitLab.
2. In Render, select **New → Blueprint** and connect this repository.
3. Review the proposed `ugetjob-api` and `ugetjob-console` services.
4. Enter the required environment values for `ugetjob-api`.

Required API variables:

- `DATABASE_URL`: Supabase PostgreSQL URL using the `postgresql+asyncpg://` driver.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_KEY`: Supabase anon/publishable key.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service-role key. Keep it secret.
- `ALLOWED_ORIGINS`: Comma-separated frontend URLs, including the final Render frontend URL.

Render supplies `PORT` automatically. The Dockerfile starts Uvicorn on that port.

After deployment, verify:

- API health: `https://YOUR-API-SERVICE.onrender.com/api/health`
- API documentation: `https://YOUR-API-SERVICE.onrender.com/docs`

The existing frontend console contains local-development URLs. Set or update these to the deployed API URL before relying on the console's code snippets.

---

## 📡 API Testing Examples (cURL)

### 1. Search Live Jobs
```bash
curl -X GET "http://localhost:8000/api/jobs?country=Saudi%20Arabia&urgent_only=true" \
     -H "Accept: application/json"
```

### 2. Candidate Quick Apply
```bash
curl -X POST "http://localhost:8000/api/applications/quick-apply" \
     -H "Content-Type: application/json" \
     -d '{
       "job_id": "22222222-2222-2222-2222-222222222201",
       "full_name": "Mohd Basheer",
       "email": "basheer@example.com",
       "phone": "+971500000000",
       "whatsapp": "+971500000000",
       "nationality": "Indian",
       "current_country": "India",
       "current_city": "Kochi",
       "passport_status": "ready",
       "passport_number": "P1234567",
       "years_experience": 7,
       "current_role": "HVAC Chiller Specialist",
       "preferred_country": "Saudi Arabia",
       "preferred_job_category": "hvac",
       "visa_status": "required",
       "willing_to_relocate": true,
       "consent_to_contact": true
     }'
```

### 3. Employer Manpower Request
```bash
curl -X POST "http://localhost:8000/api/inquiries/employer" \
     -H "Content-Type: application/json" \
     -d '{
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
       "urgency": "urgent"
     }'
```

### 4. Admin ATS Status Update
```bash
curl -X PATCH "http://localhost:8000/api/admin/ats/applications/YOUR_APP_UUID" \
     -H "Content-Type: application/json" \
     -d '{
       "application_status": "interview_scheduled",
       "recruiter_assigned": "Nouman Qureshi",
       "interview_date": "2026-11-05T10:00:00Z",
       "interview_notes": "Candidate cleared technical phone screening. Scheduling client interview with Red Sea Project GM."
     }'
```

### 5. Admin ATS Summary KPIs
```bash
curl -X GET "http://localhost:8000/api/admin/dashboard"
```
