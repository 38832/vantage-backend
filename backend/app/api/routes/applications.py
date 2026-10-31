import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.models.candidate import Candidate, CandidateResume, ResumeSource
from app.models.application import Application, ApplicationStatus
from app.models.document import ApplicationDocument
from app.models.job import Job
from app.schemas.response import ApiResponse
from app.schemas.application import CandidateApplicationCreate, CandidateResumeOut
from app.services.supabase_storage import supabase_storage

router = APIRouter()

@router.post("/applications/quick-apply")
async def quick_apply(
    payload: CandidateApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Standard JSON candidate quick-apply route supporting Drive links and external URLs
    """
    # Verify job if provided
    if payload.job_id:
        job_check = await db.execute(select(Job.id).where(Job.id == payload.job_id))
        if not job_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )

    job_title = payload.current_job_title or payload.current_role
    effective_resume_url = payload.drive_link or payload.resume_url
    effective_source = payload.resume_source or ResumeSource.drive_link
    has_resume = bool(effective_resume_url)

    # Find existing candidate by phone or create new
    cand_query = select(Candidate).where(Candidate.phone == payload.phone)
    cand_res = await db.execute(cand_query)
    candidate = cand_res.scalar_one_or_none()

    if not candidate:
        candidate = Candidate(
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            whatsapp=payload.whatsapp or payload.phone,
            nationality=payload.nationality,
            current_country=payload.current_country,
            current_city=payload.current_city,
            passport_status=payload.passport_status,
            passport_number=payload.passport_number,
            passport_expiry=payload.passport_expiry,
            years_experience=payload.years_experience or 0,
            current_job_title=job_title,
            current_salary=payload.current_salary,
            preferred_country=payload.preferred_country,
            preferred_city=payload.preferred_city,
            preferred_job_category=payload.preferred_job_category,
            visa_status=payload.visa_status,
            notice_period=payload.notice_period,
            willing_to_relocate=payload.willing_to_relocate,
            has_resume=has_resume,
            resume_url=effective_resume_url,
            resume_source=effective_source if has_resume else ResumeSource.drive_link,
            cover_letter=payload.cover_letter,
            consent_to_contact=payload.consent_to_contact,
        )
        db.add(candidate)
        await db.flush()
    else:
        # Update details
        candidate.full_name = payload.full_name
        if payload.email:
            candidate.email = payload.email
        if effective_resume_url:
            candidate.resume_url = effective_resume_url
            candidate.has_resume = True
            candidate.resume_source = effective_source
        if job_title:
            candidate.current_job_title = job_title
        if payload.years_experience is not None:
            candidate.years_experience = payload.years_experience
        candidate.willing_to_relocate = payload.willing_to_relocate

    # If resume link provided, save to candidate_resumes table as well
    if effective_resume_url:
        cand_resume = CandidateResume(
            candidate_id=candidate.id,
            original_filename="Google_Drive_Resume_Link",
            storage_bucket="external",
            storage_path=effective_resume_url,
            mime_type="text/uri-list",
            file_size_bytes=0,
            source=effective_source,
            drive_link=effective_resume_url,
            is_primary=True,
        )
        db.add(cand_resume)

    # Create Application record
    application = Application(
        candidate_id=candidate.id,
        job_id=payload.job_id,
        source_channel="quick_apply",
        application_status=ApplicationStatus.new,
        document_status="pending" if not effective_resume_url else "ready",
        notes=f"Applied online for overseas placement. Target: {payload.preferred_country or 'GCC'}"
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)

    return ApiResponse.ok({
        "application_id": str(application.id),
        "candidate_id": str(candidate.id),
        "status": application.application_status.value,
        "resume_url": candidate.resume_url,
        "resume_source": candidate.resume_source.value,
        "message": "Application submitted successfully. Our recruitment team will review your profile."
    })


@router.post("/applications/quick-apply-multipart")
async def quick_apply_multipart(
    full_name: str = Form(...),
    phone: str = Form(...),
    email: Optional[str] = Form(None),
    whatsapp: Optional[str] = Form(None),
    job_id: Optional[str] = Form(None),
    nationality: Optional[str] = Form(None),
    current_country: Optional[str] = Form(None),
    current_city: Optional[str] = Form(None),
    passport_status: Optional[str] = Form("ready"),
    passport_number: Optional[str] = Form(None),
    years_experience: Optional[int] = Form(0),
    current_job_title: Optional[str] = Form(None),
    current_role: Optional[str] = Form(None),
    drive_link: Optional[str] = Form(None),
    resume_source: Optional[str] = Form(None),
    preferred_country: Optional[str] = Form(None),
    preferred_job_category: Optional[str] = Form(None),
    visa_status: Optional[str] = Form("required"),
    notice_period: Optional[str] = Form(None),
    willing_to_relocate: bool = Form(True),
    cover_letter: Optional[str] = Form(None),
    consent_to_contact: bool = Form(True),
    resume: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Multipart quick-apply route accepting direct PDF/DOCX file upload to Supabase Storage or external drive link
    """
    job_uuid = None
    if job_id:
        try:
            job_uuid = uuid.UUID(job_id)
        except ValueError:
            pass

    resolved_job_title = current_job_title or current_role

    # Create candidate
    candidate = Candidate(
        full_name=full_name,
        email=email,
        phone=phone,
        whatsapp=whatsapp or phone,
        nationality=nationality,
        current_country=current_country,
        current_city=current_city,
        passport_status=passport_status,
        passport_number=passport_number,
        years_experience=years_experience,
        current_job_title=resolved_job_title,
        preferred_country=preferred_country,
        preferred_job_category=preferred_job_category,
        visa_status=visa_status,
        notice_period=notice_period,
        willing_to_relocate=willing_to_relocate,
        cover_letter=cover_letter,
        consent_to_contact=consent_to_contact
    )
    db.add(candidate)
    await db.flush()

    # Create Application
    application = Application(
        candidate_id=candidate.id,
        job_id=job_uuid,
        source_channel="portal_multipart",
        application_status=ApplicationStatus.new
    )
    db.add(application)
    await db.flush()

    resume_url = None
    if resume and resume.filename:
        file_bytes = await resume.read()
        storage_res = await supabase_storage.upload_resume(
            file_bytes=file_bytes,
            filename=resume.filename,
            application_id=str(application.id),
            content_type=resume.content_type or "application/pdf"
        )
        resume_url = storage_res.get("signed_url")
        candidate.resume_url = resume_url
        candidate.has_resume = True
        candidate.resume_source = ResumeSource.uploaded_file
        candidate.resume_file_name = resume.filename
        candidate.resume_storage_bucket = storage_res.get("bucket", "candidate-resumes")
        candidate.resume_storage_path = storage_res.get("storage_path", "")
        candidate.resume_mime_type = resume.content_type
        candidate.resume_file_size_bytes = len(file_bytes)
        candidate.resume_uploaded_at = datetime.utcnow()

        # Add to candidate_resumes table
        cand_resume = CandidateResume(
            candidate_id=candidate.id,
            original_filename=resume.filename,
            storage_bucket=storage_res.get("bucket", "candidate-resumes"),
            storage_path=storage_res.get("storage_path", ""),
            mime_type=resume.content_type or "application/pdf",
            file_size_bytes=len(file_bytes),
            source=ResumeSource.uploaded_file,
            drive_link=None,
            is_primary=True,
            uploaded_at=datetime.utcnow()
        )
        db.add(cand_resume)

        # Record document for application
        doc = ApplicationDocument(
            application_id=application.id,
            candidate_id=candidate.id,
            document_type="resume",
            original_filename=resume.filename,
            storage_bucket=storage_res.get("bucket", "candidate-resumes"),
            storage_path=storage_res.get("storage_path", ""),
            mime_type=resume.content_type,
            file_size_bytes=len(file_bytes)
        )
        db.add(doc)
    elif drive_link:
        candidate.resume_url = drive_link
        candidate.has_resume = True
        candidate.resume_source = ResumeSource.drive_link

        cand_resume = CandidateResume(
            candidate_id=candidate.id,
            original_filename="Google_Drive_Resume_Link",
            storage_bucket="external",
            storage_path=drive_link,
            mime_type="text/uri-list",
            file_size_bytes=0,
            source=ResumeSource.drive_link,
            drive_link=drive_link,
            is_primary=True,
            uploaded_at=datetime.utcnow()
        )
        db.add(cand_resume)
        resume_url = drive_link

    await db.commit()
    await db.refresh(application)

    return ApiResponse.ok({
        "application_id": str(application.id),
        "candidate_id": str(candidate.id),
        "resume_url": resume_url,
        "resume_source": candidate.resume_source.value,
        "message": "Candidate applied successfully with resume registered."
    })


@router.get("/applications/candidates/{candidate_id}/resumes", response_model=ApiResponse[List[CandidateResumeOut]])
async def get_candidate_resumes(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    List all resumes associated with a candidate from the candidate_resumes table
    """
    query = (
        select(CandidateResume)
        .where(CandidateResume.candidate_id == candidate_id)
        .order_by(CandidateResume.is_primary.desc(), CandidateResume.created_at.desc())
    )
    result = await db.execute(query)
    resumes = result.scalars().all()
    return ApiResponse.ok(resumes)


@router.post("/applications/{application_id}/documents")
async def upload_application_document(
    application_id: uuid.UUID,
    document_type: str = Form("resume"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload supporting document (passport copy, medical clearance, trade certification)
    """
    app_query = select(Application).where(Application.id == application_id)
    app_res = await db.execute(app_query)
    application = app_res.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    file_bytes = await file.read()
    storage_res = await supabase_storage.upload_resume(
        file_bytes=file_bytes,
        filename=file.filename,
        application_id=str(application_id),
        content_type=file.content_type or "application/octet-stream"
    )

    doc = ApplicationDocument(
        application_id=application.id,
        candidate_id=application.candidate_id,
        document_type=document_type,
        original_filename=file.filename,
        storage_bucket=storage_res.get("bucket", "candidate-resumes"),
        storage_path=storage_res.get("storage_path", ""),
        mime_type=file.content_type,
        file_size_bytes=len(file_bytes)
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    return ApiResponse.ok({
        "id": str(doc.id),
        "application_id": str(application_id),
        "document_type": document_type,
        "storage_path": storage_res.get("storage_path"),
        "url": storage_res.get("signed_url")
    })
