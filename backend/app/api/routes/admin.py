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

    if status_filter:
        conditions.append(Application.application_status == status_filter)

    if recruiter_assigned:
        conditions.append(func.lower(Application.recruiter_assigned) == recruiter_assigned.lower())

    if search:
        search_term = f"%{search.lower()}%"
        conditions.append(
            or_(
                func.lower(Candidate.full_name).like(search_term),
                func.lower(Candidate.phone).like(search_term),
                func.lower(Candidate.current_role).like(search_term),
                func.lower(Job.title).like(search_term)
            )
        )

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
    data_query = base_query.order_by(Application.created_at.desc()).offset(offset).limit(limit)
    res = await db.execute(data_query)
    applications = res.scalars().all()

    # Format list
    out_list = []
    for app in applications:
        out_list.append(
            ApplicationOut(
                id=app.id,
                candidate_id=app.candidate_id,
                job_id=app.job_id,
                candidate_name=app.candidate.full_name if app.candidate else "Unknown",
                candidate_phone=app.candidate.phone if app.candidate else None,
                candidate_email=app.candidate.email if app.candidate else None,
                candidate_nationality=app.candidate.nationality if app.candidate else None,
                candidate_role=app.candidate.current_role if app.candidate else None,
                job_title=app.job.title if app.job else "General Deployment Application",
                company_name=app.job.company_name if app.job else "Nouman's Consultancy Pool",
                application_status=app.application_status,
                recruiter_assigned=app.recruiter_assigned,
                interview_date=app.interview_date,
                interview_notes=app.interview_notes,
                document_status=app.document_status,
                medical_status=app.medical_status,
                visa_status=app.visa_status,
                notes=app.notes,
                resume_url=app.candidate.resume_url if app.candidate else None,
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
    for field, val in update_dict.items():
        setattr(app, field, val)

    await db.commit()
    await db.refresh(app)

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

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(job, field, val)

    await db.commit()
    await db.refresh(job)

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
    else:
        job.status = JobStatus.closed

    await db.commit()

    return ApiResponse.ok({
        "job_id": str(job_id),
        "deleted": True,
        "mode": "hard_delete" if hard_delete else "closed"
    })
