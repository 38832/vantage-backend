import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, update, delete
from sqlalchemy.orm import selectinload

from app.api.deps import get_db
from app.models.application import Application, ApplicationStatus
from app.models.candidate import Candidate
from app.models.job import Job, JobStatus
from app.models.ats_note import ATSNote
from app.schemas.response import ApiResponse, MetaData
from app.schemas.application import (
    ApplicationOut, ApplicationUpdate, ATSNoteCreate, ATSNoteOut, ATSDashboardStats
)
from app.schemas.job import JobUpdate, JobDetailOut
from app.core.logger import log_query_details, log_mutation_details

router = APIRouter()

@router.get("/dashboard", response_model=ApiResponse[ATSDashboardStats])
async def get_ats_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """
    ATS Summary KPI Metrics for Recruiter Command Center
    """
    status_counts_query = select(
        Application.application_status,
        func.count(Application.id)
    ).group_by(Application.application_status)

    res = await db.execute(status_counts_query)
    rows = dict(res.all())

    total_query = select(func.count(Application.id))
    total_res = await db.execute(total_query)
    total = total_res.scalar() or 0

    stats = ATSDashboardStats(
        total_applications=total,
        new_applications=rows.get(ApplicationStatus.new, 0),
        contacted=rows.get(ApplicationStatus.contacted, 0),
        shortlisted=rows.get(ApplicationStatus.shortlisted, 0),
        interview_scheduled=rows.get(ApplicationStatus.interview_scheduled, 0),
        interviewed=rows.get(ApplicationStatus.interviewed, 0),
        document_pending=rows.get(ApplicationStatus.document_pending, 0),
        medical_pending=rows.get(ApplicationStatus.medical_pending, 0),
        visa_pending=rows.get(ApplicationStatus.visa_pending, 0),
        visa_approved=rows.get(ApplicationStatus.visa_approved, 0),
        hired=rows.get(ApplicationStatus.hired, 0),
        rejected=rows.get(ApplicationStatus.rejected, 0)
    )

    log_query_details(
        entity="Application",
        operation="GROUP BY / AGGREGATE",
        filters=[],
        sorting=["status ASC"],
        returned_count=len(rows),
        total_count=total,
        sample_preview=f"Total: {total}, New: {stats.new_applications}, Shortlisted: {stats.shortlisted}, Hired: {stats.hired}"
    )

    return ApiResponse.ok(stats)


@router.get("/ats/applications", response_model=ApiResponse[List[ApplicationOut]])
async def list_ats_applications(
    status_filter: Optional[ApplicationStatus] = Query(None, alias="status"),
    recruiter_assigned: Optional[str] = Query(None),
    search: Optional[str] = Query(None, description="Search candidate name, phone, or job title"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin recruiter view of candidate applications across stages
    """
    conditions = []
    applied_filters = []

    if status_filter:
        conditions.append(Application.application_status == status_filter)
        applied_filters.append(f"status = '{status_filter.value}'")

    if recruiter_assigned:
        conditions.append(func.lower(Application.recruiter_assigned) == recruiter_assigned.lower())
        applied_filters.append(f"recruiter = '{recruiter_assigned}'")

    if search:
        search_term = f"%{search.lower()}%"
        conditions.append(
            or_(
                func.lower(Candidate.full_name).like(search_term),
                func.lower(Candidate.phone).like(search_term),
                func.lower(Candidate.current_job_title).like(search_term),
                func.lower(Job.title).like(search_term)
            )
        )
        applied_filters.append(f"search LIKE '{search}' (name/phone/title)")

    base_query = (
        select(Application)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .outerjoin(Job, Application.job_id == Job.id)
        .options(selectinload(Application.candidate), selectinload(Application.job))
    )

    if conditions:
        base_query = base_query.where(and_(*conditions))

    # Total count
    count_query = select(func.count(Application.id)).select_from(Application)
    if conditions:
        count_query = count_query.join(Candidate, Application.candidate_id == Candidate.id).outerjoin(Job, Application.job_id == Job.id).where(and_(*conditions))
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    offset = (page - 1) * limit
    sorting_fields = ["Application.created_at DESC"]
    data_query = base_query.order_by(Application.created_at.desc()).offset(offset).limit(limit)
    res = await db.execute(data_query)
    applications = res.scalars().all()

    # Log sorting criteria, applied filters, and returned count
    log_query_details(
        entity="Application",
        operation="SELECT (ATS Application Pipeline)",
        filters=applied_filters,
        sorting=sorting_fields,
        returned_count=len(applications),
        total_count=total,
        sample_preview=[f"{a.candidate.full_name if a.candidate else 'Unknown'} [{a.application_status.value}]" for a in applications[:3]] if applications else None
    )

    # Format list
    out_list = []
    for app in applications:
        cand = app.candidate
        jb = app.job

        cand_name = cand.full_name if cand else "Unknown Candidate"
        cand_phone = cand.phone if cand else None
        cand_email = cand.email if cand else None
        cand_whatsapp = cand.whatsapp if (cand and cand.whatsapp) else cand_phone
        cand_nat = cand.nationality if cand else "Global"
        cand_city = cand.current_city if cand else None
        cand_country = cand.current_country if cand else None
        cand_trade = (
            cand.current_job_title
            if (cand and cand.current_job_title)
            else (jb.title if jb else "General Deployment Candidate")
        )

        dest_country = (
            jb.location_country
            if (jb and jb.location_country)
            else (cand.preferred_country if (cand and cand.preferred_country) else "GCC / Overseas")
        )
        dest_city = jb.location_city if (jb and jb.location_city) else (cand.preferred_city if cand else None)

        exp_years = cand.years_experience if (cand and cand.years_experience is not None) else 0
        exp_formatted = f"{exp_years} yrs" if exp_years else "Fresher / Entry"

        pass_status = cand.passport_status if (cand and cand.passport_status) else "ready"
        pass_num = cand.passport_number if cand else None

        res_source = (
            cand.resume_source.value
            if (cand and hasattr(cand.resume_source, "value"))
            else ("uploaded_file" if (cand and cand.resume_file_name) else "drive_link")
        )
        res_file_name = cand.resume_file_name if cand else None

        out_list.append(
            ApplicationOut(
                id=app.id,
                candidate_id=app.candidate_id,
                job_id=app.job_id,
                candidate_name=cand_name,
                name=cand_name,
                full_name=cand_name,
                candidate_phone=cand_phone,
                phone=cand_phone,
                candidate_email=cand_email,
                email=cand_email,
                candidate_whatsapp=cand_whatsapp,
                whatsapp=cand_whatsapp,
                candidate_nationality=cand_nat,
                nationality=cand_nat,
                candidate_city=cand_city,
                candidate_country=cand_country,
                candidate_job_title=cand_trade,
                candidate_role=cand_trade,
                role=cand_trade,
                trade=cand_trade,
                target_trade=cand_trade,
                job_title=jb.title if jb else "General Deployment Application",
                company_name=jb.company_name if jb else "Nouman's Consultancy Pool",
                destination=dest_country,
                destination_country=dest_country,
                location_country=dest_country,
                location_city=dest_city,
                experience_years=exp_years,
                years_experience=exp_years,
                experience=exp_formatted,
                passport=pass_status,
                passport_status=pass_status,
                passport_number=pass_num,
                application_status=app.application_status,
                status=app.application_status.value,
                recruiter_assigned=app.recruiter_assigned,
                interview_date=app.interview_date,
                interview_notes=app.interview_notes,
                document_status=app.document_status or "pending",
                medical_status=app.medical_status or "pending",
                visa_status=app.visa_status or "not_started",
                notes=app.notes,
                resume_url=cand.resume_url if cand else None,
                resume_source=res_source,
                resume_file_name=res_file_name,
                created_at=app.created_at
            )
        )

    return ApiResponse.ok(data=out_list, meta=MetaData(page=page, limit=limit, total=total))


@router.patch("/ats/applications/{application_id}")
async def update_application_status(
    application_id: uuid.UUID,
    payload: ApplicationUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update ATS application status, assigned recruiter, interview schedule & notes
    """
    query = select(Application).where(Application.id == application_id)
    res = await db.execute(query)
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    update_dict = payload.model_dump(exclude_unset=True)
    changes_diff = {}
    for field, new_val in update_dict.items():
        old_val = getattr(app, field, None)
        old_val_display = old_val.value if hasattr(old_val, "value") else old_val
        new_val_display = new_val.value if hasattr(new_val, "value") else new_val
        if str(old_val_display) != str(new_val_display):
            changes_diff[field] = (old_val_display, new_val_display)
        setattr(app, field, new_val)

    await db.commit()
    await db.refresh(app)

    # Log exact updated fields and diff
    log_mutation_details(
        entity_name="Application",
        entity_id=application_id,
        operation="UPDATE",
        changes=changes_diff if changes_diff else update_dict,
        details=f"Current Status: '{app.application_status.value}', Recruiter: '{app.recruiter_assigned}'"
    )

    return ApiResponse.ok({
        "id": str(app.id),
        "application_status": app.application_status.value,
        "recruiter_assigned": app.recruiter_assigned,
        "interview_date": app.interview_date,
        "message": "Application updated successfully"
    })


@router.post("/ats/applications/{application_id}/notes", response_model=ApiResponse[ATSNoteOut])
async def add_ats_note(
    application_id: uuid.UUID,
    payload: ATSNoteCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Add internal recruiter note to application audit timeline
    """
    app_check = await db.execute(select(Application.id).where(Application.id == application_id))
    if not app_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Application not found")

    note = ATSNote(
        application_id=application_id,
        author_name=payload.author_name,
        note=payload.note
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)

    log_mutation_details(
        entity_name="ATSNote",
        entity_id=note.id,
        operation="INSERT",
        changes={
            "application_id": str(application_id),
            "author_name": payload.author_name,
            "note_preview": payload.note[:60] + "..." if len(payload.note) > 60 else payload.note
        }
    )

    return ApiResponse.ok(note)


@router.patch("/jobs/{job_id}", response_model=ApiResponse[JobDetailOut])
async def update_job(
    job_id: uuid.UUID,
    payload: JobUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update job parameters (status: draft/published/paused/closed, urgent, featured, openings)
    """
    query = select(Job).options(selectinload(Job.category)).where(Job.id == job_id)
    res = await db.execute(query)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    update_dict = payload.model_dump(exclude_unset=True)
    changes_diff = {}
    for field, new_val in update_dict.items():
        old_val = getattr(job, field, None)
        old_val_display = old_val.value if hasattr(old_val, "value") else old_val
        new_val_display = new_val.value if hasattr(new_val, "value") else new_val
        if str(old_val_display) != str(new_val_display):
            changes_diff[field] = (old_val_display, new_val_display)
        setattr(job, field, new_val)

    await db.commit()
    await db.refresh(job)

    log_mutation_details(
        entity_name="Job",
        entity_id=job_id,
        operation="UPDATE",
        changes=changes_diff if changes_diff else update_dict,
        details=f"Job Title: '{job.title}', Status: '{job.status.value}'"
    )

    return ApiResponse.ok(job)


@router.delete("/jobs/{job_id}")
async def delete_or_archive_job(
    job_id: uuid.UUID,
    hard_delete: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    Soft-archive or permanently delete a job posting
    """
    query = select(Job).where(Job.id == job_id)
    res = await db.execute(query)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if hard_delete:
        await db.delete(job)
        log_mutation_details(
            entity_name="Job",
            entity_id=job_id,
            operation="DELETE",
            changes={"mode": "hard_delete", "permanently_deleted": True},
            details=f"Permanently purged Job '{job.title}'"
        )
    else:
        old_status = job.status.value
        job.status = JobStatus.closed
        log_mutation_details(
            entity_name="Job",
            entity_id=job_id,
            operation="UPDATE",
            changes={"status": (old_status, "closed"), "mode": "soft_close"},
            details=f"Soft-closed Job '{job.title}'"
        )

    await db.commit()

    return ApiResponse.ok({
        "job_id": str(job_id),
        "deleted": True,
        "mode": "hard_delete" if hard_delete else "closed"
    })
