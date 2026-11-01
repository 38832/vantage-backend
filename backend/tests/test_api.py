from datetime import datetime, timezone
import uuid

import pytest
from app.models.job import JobCategory, Job, JobStatus
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
    assert response.json()["data"] == []

    await seed_category(db_session)
    response = await client.get("/api/categories")
    assert response.status_code == 200
    assert response.json()["data"][0]["slug"] == "electrical"


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
async def test_post_new_requirement_and_appear_in_vacancies(client, db_session):
    category = await seed_category(db_session)
    payload = {
        "title": "Heavy Crane Operator",
        "company_name": "Saudi Binladin Group",
        "category": "electrical",
        "location_country": "Saudi Arabia",
        "location_city": "Riyadh",
        "vacancies": 8,
        "experience_min": 5,
        "salary_min": 3500.0,
        "salary_max": 4800.0,
        "salary_currency": "SAR",
        "urgent": True,
        "job_description": "Operate 100T mobile telescopic cranes on project sites.",
        "skills": ["crane_operation", "rigging", "safety"]
    }
    # 1. Post new requirement via /api/jobs
    post_res = await client.post("/api/jobs", json=payload)
    assert post_res.status_code == 201, post_res.text
    created_job = post_res.json()["data"]
    assert created_job["title"] == "Heavy Crane Operator"
    assert created_job["status"] == "published"
    assert created_job["openings_count"] == 8

    # 2. Verify it appears immediately in Job Vacancies list
    list_res = await client.get("/api/jobs")
    assert list_res.status_code == 200
    job_titles = [j["title"] for j in list_res.json()["data"]]
    assert "Heavy Crane Operator" in job_titles

    # 3. Test alias /api/admin/requirements
    admin_req_res = await client.post("/api/admin/requirements", json={
        "job_title": "Piping QC Inspector",
        "company": "Aramco EPC Joint Venture",
        "country": "Saudi Arabia",
        "vacancies": 3,
        "description": "CSWIP 3.1 certified piping inspector"
    })
    assert admin_req_res.status_code == 201
    assert admin_req_res.json()["data"]["title"] == "Piping QC Inspector"


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
    }, files={"file": ("passport.pdf", b"passport data", "application/pdf")})
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
