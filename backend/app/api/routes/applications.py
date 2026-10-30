import uuid
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.models.candidate import Candidate
from app.models.application import Application, ApplicationStatus
from app.models.document import ApplicationDocument
from app.models.job import Job
from app.schemas.response import ApiResponse
from app.schemas.application import CandidateApplicationCreate
from app.services.supabase_storage import supabase_storage

router = APIRouter()

@router.post("/applications/quick-apply")
async def quick_apply(
    payload: CandidateApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Standard JSON candidate quick-apply route
    """
    # Verify job if provided
    if payload.job_id:
        job_check = await db.execute(select(Job.id).where(Job.id == payload.job_id))
        if not job_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )

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
            current_role=payload.current_role,
            current_salary=payload.current_salary,
            preferred_country=payload.preferred_country,
            preferred_city=payload.preferred_city,
            preferred_job_category=payload.preferred_job_category,
            visa_status=payload.visa_status,
            notice_period=payload.notice_period,
            willing_to_relocate=payload.willing_to_relocate,
            has_resume=bool(payload.resume_url),
            resume_url=payload.resume_url,
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
        if payload.resume_url:
            candidate.resume_url = payload.resume_url
            candidate.has_resume = True
        candidate.current_role = payload.current_role or candidate.current_role
        candidate.years_experience = payload.years_experience or candidate.years_experience
        candidate.willing_to_relocate = payload.willing_to_relocate

    # Create Application record
    application = Application(
        candidate_id=candidate.id,
        job_id=payload.job_id,
        source_channel="quick_apply",
        application_status=ApplicationStatus.new,
        document_status="pending" if not payload.resume_url else "ready",
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
    current_role: Optional[str] = Form(None),
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
    Multipart quick-apply route accepting direct PDF/DOCX file upload to Supabase Storage
    """
    job_uuid = None
    if job_id:
        try:
            job_uuid = uuid.UUID(job_id)
        except ValueError:
            pass

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
        current_role=current_role,
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

        # Record document
        doc = ApplicationDocument(
            application_id=application.id,
            candidate_id=candidate.id,
            document_type="resume",
            original_filename=resume.filename,
            storage_bucket=storage_res.get("bucket"),
            storage_path=storage_res.get("storage_path"),
            mime_type=resume.content_type,
            file_size_bytes=len(file_bytes)
        )
        db.add(doc)

    await db.commit()
    await db.refresh(application)

    return ApiResponse.ok({
        "application_id": str(application.id),
        "candidate_id": str(candidate.id),
        "resume_url": resume_url,
        "message": "Candidate applied with resume uploaded to Supabase Storage."
    })


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
        storage_bucket=storage_res.get("bucket"),
        storage_path=storage_res.get("storage_path"),
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
