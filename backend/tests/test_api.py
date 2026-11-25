from datetime import datetime, timezone
import uuid

import pytest
from app.models.job import JobCategory, Job, JobStatus
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStatus


async def seed_category(db, slug="electrical", name="Electrical"):
    category = JobCategory(slug=slug, name=name, description=f"{name} jobs")
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def seed_job(db, category, **overrides):
    values = dict(
        category_id=category.id,
        title="Site Electrician",
        company_name="Gulf Contractors",
        location_country="UAE",
        location_city="Dubai",
        employment_type="full_time",
        visa_required=True,
        experience_min=3,
        experience_max=8,
        salary_min=1800,
        salary_max=3000,
        salary_currency="AED",
        job_description="Electrical installation and maintenance work.",
        requirements="Valid trade certificate",
        urgent=True,
        featured=False,
        skills=["electrical", "maintenance"],
        openings_count=5,
        status=JobStatus.published,
        posted_at=datetime.now(timezone.utc),
    )
    values.update(overrides)
    job = Job(**values)
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "ugetjob-backend"


@pytest.mark.asyncio
async def test_categories_and_empty_categories(client, db_session):
    response = await client.get("/api/categories")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert {category["slug"] for category in response.json()["data"]} >= {
        "construction", "technical", "office",
    }

    await seed_category(db_session)
    response = await client.get("/api/categories")
    assert response.status_code == 200
    assert "electrical" in {category["slug"] for category in response.json()["data"]}


@pytest.mark.asyncio
async def test_job_list_filters_and_pagination(client, db_session):
    category = await seed_category(db_session)
    await seed_job(db_session, category)
    await seed_job(db_session, category, title="Project Engineer", urgent=False, featured=True,
                   employment_type="contract", visa_required=False, location_country="Qatar")

    response = await client.get("/api/jobs", params={
        "country": "UAE", "category": "electrical", "employment_type": "full_time",
        "visa_required": "true", "experience_min": 3, "experience_max": 8,
        "urgent_only": "true", "featured_only": "false", "page": 1, "limit": 20,
    })
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["meta"]["total"] == 1
    assert body["data"][0]["title"] == "Site Electrician"


@pytest.mark.asyncio
async def test_job_keyword_country_city_and_featured_filters(client, db_session):
    category = await seed_category(db_session)
    await seed_job(db_session, category)

    assert (await client.get("/api/jobs", params={"keyword": "electrician"})).json()["meta"]["total"] == 1
    assert (await client.get("/api/jobs", params={"city": "Dubai"})).json()["meta"]["total"] == 1
    assert (await client.get("/api/jobs", params={"country": "uae"})).json()["meta"]["total"] == 1
    assert (await client.get("/api/jobs", params={"featured_only": "true"})).json()["meta"]["total"] == 0


@pytest.mark.asyncio
async def test_job_featured_and_urgent_endpoints(client, db_session):
    category = await seed_category(db_session)
    await seed_job(db_session, category)

    urgent = await client.get("/api/jobs/urgent")
    featured = await client.get("/api/jobs/featured")
    assert urgent.status_code == 200
    assert len(urgent.json()["data"]) == 1
    assert featured.status_code == 200
    assert featured.json()["data"] == []


@pytest.mark.asyncio
async def test_job_detail_and_not_found(client, db_session):
    category = await seed_category(db_session)
    job = await seed_job(db_session, category)

    response = await client.get(f"/api/jobs/{job.id}")
    assert response.status_code == 200
    assert response.json()["data"]["job_description"] == "Electrical installation and maintenance work."

    response = await client.get(f"/api/jobs/{uuid.uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_published_job(client, db_session):
    category = await seed_category(db_session)
    response = await client.post("/api/jobs", json={
        "category_id": str(category.id),
        "title": "Site Electrician",
        "company_name": "Gulf Contractors",
        "location_country": "UAE",
        "location_city": "Dubai",
        "job_description": "Electrical installation work.",
        "benefits": "Visa, accommodation",
    })

    assert response.status_code == 200, response.text
    assert response.json()["data"]["status"] == "published"

    list_response = await client.get("/api/jobs?limit=50")
    assert list_response.status_code == 200
    assert list_response.json()["data"][0]["title"] == "Site Electrician"


@pytest.mark.asyncio
async def test_create_job_parses_salary_and_categories(client, db_session):
    category_response = await client.get("/api/categories")
    categories = category_response.json()["data"]
    technical = next(category for category in categories if category["slug"] == "technical")

    single_salary = await client.post("/api/jobs", json={
        "category_id": str(technical["id"]),
        "title": "Demo Urgent",
        "company_name": "ARAMCO",
        "location_country": "Saudi Arabia",
        "location_city": "Jeddah",
        "job_description": "Construction requirement.",
        "salary": "SAR 231111",
    })
    assert single_salary.status_code == 200, single_salary.text
    assert float(single_salary.json()["data"]["salary_min"]) == 231111
    assert single_salary.json()["data"]["salary_currency"] == "SAR"
    assert single_salary.json()["data"]["salary_max"] is None

    salary_range = await client.post("/api/jobs", json={
        "category_id": str(technical["id"]),
        "title": "Software Developer",
        "company_name": "Société d'Exploitation de la Tour Eiffel (SETE)",
        "location_country": "Europe",
        "location_city": "Paris",
        "job_description": "Software engineering role.",
        "salary": "EUR 55,000 - 75,000 per year",
    })
    assert salary_range.status_code == 200, salary_range.text
    data = salary_range.json()["data"]
    assert data["salary_currency"] == "EUR"
    assert float(data["salary_min"]) == 55000
    assert float(data["salary_max"]) == 75000

    no_salary = await client.post("/api/jobs", json={
        "category_id": str(technical["id"]),
        "title": "Entry Level",
        "company_name": "Example",
        "location_country": "Europe",
        "job_description": "Training role.",
    })
    assert no_salary.status_code == 200
    assert no_salary.json()["data"]["salary_min"] is None


@pytest.mark.asyncio
async def test_job_invalid_uuid(client):
    response = await client.get("/api/jobs/not-a-uuid")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_quick_apply_json(client, db_session):
    category = await seed_category(db_session)
    job = await seed_job(db_session, category)
    payload = {
        "job_id": str(job.id), "full_name": "Mohd Basheer", "email": "candidate@example.com",
        "phone": "+971500000000", "whatsapp": "+971500000000", "nationality": "Indian",
        "current_country": "India", "current_city": "Kochi", "passport_status": "ready",
        "passport_number": "P1234567", "passport_expiry": "2028-06-30", "years_experience": 7,
        "current_role": "HVAC Chiller Specialist", "current_salary": 350000,
        "preferred_country": "Saudi Arabia", "preferred_city": "Riyadh", "preferred_job_category": "hvac",
        "visa_status": "required", "notice_period": "30 days", "willing_to_relocate": True,
        "cover_letter": "Interested in long-term Gulf placement.", "consent_to_contact": True,
    }
    response = await client.post("/api/applications/quick-apply", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert uuid.UUID(data["application_id"])
    assert uuid.UUID(data["candidate_id"])


@pytest.mark.asyncio
async def test_quick_apply_without_job(client):
    payload = {"full_name": "Test Candidate", "phone": "+971500000111",
               "consent_to_contact": True}
    response = await client.post("/api/applications/quick-apply", json=payload)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_quick_apply_missing_required_fields(client):
    response = await client.post("/api/applications/quick-apply", json={"phone": "123"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_quick_apply_invalid_email(client):
    response = await client.post("/api/applications/quick-apply", json={
        "full_name": "Test Candidate", "phone": "123", "email": "not-an-email"
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_quick_apply_unknown_job(client):
    response = await client.post("/api/applications/quick-apply", json={
        "job_id": str(uuid.uuid4()), "full_name": "Test Candidate", "phone": "123"
    })
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_quick_apply_multipart_with_resume(client):
    response = await client.post("/api/applications/quick-apply-multipart", data={
        "full_name": "Multipart Candidate", "phone": "+971500000222", "email": "multi@example.com",
        "current_job_title": "Heavy Crane Operator", "passport_status": "ready",
        "visa_status": "required", "consent_to_contact": "true",
    }, files={"resume": ("resume.pdf", b"%PDF-1.4 test resume", "application/pdf")})
    assert response.status_code == 200, response.text
    body = response.json()["data"]
    assert uuid.UUID(body["application_id"])
    assert body["resume_url"]
    assert body["resume_source"] == "uploaded_file"

    cand_id = body["candidate_id"]
    resumes_resp = await client.get(f"/api/applications/candidates/{cand_id}/resumes")
    assert resumes_resp.status_code == 200
    resumes_data = resumes_resp.json()["data"]
    assert len(resumes_data) >= 1
    assert resumes_data[0]["original_filename"] == "resume.pdf"
    assert resumes_data[0]["source"] == "uploaded_file"
    assert resumes_data[0]["is_primary"] is True


@pytest.mark.asyncio
async def test_quick_apply_drive_link_creates_candidate_resume(client, db_session):
    category = await seed_category(db_session, slug="hvac-services", name="HVAC Services")
    job = await seed_job(db_session, category, title="Chiller Tech")
    drive_url = "https://drive.google.com/file/d/1A2B3C4D5E6F/view?usp=sharing"
    payload = {
        "job_id": str(job.id),
        "full_name": "Tariq Mansoor",
        "phone": "+971529998877",
        "email": "tariq@example.com",
        "current_job_title": "Lead Chiller Tech",
        "drive_link": drive_url,
        "consent_to_contact": True,
    }
    response = await client.post("/api/applications/quick-apply", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["resume_source"] == "drive_link"
    assert data["resume_url"] == drive_url

    cand_id = data["candidate_id"]
    resumes_resp = await client.get(f"/api/applications/candidates/{cand_id}/resumes")
    assert resumes_resp.status_code == 200
    resumes_data = resumes_resp.json()["data"]
    assert len(resumes_data) == 1
    assert resumes_data[0]["source"] == "drive_link"
    assert resumes_data[0]["drive_link"] == drive_url
    assert resumes_data[0]["is_primary"] is True


@pytest.mark.asyncio
async def test_supporting_document_upload(client, db_session):
    application = Application(candidate_id=(await _create_candidate(db_session)).id,
                              application_status=ApplicationStatus.new)
    db_session.add(application)
    await db_session.commit()
    await db_session.refresh(application)

    response = await client.post(f"/api/applications/{application.id}/documents", data={
        "document_type": "passport"
    }, files={"file": ("passport.pdf", b"%PDF-1.4 passport data", "application/pdf")})
    assert response.status_code == 200, response.text
    assert response.json()["data"]["application_id"] == str(application.id)
    assert response.json()["data"]["storage_path"]


async def _create_candidate(db_session):
    from app.models.candidate import Candidate
    candidate = Candidate(full_name="Document Candidate", phone="+971500000333")
    db_session.add(candidate)
    await db_session.commit()
    await db_session.refresh(candidate)
    return candidate


@pytest.mark.asyncio
async def test_document_upload_unknown_application(client):
    response = await client.post(f"/api/applications/{uuid.uuid4()}/documents", data={
        "document_type": "resume"
    }, files={"file": ("resume.docx", b"resume", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")})
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_employer_inquiry(client):
    payload = {
        "company_name": "Riyadh Metro Works", "contact_name": "Ali Khan",
        "email": "ali@company.com", "phone": "+966500000000", "requirement_type": "manpower",
        "industry": "construction", "job_title": "Electrical Foreman", "number_of_positions": 12,
        "country": "Saudi Arabia", "city": "Riyadh", "work_location": "overseas",
        "budget_range": "SAR 2500-4000", "urgency": "urgent",
        "timeline": "within 2 weeks", "notes": "Need qualified professionals"
    }
    response = await client.post("/api/inquiries/employer", json=payload)
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "received"
    assert uuid.UUID(response.json()["data"]["id"])


@pytest.mark.asyncio
async def test_employer_inquiry_validation(client):
    response = await client.post("/api/inquiries/employer", json={
        "company_name": "Company", "contact_name": "Name", "email": "invalid", "phone": "123"
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_service_request(client):
    payload = {"service_type": "visa", "company_name": "ABC Logistics", "contact_name": "Nadia",
               "email": "nadia@example.com", "phone": "+971500123456", "city": "Dubai",
               "notes": "Visa and documentation for five workers."}
    response = await client.post("/api/inquiries/service", json=payload)
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "received"
    assert response.json()["data"]["service_type"] == "visa"


@pytest.mark.asyncio
async def test_service_request_missing_required_fields(client):
    response = await client.post("/api/inquiries/service", json={"service_type": "visa", "contact_name": "Nadia"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_ats_list_filters_search_and_pagination(client, db_session):
    category = await seed_category(db_session)
    job = await seed_job(db_session, category)
    candidate = await _create_candidate(db_session)
    application = Application(candidate_id=candidate.id, job_id=job.id,
                              recruiter_assigned="Nouman",
                              application_status=ApplicationStatus.shortlisted)
    db_session.add(application)
    await db_session.commit()

    response = await client.get("/api/admin/ats/applications", params={
        "status": "shortlisted", "recruiter_assigned": "nouman", "search": "Document", "page": 1, "limit": 20
    })
    assert response.status_code == 200, response.text
    assert response.json()["meta"]["total"] == 1
    app_data = response.json()["data"][0]
    assert app_data["candidate_name"] == "Document Candidate"
    assert app_data["phone"] == "+971500000333"
    assert "target_trade" in app_data
    assert "destination" in app_data
    assert "passport_status" in app_data


@pytest.mark.asyncio
async def test_ats_update_application(client, db_session):
    candidate = await _create_candidate(db_session)
    application = Application(candidate_id=candidate.id, application_status=ApplicationStatus.new)
    db_session.add(application)
    await db_session.commit()
    await db_session.refresh(application)

    payload = {"application_status": "interview_scheduled", "recruiter_assigned": "Nouman",
               "interview_date": "2026-11-05T10:00:00Z", "interview_notes": "Valid GCC experience",
               "document_status": "pending", "medical_status": "pending", "visa_status": "not_started",
               "notes": "Follow up on passport"}
    response = await client.patch(f"/api/admin/ats/applications/{application.id}", json=payload)
    assert response.status_code == 200
    assert response.json()["data"]["application_status"] == "interview_scheduled"


@pytest.mark.asyncio
async def test_ats_update_unknown_application(client):
    response = await client.patch(f"/api/admin/ats/applications/{uuid.uuid4()}", json={"notes": "test"})
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_ats_invalid_status(client, db_session):
    candidate = await _create_candidate(db_session)
    application = Application(candidate_id=candidate.id)
    db_session.add(application)
    await db_session.commit()
    await db_session.refresh(application)
    response = await client.patch(f"/api/admin/ats/applications/{application.id}", json={"application_status": "unknown"})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_ats_bulk_update_applications_success(client, db_session):
    c1 = await _create_candidate(db_session)
    c2 = await _create_candidate(db_session)
    c3 = await _create_candidate(db_session)
    app1 = Application(candidate_id=c1.id, application_status=ApplicationStatus.new)
    app2 = Application(candidate_id=c2.id, application_status=ApplicationStatus.contacted)
    app3 = Application(candidate_id=c3.id, application_status=ApplicationStatus.new)
    db_session.add_all([app1, app2, app3])
    await db_session.commit()
    await db_session.refresh(app1)
    await db_session.refresh(app2)
    await db_session.refresh(app3)

    payload = {
        "application_ids": [str(app1.id), str(app2.id), str(app1.id)],
        "application_status": "shortlisted",
        "recruiter_assigned": "Nouman",
    }
    response = await client.patch("/api/admin/ats/applications/bulk-status", json=payload)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated_count"] == 2
    assert set(data["updated_ids"]) == {str(app1.id), str(app2.id)}
    assert data["missing_ids"] == []
    assert data["application_status"] == "shortlisted"
    assert data["recruiter_assigned"] == "Nouman"

    await db_session.refresh(app1)
    await db_session.refresh(app2)
    await db_session.refresh(app3)
    assert app1.application_status == ApplicationStatus.shortlisted
    assert app2.application_status == ApplicationStatus.shortlisted
    assert app1.recruiter_assigned == "Nouman"
    assert app2.recruiter_assigned == "Nouman"
    assert app3.application_status == ApplicationStatus.new


@pytest.mark.asyncio
async def test_ats_bulk_update_applications_partial_missing(client, db_session):
    candidate = await _create_candidate(db_session)
    app = Application(candidate_id=candidate.id, application_status=ApplicationStatus.new)
    db_session.add(app)
    await db_session.commit()
    await db_session.refresh(app)

    missing_id = str(uuid.uuid4())
    response = await client.patch(
        "/api/admin/ats/applications/bulk-status",
        json={"application_ids": [str(app.id), missing_id], "application_status": "archived"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["updated_count"] == 1
    assert data["updated_ids"] == [str(app.id)]
    assert data["missing_ids"] == [missing_id]
    assert data["application_status"] == "archived"


@pytest.mark.asyncio
async def test_ats_bulk_update_applications_all_missing_returns_404(client):
    response = await client.patch(
        "/api/admin/ats/applications/bulk-status",
        json={"application_ids": [str(uuid.uuid4())], "application_status": "shortlisted"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_ats_bulk_update_applications_empty_list_returns_422(client):
    response = await client.patch(
        "/api/admin/ats/applications/bulk-status",
        json={"application_ids": [], "application_status": "shortlisted"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_ats_bulk_update_applications_unauthenticated_returns_401(unauthenticated_client):
    response = await unauthenticated_client.patch(
        "/api/admin/ats/applications/bulk-status",
        json={"application_ids": [str(uuid.uuid4())], "application_status": "shortlisted"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_ats_export_csv_success(client, db_session):
    from app.models.candidate import Candidate

    c1 = Candidate(
        full_name="=CMD_INJECTION",
        phone="+971500002001",
        email="export1@example.com",
        current_job_title="6G Welder",
        preferred_country="Saudi Arabia",
        years_experience=6,
        passport_status="ready",
    )
    db_session.add(c1)
    await db_session.commit()
    await db_session.refresh(c1)

    app1 = Application(candidate_id=c1.id, application_status=ApplicationStatus.shortlisted, recruiter_assigned="Nouman")
    db_session.add(app1)
    await db_session.commit()

    response = await client.get("/api/admin/ats/applications/export?format=csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert ".csv" in response.headers["content-disposition"]

    body = response.text
    assert "Candidate Name,Phone,WhatsApp,Email,Target Trade" in body
    assert "'=CMD_INJECTION" in body
    assert "'+971500002001" in body
    assert "6G Welder" in body
    assert "shortlisted" in body


@pytest.mark.asyncio
async def test_ats_export_excel_success(client, db_session):
    candidate = await _create_candidate(db_session)
    app = Application(candidate_id=candidate.id, application_status=ApplicationStatus.new)
    db_session.add(app)
    await db_session.commit()

    response = await client.get("/api/admin/ats/applications/export?format=excel")
    assert response.status_code == 200
    assert "application/vnd.ms-excel" in response.headers["content-type"]
    assert ".xls" in response.headers["content-disposition"]

    body = response.text
    assert "<Workbook" in body
    assert "Document Candidate" in body


@pytest.mark.asyncio
async def test_ats_export_filtered_by_ids_and_status(client, db_session):
    c1 = await _create_candidate(db_session)
    c2 = await _create_candidate(db_session)
    app1 = Application(candidate_id=c1.id, application_status=ApplicationStatus.shortlisted)
    app2 = Application(candidate_id=c2.id, application_status=ApplicationStatus.new)
    db_session.add_all([app1, app2])
    await db_session.commit()
    await db_session.refresh(app1)
    await db_session.refresh(app2)

    res_status = await client.get("/api/admin/ats/applications/export?format=csv&status=shortlisted")
    assert res_status.status_code == 200
    lines_status = [line for line in res_status.text.strip().splitlines() if line]
    assert len(lines_status) == 2

    res_ids = await client.get(f"/api/admin/ats/applications/export?format=csv&application_ids={app2.id}")
    assert res_ids.status_code == 200
    lines_ids = [line for line in res_ids.text.strip().splitlines() if line]
    assert len(lines_ids) == 2
    assert "new" in lines_ids[1]


@pytest.mark.asyncio
async def test_ats_export_unauthenticated_returns_401(unauthenticated_client):
    response = await unauthenticated_client.get("/api/admin/ats/applications/export?format=csv")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_add_ats_note(client, db_session):
    candidate = await _create_candidate(db_session)
    application = Application(candidate_id=candidate.id)
    db_session.add(application)
    await db_session.commit()
    await db_session.refresh(application)

    response = await client.post(f"/api/admin/ats/applications/{application.id}/notes", json={
        "author_name": "Nouman", "note": "Suitable for UAE hospital project."
    })
    assert response.status_code == 200
    assert response.json()["data"]["note"] == "Suitable for UAE hospital project."


@pytest.mark.asyncio
async def test_admin_update_job(client, db_session):
    category = await seed_category(db_session)
    job = await seed_job(db_session, category)
    response = await client.patch(f"/api/admin/jobs/{job.id}", json={
        "status": "paused", "featured": True, "urgent": True, "openings_count": 5
    })
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "paused"


@pytest.mark.asyncio
async def test_admin_update_unknown_job(client):
    response = await client.patch(f"/api/admin/jobs/{uuid.uuid4()}", json={"status": "closed"})
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_admin_delete_and_archive_job(client, db_session):
    category = await seed_category(db_session)
    job = await seed_job(db_session, category)

    response = await client.delete(f"/api/admin/jobs/{job.id}")
    assert response.status_code == 200
    assert response.json()["data"]["mode"] == "closed"

    await db_session.refresh(job)
    assert job.status == JobStatus.closed


@pytest.mark.asyncio
async def test_admin_hard_delete_job(client, db_session):
    category = await seed_category(db_session)
    job = await seed_job(db_session, category)
    response = await client.delete(f"/api/admin/jobs/{job.id}?hard_delete=true")
    assert response.status_code == 200
    assert response.json()["data"]["deleted"] is True


@pytest.mark.asyncio
async def test_dashboard_counts(client, db_session):
    candidate = await _create_candidate(db_session)
    db_session.add_all([
        Application(candidate_id=candidate.id, application_status=ApplicationStatus.new),
        Application(candidate_id=candidate.id, application_status=ApplicationStatus.shortlisted),
        Application(candidate_id=candidate.id, application_status=ApplicationStatus.visa_pending),
        Application(candidate_id=candidate.id, application_status=ApplicationStatus.hired),
    ])
    await db_session.commit()

    response = await client.get("/api/admin/dashboard")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total_applications"] == 4
    assert data["new_applications"] == 1
    assert data["shortlisted"] == 1
    assert data["visa_pending"] == 1
    assert data["hired"] == 1


@pytest.mark.asyncio
async def test_dynamic_logging_status_and_toggle(client):
    # Check default status
    res = await client.get("/api/admin/logging")
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert "detailed_logs_enabled" in res.json()

    # Toggle off
    toggle_res = await client.post("/api/admin/logging/toggle", json={"enabled": False})
    assert toggle_res.status_code == 200
    assert toggle_res.json()["detailed_logs_enabled"] is False

    # Check status reflects disabled
    status_off = await client.get("/api/admin/logging")
    assert status_off.json()["detailed_logs_enabled"] is False

    # Toggle back on
    toggle_on = await client.post("/api/admin/logging/toggle", json={"enabled": True})
    assert toggle_on.status_code == 200
    assert toggle_on.json()["detailed_logs_enabled"] is True


@pytest.mark.asyncio
async def test_admin_route_unauthenticated_returns_401(unauthenticated_client):
    response = await unauthenticated_client.get("/api/admin/ats/applications")
    assert response.status_code == 401
    assert "Authorization" in response.json()["detail"] or "Authentication required" in response.json()["detail"]


@pytest.mark.asyncio
async def test_admin_route_invalid_token_returns_401(unauthenticated_client):
    response = await unauthenticated_client.get(
        "/api/admin/ats/applications",
        headers={"Authorization": "Bearer invalid.jwt.token"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_route_non_recruiter_role_returns_403(unauthenticated_client):
    from app.core.auth import create_access_token
    candidate_token = create_access_token({
        "sub": "candidate-99",
        "email": "applicant@example.com",
        "role": "candidate"
    })
    response = await unauthenticated_client.get(
        "/api/admin/ats/applications",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    assert response.status_code == 403
    assert "role" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_route_with_recruiter_jwt_succeeds(unauthenticated_client, db_session):
    from app.core.auth import create_access_token
    recruiter_token = create_access_token({
        "sub": "recruiter-nouman",
        "email": "nouman@ugetjob.com",
        "role": "recruiter",
        "name": "Nouman Qureshi"
    })
    response = await unauthenticated_client.get(
        "/api/admin/ats/applications",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Test /api/admin/me
    me_res = await unauthenticated_client.get(
        "/api/admin/me",
        headers={"Authorization": f"Bearer {recruiter_token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["data"]["role"] == "recruiter"


@pytest.mark.asyncio
async def test_auth_login_issues_token_for_supabase_staff_account(
    unauthenticated_client, monkeypatch
):
    from types import SimpleNamespace
    from app.api.routes import auth as auth_routes

    user = SimpleNamespace(
        id="admin-123",
        email="admin@example.com",
        app_metadata={"role": "admin"},
        user_metadata={"full_name": "Example Admin"},
    )
    auth_response = SimpleNamespace(
        user=user,
        session=SimpleNamespace(access_token="supabase-token"),
    )
    fake_client = SimpleNamespace(
        auth=SimpleNamespace(
            sign_in_with_password=lambda credentials: auth_response
        )
    )
    monkeypatch.setattr(auth_routes, "create_client", lambda url, key: fake_client)
    monkeypatch.setattr(auth_routes.settings, "supabase_url", "https://example.supabase.co")
    monkeypatch.setattr(auth_routes.settings, "supabase_key", "valid-test-key")

    response = await unauthenticated_client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "valid-password"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["role"] == "admin"
    assert data["user"]["id"] == "admin-123"
    assert data["user"]["full_name"] == "Example Admin"

    verify_response = await unauthenticated_client.get(
        "/api/auth/verify",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert verify_response.status_code == 200
    assert verify_response.json()["data"]["role"] == "admin"

    admin_response = await unauthenticated_client.get(
        "/api/admin/me",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert admin_response.status_code == 200


@pytest.mark.asyncio
async def test_auth_login_rejects_invalid_credentials(unauthenticated_client, monkeypatch):
    from types import SimpleNamespace
    from supabase import AuthInvalidCredentialsError
    from app.api.routes import auth as auth_routes

    auth_routes._reset_cached_client()

    def reject_credentials(credentials):
        raise AuthInvalidCredentialsError("Invalid login credentials")

    fake_client = SimpleNamespace(
        auth=SimpleNamespace(sign_in_with_password=reject_credentials)
    )
    monkeypatch.setattr(auth_routes, "create_client", lambda url, key: fake_client)
    monkeypatch.setattr(auth_routes.settings, "supabase_url", "https://example.supabase.co")
    monkeypatch.setattr(auth_routes.settings, "supabase_key", "valid-test-key")

    response = await unauthenticated_client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "wrong-password"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


@pytest.mark.asyncio
async def test_auth_login_does_not_trust_user_metadata_role(
    unauthenticated_client, monkeypatch
):
    from types import SimpleNamespace
    from app.api.routes import auth as auth_routes

    auth_routes._reset_cached_client()

    user = SimpleNamespace(
        id="user-123",
        email="user@example.com",
        app_metadata={},
        user_metadata={"role": "admin"},
    )
    auth_response = SimpleNamespace(
        user=user,
        session=SimpleNamespace(access_token="supabase-token"),
    )
    fake_client = SimpleNamespace(
        auth=SimpleNamespace(
            sign_in_with_password=lambda credentials: auth_response
        )
    )
    monkeypatch.setattr(auth_routes, "create_client", lambda url, key: fake_client)
    monkeypatch.setattr(auth_routes.settings, "supabase_url", "https://example.supabase.co")
    monkeypatch.setattr(auth_routes.settings, "supabase_key", "valid-test-key")

    response = await unauthenticated_client.post(
        "/api/auth/login",
        json={
            "email": "user@example.com",
            "password": "valid-password",
            "role": "admin",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_auth_login_requires_supabase_configuration(unauthenticated_client, monkeypatch):
    from app.api.routes import auth as auth_routes

    monkeypatch.setattr(auth_routes.settings, "supabase_url", "")
    monkeypatch.setattr(auth_routes.settings, "supabase_key", "")

    response = await unauthenticated_client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "valid-password"},
    )
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_demo_token_endpoint_is_removed(unauthenticated_client):
    response = await unauthenticated_client.post(
        "/api/auth/demo-token",
        json={"role": "admin"},
    )
    assert response.status_code == 404


def test_sanitize_payload_redacts_credentials_and_tokens():
    from app.core.logger import sanitize_payload

    data = {
        "email": "admin@example.com",
        "password": "SuperSecretPassword123!",
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakMe",
        "nested": {
            "api_key": "secret-api-key",
            "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token.part",
            "safe_number": 42,
            "items": ["safe_string", {"sub_password": "nested-secret"}],
        },
    }
    sanitized = sanitize_payload(data)

    assert sanitized["email"] == "admin@example.com"
    assert sanitized["password"] == "[REDACTED]"
    assert sanitized["access_token"] == "[REDACTED]"
    assert sanitized["nested"]["api_key"] == "[REDACTED]"
    assert sanitized["nested"]["authorization"] == "[REDACTED]"
    assert sanitized["nested"]["safe_number"] == 42
    assert sanitized["nested"]["items"][0] == "safe_string"
    assert sanitized["nested"]["items"][1]["sub_password"] == "[REDACTED]"
    # Verify original dictionary was not mutated
    assert data["password"] == "SuperSecretPassword123!"


def test_supabase_auth_client_caching_and_smart_key_resolution(monkeypatch):
    from types import SimpleNamespace
    from app.api.routes import auth as auth_routes

    auth_routes._reset_cached_client()

    create_client_calls = []

    def mock_create_client(url, key):
        create_client_calls.append((url, key))
        return SimpleNamespace(url=url, key=key)

    monkeypatch.setattr(auth_routes, "create_client", mock_create_client)
    monkeypatch.setattr(auth_routes.settings, "supabase_url", "https://example.supabase.co")
    # Simulate publishable key that should be bypassed when service role key is present
    monkeypatch.setattr(auth_routes.settings, "supabase_key", "sb_publishable_dummy_key")
    monkeypatch.setattr(auth_routes.settings, "supabase_service_role_key", "eyJ_service_role_secret")

    # 1. Calling get_supabase_auth_client should pick service role key directly
    client1 = auth_routes.get_supabase_auth_client()
    assert len(create_client_calls) == 1
    assert create_client_calls[0][1] == "eyJ_service_role_secret"

    # 2. Calling it again should return the exact cached instance without re-calling create_client
    client2 = auth_routes.get_supabase_auth_client()
    assert client2 is client1
    assert len(create_client_calls) == 1

    # Cleanup
    auth_routes._reset_cached_client()


@pytest.mark.asyncio
async def test_post_jobs_unauthenticated_returns_401(unauthenticated_client, db_session):
    category = await seed_category(db_session)
    response = await unauthenticated_client.post("/api/jobs", json={
        "category_id": str(category.id),
        "title": "Unauthorized Vacancy",
        "company_name": "Rogue Corp",
        "location_country": "UAE",
        "job_description": "Should fail",
    })
    assert response.status_code == 401
    assert "authentication required" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_post_jobs_candidate_role_returns_403(unauthenticated_client, db_session):
    from app.core.auth import create_access_token
    candidate_token = create_access_token({
        "sub": "candidate-123",
        "email": "candidate@example.com",
        "role": "candidate",
    })
    category = await seed_category(db_session)
    response = await unauthenticated_client.post(
        "/api/jobs",
        json={
            "category_id": str(category.id),
            "title": "Unauthorized Vacancy",
            "company_name": "Rogue Corp",
            "location_country": "UAE",
            "job_description": "Should fail",
        },
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    assert response.status_code == 403
    assert "access denied" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_post_jobs_admin_role_succeeds(unauthenticated_client, db_session):
    from app.core.auth import create_access_token
    admin_token = create_access_token({
        "sub": "admin-123",
        "email": "recruiter@ugetjob.com",
        "role": "recruiter",
    })
    category = await seed_category(db_session)
    response = await unauthenticated_client.post(
        "/api/jobs",
        json={
            "category_id": str(category.id),
            "title": "Certified Crane Operator",
            "company_name": "Gulf Heavy Logistics",
            "location_country": "Qatar",
            "location_city": "Doha",
            "job_description": "Heavy machinery operation.",
            "salary": "QAR 4500",
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["title"] == "Certified Crane Operator"
    assert body["data"]["status"] == "published"


@pytest.mark.asyncio
async def test_post_admin_jobs_succeeds(unauthenticated_client, db_session):
    from app.core.auth import create_access_token
    admin_token = create_access_token({
        "sub": "admin-999",
        "email": "admin@ugetjob.com",
        "role": "admin",
    })
    category = await seed_category(db_session)
    response = await unauthenticated_client.post(
        "/api/admin/jobs",
        json={
            "category_id": str(category.id),
            "title": "Substation Engineer",
            "company_name": "Saudi Electricity Co.",
            "location_country": "Saudi Arabia",
            "job_description": "High voltage substation testing.",
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["title"] == "Substation Engineer"


@pytest.mark.asyncio
async def test_cors_strict_policy(unauthenticated_client):
    # 1. Untrusted multi-tenant origins (malicious Vercel/Render instances) must be rejected
    untrusted_origins = [
        "https://attacker.vercel.app",
        "https://evil-phishing.onrender.com",
        "https://random-tenant.vercel.app",
        "https://not-ugetjob.com",
    ]
    for origin in untrusted_origins:
        res = await unauthenticated_client.options(
            "/api/health",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
            }
        )
        assert res.headers.get("access-control-allow-origin") != origin, f"Origin {origin} should not be allowed"

    # 2. Trusted origins must be permitted
    trusted_origins = [
        "https://ugetjob365.com",
        "https://www.ugetjob365.com",
        "https://ugetjob.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    for origin in trusted_origins:
        res = await unauthenticated_client.options(
            "/api/health",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
            }
        )
        assert res.headers.get("access-control-allow-origin") == origin, f"Origin {origin} should be allowed"


@pytest.mark.asyncio
async def test_get_candidate_resumes_unauthenticated_returns_401(unauthenticated_client, db_session):
    candidate = await _create_candidate(db_session)
    response = await unauthenticated_client.get(f"/api/applications/candidates/{candidate.id}/resumes")
    assert response.status_code == 401
    assert "authentication required" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_candidate_resumes_candidate_role_returns_403(unauthenticated_client, db_session):
    from app.core.auth import create_access_token
    candidate_token = create_access_token({
        "sub": "cand-user-1",
        "email": "cand@example.com",
        "role": "candidate",
    })
    candidate = await _create_candidate(db_session)
    response = await unauthenticated_client.get(
        f"/api/applications/candidates/{candidate.id}/resumes",
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    assert response.status_code == 403
    assert "access denied" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_quick_apply_phone_matching_prevents_idor_overwrite(client, db_session):
    # Initial application creates candidate profile
    res1 = await client.post("/api/applications/quick-apply", json={
        "full_name": "Original Name",
        "phone": "+971551122334",
        "email": "original@example.com",
        "current_job_title": "Senior MEP Engineer",
        "years_experience": 8,
        "consent_to_contact": True,
    })
    assert res1.status_code == 200
    cand_id = res1.json()["data"]["candidate_id"]

    # Second application from another entity trying to overwrite name/email/experience with same phone
    res2 = await client.post("/api/applications/quick-apply", json={
        "full_name": "Attacker Impersonator",
        "phone": "+971551122334",
        "email": "hacked@example.com",
        "current_job_title": "Fake Title",
        "years_experience": 1,
        "consent_to_contact": True,
    })
    assert res2.status_code == 200
    assert res2.json()["data"]["candidate_id"] == cand_id

    # Verify candidate identity in DB was not hijacked
    cand_in_db = await db_session.get(Candidate, uuid.UUID(cand_id))
    assert cand_in_db.full_name == "Original Name"
    assert cand_in_db.email == "original@example.com"
    assert cand_in_db.current_job_title == "Senior MEP Engineer"
    assert cand_in_db.years_experience == 8


@pytest.mark.asyncio
async def test_quick_apply_does_not_leak_or_overwrite_existing_candidate_resume(client, db_session):
    # Legitimate applicant submits with private Drive resume
    res1 = await client.post("/api/applications/quick-apply", json={
        "full_name": "Private Candidate",
        "phone": "+971509988776",
        "email": "private@example.com",
        "resume_link": "https://drive.google.com/file/d/VICTIM_PRIVATE_CV/view",
        "consent_to_contact": True,
    })
    assert res1.status_code == 200
    cand_id = res1.json()["data"]["candidate_id"]
    assert res1.json()["data"]["resume_url"] == "https://drive.google.com/file/d/VICTIM_PRIVATE_CV/view"

    # Attacker queries quick-apply with victim's phone number and NO resume link
    res_probe = await client.post("/api/applications/quick-apply", json={
        "full_name": "Probing Attacker",
        "phone": "+971509988776",
        "consent_to_contact": True,
    })
    assert res_probe.status_code == 200
    # Response MUST NOT leak victim's stored resume URL
    assert res_probe.json()["data"]["resume_url"] is None
    assert res_probe.json()["data"]["resume_source"] is None

    # Attacker attempts to overwrite canonical resume with attacker link
    res_overwrite = await client.post("/api/applications/quick-apply", json={
        "full_name": "Attacker",
        "phone": "+971509988776",
        "resume_link": "https://attacker.com/malicious.pdf",
        "consent_to_contact": True,
    })
    assert res_overwrite.status_code == 200
    # Returned URL matches attacker's current submission
    assert res_overwrite.json()["data"]["resume_url"] == "https://attacker.com/malicious.pdf"

    # Verify canonical resume in Candidate table remains unchanged
    cand = await db_session.get(Candidate, uuid.UUID(cand_id))
    assert cand.resume_url == "https://drive.google.com/file/d/VICTIM_PRIVATE_CV/view"


@pytest.mark.asyncio
async def test_quick_apply_rejects_disallowed_url_schemes_xss(client):
    # Test javascript: pseudo-protocol scheme is rejected
    res_xss = await client.post("/api/applications/quick-apply", json={
        "full_name": "XSS Attacker",
        "phone": "+971501112244",
        "resume_link": "javascript:alert(document.cookie)",
        "consent_to_contact": True,
    })
    assert res_xss.status_code == 422
    assert "scheme" in str(res_xss.json()).lower()

    # Test data: scheme is rejected
    res_data = await client.post("/api/applications/quick-apply", json={
        "full_name": "XSS Attacker",
        "phone": "+971501112245",
        "drive_link": "data:text/html,<script>alert(1)</script>",
        "consent_to_contact": True,
    })
    assert res_data.status_code == 422

    # Test vbscript: scheme is rejected
    res_vb = await client.post("/api/applications/quick-apply", json={
        "full_name": "XSS Attacker",
        "phone": "+971501112246",
        "resume_url": "vbscript:msgbox(1)",
        "consent_to_contact": True,
    })
    assert res_vb.status_code == 422

    # Test valid https url is accepted
    res_valid = await client.post("/api/applications/quick-apply", json={
        "full_name": "Valid Applicant",
        "phone": "+971501112247",
        "resume_link": "https://drive.google.com/file/d/valid-cv/view",
        "consent_to_contact": True,
    })
    assert res_valid.status_code == 200
    assert res_valid.json()["data"]["resume_url"] == "https://drive.google.com/file/d/valid-cv/view"


@pytest.mark.asyncio
async def test_quick_apply_multipart_rejects_disallowed_url_schemes(client):
    # Test multipart endpoint rejects javascript: scheme in drive_link
    res_xss = await client.post(
        "/api/applications/quick-apply-multipart",
        data={
            "full_name": "Multipart XSS Attacker",
            "phone": "+971501112248",
            "drive_link": "javascript:alert(1)",
        }
    )
    assert res_xss.status_code == 422
    assert "scheme" in str(res_xss.json()).lower()

    # Test multipart endpoint rejects data: scheme
    res_data = await client.post(
        "/api/applications/quick-apply-multipart",
        data={
            "full_name": "Multipart XSS Attacker",
            "phone": "+971501112249",
            "drive_link": "data:text/html,<script>alert(1)</script>",
        }
    )
    assert res_data.status_code == 422

    # Test multipart endpoint rejects protocol-relative URL
    res_proto = await client.post(
        "/api/applications/quick-apply-multipart",
        data={
            "full_name": "Multipart Attacker",
            "phone": "+971501112250",
            "drive_link": "//evil.com/payload",
        }
    )
    assert res_proto.status_code == 422

    # Test multipart endpoint accepts valid https URL
    res_valid = await client.post(
        "/api/applications/quick-apply-multipart",
        data={
            "full_name": "Valid Multipart",
            "phone": "+971501112251",
            "drive_link": "https://drive.google.com/file/d/valid-cv-multipart/view",
        }
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["data"]["resume_url"] == "https://drive.google.com/file/d/valid-cv-multipart/view"


@pytest.mark.asyncio
async def test_file_upload_rejects_spoofed_magic_bytes_and_invalid_extensions(client):
    # 1. Attacker attempts uploading an executable with a .pdf extension (spoofed MIME)
    res_spoof = await client.post(
        "/api/applications/quick-apply-multipart",
        data={
            "full_name": "Malicious Uploader",
            "phone": "+971501119901",
        },
        files={"resume": ("malicious.pdf", b"MZ\x90\x00\x03\x00\x00\x00FakePEHeader", "application/pdf")}
    )
    assert res_spoof.status_code == 422
    assert "signature does not match" in res_spoof.json()["detail"].lower()

    # 2. Attacker attempts uploading disallowed extension (.sh, .exe, .html)
    res_ext = await client.post(
        "/api/applications/quick-apply-multipart",
        data={
            "full_name": "Script Uploader",
            "phone": "+971501119902",
        },
        files={"resume": ("exploit.sh", b"#!/bin/bash\nrm -rf /", "application/x-sh")}
    )
    assert res_ext.status_code == 422
    assert "not permitted" in res_ext.json()["detail"].lower()

    # 3. Attacker attempts uploading an empty file
    res_empty = await client.post(
        "/api/applications/quick-apply-multipart",
        data={
            "full_name": "Empty Uploader",
            "phone": "+971501119903",
        },
        files={"resume": ("empty.pdf", b"", "application/pdf")}
    )
    assert res_empty.status_code == 422
    assert "empty" in res_empty.json()["detail"].lower()

    # 4. Valid DOCX file upload with PK\x03\x04 zip header succeeds
    res_docx = await client.post(
        "/api/applications/quick-apply-multipart",
        data={
            "full_name": "DOCX Candidate",
            "phone": "+971501119904",
        },
        files={"resume": ("resume.docx", b"PK\x03\x04\x14\x00FakeDocxZipStream", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert res_docx.status_code == 200
    assert res_docx.json()["data"]["resume_source"] == "uploaded_file"


@pytest.mark.asyncio
async def test_file_upload_rejects_oversized_payload(client):
    from app.core.file_validator import MAX_UPLOAD_SIZE_BYTES
    # Generate payload exceeding MAX_UPLOAD_SIZE_BYTES (10MB + 1KB) with valid PDF header
    oversized_bytes = b"%PDF-1.4" + (b"A" * (MAX_UPLOAD_SIZE_BYTES + 1024))
    res_oversized = await client.post(
        "/api/applications/quick-apply-multipart",
        data={
            "full_name": "Oversized Candidate",
            "phone": "+971501119905",
        },
        files={"resume": ("huge.pdf", oversized_bytes, "application/pdf")}
    )
    assert res_oversized.status_code == 413
    assert "exceeds maximum allowed size" in res_oversized.json()["detail"].lower()


@pytest.mark.asyncio
async def test_file_upload_sanitizes_path_traversal_filenames(client):
    # Upload with directory traversal and control characters in filename
    res_traversal = await client.post(
        "/api/applications/quick-apply-multipart",
        data={
            "full_name": "Traversal Candidate",
            "phone": "+971501119906",
        },
        files={"resume": ("../../../../etc/passwd\x00.pdf", b"%PDF-1.4 valid content", "application/pdf")}
    )
    assert res_traversal.status_code == 200
    # Query resumes to verify stored filename is sanitized
    cand_id = res_traversal.json()["data"]["candidate_id"]
    resumes_resp = await client.get(f"/api/applications/candidates/{cand_id}/resumes")
    assert resumes_resp.status_code == 200
    stored_name = resumes_resp.json()["data"][0]["original_filename"]
    assert ".." not in stored_name
    assert "/" not in stored_name
    assert "\x00" not in stored_name
    assert stored_name.endswith(".pdf")


@pytest.mark.asyncio
async def test_supporting_document_upload_validates_magic_bytes(client, db_session):
    application = Application(
        candidate_id=(await _create_candidate(db_session)).id,
        application_status=ApplicationStatus.new
    )
    db_session.add(application)
    await db_session.commit()
    await db_session.refresh(application)

    # Reject executable disguised as passport.pdf
    res_bad = await client.post(
        f"/api/applications/{application.id}/documents",
        data={"document_type": "passport"},
        files={"file": ("passport.pdf", b"MZThisIsNotAPdf", "application/pdf")}
    )
    assert res_bad.status_code == 422
    assert "signature does not match" in res_bad.json()["detail"].lower()

    # Accept valid image upload (JPEG)
    res_good = await client.post(
        f"/api/applications/{application.id}/documents",
        data={"document_type": "passport"},
        files={"file": ("passport.jpg", b"\xff\xd8\xff\xe0\x00\x10JFIFValidJpeg", "image/jpeg")}
    )
    assert res_good.status_code == 200
    assert res_good.json()["data"]["document_type"] == "passport"


@pytest.mark.asyncio
async def test_public_api_rate_limiting_enforcement(client):
    from app.core.rate_limiter import public_submission_limiter

    # Reset limiter for test isolation
    public_submission_limiter.reset()

    # 1. First 10 requests within window succeed
    for i in range(10):
        res = await client.post(
            "/api/inquiries/service",
            json={
                "service_type": "Recruitment",
                "company_name": f"Test Corp {i}",
                "contact_name": "Test Contact",
                "email": f"test{i}@example.com",
                "phone": "+971501110000",
            },
            headers={"X-Forwarded-For": "203.0.113.195"}
        )
        assert res.status_code == 200, f"Request {i+1} should succeed"

    # 2. 11th request from the same IP is blocked with HTTP 429 and Retry-After header
    res_blocked = await client.post(
        "/api/inquiries/service",
        json={
            "service_type": "Recruitment",
            "company_name": "Spam Corp",
            "contact_name": "Spammer",
            "email": "spam@example.com",
            "phone": "+971501110000",
        },
        headers={"X-Forwarded-For": "203.0.113.195"}
    )
    assert res_blocked.status_code == 429
    assert "too many requests" in res_blocked.json()["detail"].lower()
    assert "retry-after" in res_blocked.headers

    # 3. A different IP address is NOT affected by the first IP's rate limit
    res_other_ip = await client.post(
        "/api/inquiries/service",
        json={
            "service_type": "Recruitment",
            "company_name": "Innocent Corp",
            "contact_name": "Legit Contact",
            "email": "legit@example.com",
            "phone": "+971501110001",
        },
        headers={"X-Forwarded-For": "198.51.100.42"}
    )
    assert res_other_ip.status_code == 200

    # 4. Unit validation for IP parsing and LRU bounded cache
    from app.core.rate_limiter import InMemoryRateLimiter
    bounded_limiter = InMemoryRateLimiter(requests_limit=2, window_seconds=60, max_tracked_ips=2)
    assert bounded_limiter._is_valid_ip("198.51.100.42") is True
    assert bounded_limiter._is_valid_ip("invalid-ip-string") is False
    assert bounded_limiter._is_valid_ip("1.2.3.4.5") is False


def test_production_secrets_validation():
    from app.core.config import Settings
    from pydantic import ValidationError

    # 1. Rejects weak placeholder JWT secret even in development
    with pytest.raises(ValidationError, match="JWT_SECRET cannot be a known default placeholder"):
        Settings(jwt_secret="replace-with-a-long-random-secret")

    # 2. In production, rejects short or default secrets
    with pytest.raises(ValidationError, match="In production, SECRET_KEY must be configured"):
        Settings(
            environment="production",
            jwt_secret="a_sufficiently_long_random_jwt_secret_value_12345",
            secret_key="secret-key-change-me"
        )

    # 3. In production, rejects short JWT secret (< 32 chars)
    with pytest.raises(ValidationError, match="at least 32 characters"):
        Settings(
            environment="production",
            jwt_secret="too_short_secret",
            secret_key="a_strong_production_secret_key_value"
        )

    # 4. Valid strong production configuration succeeds
    prod_settings = Settings(
        environment="production",
        jwt_secret="a_cryptographically_strong_production_jwt_secret_value_with_high_entropy_12345",
        secret_key="a_cryptographically_strong_production_session_secret_key_12345",
        supabase_service_role_key="eyJh_valid_service_role_key_value"
    )
    assert prod_settings.environment == "production"


# ---------------------------------------------------------------------------
# SEC-08: Security Headers & CSP
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_security_headers_present_on_every_response(client):
    """SEC-08: Every API response must include defense-in-depth headers."""
    response = await client.get("/api/health")
    assert response.status_code == 200

    # Clickjacking prevention
    assert response.headers["x-frame-options"] == "DENY"
    # MIME-sniff prevention
    assert response.headers["x-content-type-options"] == "nosniff"
    # Legacy XSS auditor disabled (rely on CSP)
    assert response.headers["x-xss-protection"] == "0"
    # Referrer policy
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    # Permissions policy blocks sensitive APIs
    assert "camera=()" in response.headers["permissions-policy"]
    assert "microphone=()" in response.headers["permissions-policy"]
    # Content-Security-Policy present and restrictive
    csp = response.headers["content-security-policy"]
    assert "default-src 'self'" in csp
    assert "frame-ancestors 'none'" in csp


@pytest.mark.asyncio
async def test_security_headers_on_error_responses(unauthenticated_client):
    """SEC-08: Security headers must be present even on 401/404 error responses."""
    # 401 — admin route without token
    res_401 = await unauthenticated_client.get("/api/admin/ats/applications")
    assert res_401.status_code == 401
    assert res_401.headers["x-frame-options"] == "DENY"
    assert res_401.headers["x-content-type-options"] == "nosniff"

    # 404 — non-existent route
    res_404 = await unauthenticated_client.get(f"/api/jobs/{uuid.uuid4()}")
    assert res_404.status_code == 404
    assert res_404.headers["x-frame-options"] == "DENY"
    assert "content-security-policy" in res_404.headers








