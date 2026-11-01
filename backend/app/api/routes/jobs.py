import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from app.api.deps import get_db
from app.models.job import Job, JobCategory, JobStatus
from app.schemas.response import ApiResponse, MetaData
from app.schemas.job import JobCategoryOut, JobListItemOut, JobDetailOut, JobCreate
from app.core.logger import log_query_details, log_mutation_details

router = APIRouter()

@router.get("/categories", response_model=ApiResponse[List[JobCategoryOut]])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """
    Get all active job categories and sectors
    """
    query = select(JobCategory).where(JobCategory.is_active == True).order_by(JobCategory.name)
    result = await db.execute(query)
    categories = result.scalars().all()
    log_query_details(
        entity="JobCategory",
        operation="SELECT",
        filters=["is_active = True"],
        sorting=["name ASC"],
        returned_count=len(categories),
        sample_preview=[c.name for c in categories[:4]] if categories else None
    )
    return ApiResponse.ok(categories)


@router.get("/jobs", response_model=ApiResponse[List[JobListItemOut]])
async def list_jobs(
    keyword: Optional[str] = Query(None, description="Search in title, company, description, or skills"),
    category: Optional[str] = Query(None, description="Category slug or category ID"),
    country: Optional[str] = Query(None, description="Target destination country (e.g. UAE, Saudi Arabia)"),
    city: Optional[str] = Query(None, description="City"),
    employment_type: Optional[str] = Query(None, description="full_time, contract, project_based"),
    visa_required: Optional[bool] = Query(None, description="Whether visa sponsorship is required"),
    experience_min: Optional[int] = Query(None, ge=0),
    experience_max: Optional[int] = Query(None, ge=0),
    urgent_only: Optional[bool] = Query(False),
    featured_only: Optional[bool] = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List and filter published overseas jobs
    """
    conditions = [Job.status == JobStatus.published]
    applied_filters = ["status = 'published'"]

    if keyword:
        term = f"%{keyword.lower()}%"
        conditions.append(
            or_(
                func.lower(Job.title).like(term),
                func.lower(Job.company_name).like(term),
                func.lower(Job.job_description).like(term),
                func.lower(Job.location_city).like(term)
            )
        )
        applied_filters.append(f"keyword LIKE '{keyword}'")

    if category:
        # Check if category is UUID or slug
        try:
            cat_uuid = uuid.UUID(category)
            conditions.append(Job.category_id == cat_uuid)
            applied_filters.append(f"category_id = '{cat_uuid}'")
        except ValueError:
            # Query category by slug
            cat_query = select(JobCategory.id).where(func.lower(JobCategory.slug) == category.lower())
            cat_res = await db.execute(cat_query)
            cat_id = cat_res.scalar_one_or_none()
            if cat_id:
                conditions.append(Job.category_id == cat_id)
                applied_filters.append(f"category_slug = '{category}' (resolved: {cat_id})")

    if country:
        conditions.append(func.lower(Job.location_country) == country.lower())
        applied_filters.append(f"country = '{country}'")

    if city:
        conditions.append(func.lower(Job.location_city).like(f"%{city.lower()}%"))
        applied_filters.append(f"city LIKE '{city}'")

    if employment_type:
        conditions.append(Job.employment_type == employment_type)
        applied_filters.append(f"employment_type = '{employment_type}'")

    if visa_required is not None:
        conditions.append(Job.visa_required == visa_required)
        applied_filters.append(f"visa_required = {visa_required}")

    if experience_min is not None:
        conditions.append(Job.experience_min <= experience_min)
        applied_filters.append(f"experience_min <= {experience_min}")

    if experience_max is not None:
        conditions.append(
            or_(
                Job.experience_max.is_(None),
                Job.experience_max >= experience_max
            )
        )
        applied_filters.append(f"experience_max >= {experience_max}")

    if urgent_only:
        conditions.append(Job.urgent == True)
        applied_filters.append("urgent = True")

    if featured_only:
        conditions.append(Job.featured == True)
        applied_filters.append("featured = True")

    # Count total
    count_query = select(func.count(Job.id)).where(and_(*conditions))
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Paginated query
    offset = (page - 1) * limit
    sorting_fields = ["urgent DESC", "featured DESC", "posted_at DESC"]
    data_query = (
        select(Job)
        .where(and_(*conditions))
        .order_by(Job.urgent.desc(), Job.featured.desc(), Job.posted_at.desc())
        .offset(offset)
        .limit(limit)
    )
    data_result = await db.execute(data_query)
    jobs = data_result.scalars().all()

    # Log sorting criteria, filters applied, and records returned
    log_query_details(
        entity="Job",
        operation="SELECT (List)",
        filters=applied_filters,
        sorting=sorting_fields,
        returned_count=len(jobs),
        total_count=total,
        sample_preview=[f"{j.title} [{j.location_country}]" for j in jobs[:3]] if jobs else None
    )

    meta = MetaData(page=page, limit=limit, total=total)
    return ApiResponse.ok(data=jobs, meta=meta)


@router.get("/jobs/featured", response_model=ApiResponse[List[JobListItemOut]])
async def get_featured_jobs(limit: int = 6, db: AsyncSession = Depends(get_db)):
    sorting_fields = ["posted_at DESC"]
    query = (
        select(Job)
        .where(Job.status == JobStatus.published, Job.featured == True)
        .order_by(Job.posted_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    jobs = result.scalars().all()
    log_query_details(
        entity="Job",
        operation="SELECT (Featured)",
        filters=["status = 'published'", "featured = True"],
        sorting=sorting_fields,
        returned_count=len(jobs),
        sample_preview=[j.title for j in jobs] if jobs else None
    )
    return ApiResponse.ok(jobs)


@router.get("/jobs/urgent", response_model=ApiResponse[List[JobListItemOut]])
async def get_urgent_jobs(limit: int = 6, db: AsyncSession = Depends(get_db)):
    sorting_fields = ["posted_at DESC"]
    query = (
        select(Job)
        .where(Job.status == JobStatus.published, Job.urgent == True)
        .order_by(Job.posted_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    jobs = result.scalars().all()
    log_query_details(
        entity="Job",
        operation="SELECT (Urgent)",
        filters=["status = 'published'", "urgent = True"],
        sorting=sorting_fields,
        returned_count=len(jobs),
        sample_preview=[j.title for j in jobs] if jobs else None
    )
    return ApiResponse.ok(jobs)


@router.get("/jobs/{job_id}", response_model=ApiResponse[JobDetailOut])
async def get_job_detail(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Fetch comprehensive job detail with compensation, benefits, and requirements
    """
    query = select(Job).options(selectinload(Job.category)).where(Job.id == job_id)
    result = await db.execute(query)
    job = result.scalar_one_or_none()
    log_query_details(
        entity="Job",
        operation="SELECT (Detail)",
        filters=[f"id = '{job_id}'"],
        sorting=[],
        returned_count=1 if job else 0
    )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found"
        )

    return ApiResponse.ok(job)


async def create_job_internal(payload: JobCreate, db: AsyncSession) -> Job:
    """
    Core internal creator that accepts flexible parameters from both admin and public forms.
    Ensures newly created requirements and jobs have status 'published' so they show up in Job Vacancies.
    """
    # 1. Resolve title
    title = (
        payload.title
        or payload.job_title
        or payload.position
        or payload.role
        or "Overseas Workforce Requirement"
    )

    # 2. Resolve company
    company_name = (
        payload.company_name
        or payload.company
        or payload.employer_name
        or "Nouman's Consultancy Client"
    )

    # 3. Resolve category
    category_id = payload.category_id
    if not category_id and payload.category:
        try:
            category_id = uuid.UUID(payload.category)
        except (ValueError, TypeError):
            cat_stmt = select(JobCategory.id).where(
                or_(
                    func.lower(JobCategory.slug) == payload.category.lower(),
                    func.lower(JobCategory.name) == payload.category.lower()
                )
            )
            cat_res = await db.execute(cat_stmt)
            category_id = cat_res.scalar_one_or_none()

    # Validate category_id exists in database
    if category_id:
        chk_stmt = select(JobCategory.id).where(JobCategory.id == category_id)
        chk_res = await db.execute(chk_stmt)
        if not chk_res.scalar_one_or_none():
            category_id = None

    # Fallback to first active category
    if not category_id:
        first_cat_stmt = select(JobCategory.id).where(JobCategory.is_active == True).limit(1)
        first_cat_res = await db.execute(first_cat_stmt)
        category_id = first_cat_res.scalar_one_or_none()

    # If no category exists at all, seed a default category
    if not category_id:
        default_cat = JobCategory(
            slug="general-recruitment",
            name="General Recruitment",
            description="Overseas technical and manpower roles",
            is_active=True
        )
        db.add(default_cat)
        await db.flush()
        category_id = default_cat.id

    # 4. Resolve location
    location_country = (
        payload.location_country
        or payload.country
        or payload.destination
        or "Saudi Arabia"
    )
    location_city = payload.location_city or payload.city or "Riyadh"

    # 5. Resolve experience
    exp_min = payload.experience_min
    if exp_min is None or exp_min == 0:
        if payload.experience_years is not None:
            exp_min = payload.experience_years
        elif payload.years_experience is not None:
            exp_min = payload.years_experience
        elif payload.experience is not None:
            try:
                import re
                nums = re.findall(r'\d+', str(payload.experience))
                exp_min = int(nums[0]) if nums else 0
            except Exception:
                exp_min = 0
        else:
            exp_min = 0

    # 6. Resolve openings count
    openings = payload.openings_count or payload.openings or payload.vacancies or 1

    # 7. Resolve description and requirements
    desc = (
        payload.job_description
        or payload.description
        or payload.requirements
        or payload.requirement
        or f"Overseas requirement for {title} in {location_country}."
    )
    reqs = payload.requirements or payload.requirement or desc
    benefits = payload.benefits or payload.perks or "Free accommodation, transport, and medical provided."

    # 8. Resolve currency
    currency = payload.salary_currency or payload.currency
    if not currency:
        c_low = location_country.lower()
        if "saudi" in c_low or "ksa" in c_low:
            currency = "SAR"
        elif "uae" in c_low or "dubai" in c_low:
            currency = "AED"
        elif "qatar" in c_low:
            currency = "QAR"
        elif "oman" in c_low:
            currency = "OMR"
        elif "kuwait" in c_low:
            currency = "KWD"
        else:
            currency = "SAR"

    # 9. Resolve status - default to published so it shows in vacancies
    target_status = JobStatus.published
    if payload.status:
        try:
            if isinstance(payload.status, JobStatus):
                target_status = payload.status
            else:
                target_status = JobStatus(str(payload.status).lower())
        except ValueError:
            target_status = JobStatus.published

    # 10. Parse skills
    raw_skills = payload.skills
    parsed_skills: List[str] = []
    if isinstance(raw_skills, list):
        parsed_skills = [str(s).strip() for s in raw_skills if str(s).strip()]
    elif isinstance(raw_skills, str) and raw_skills:
        parsed_skills = [s.strip() for s in raw_skills.split(',') if s.strip()]
    if not parsed_skills:
        parsed_skills = [title.lower()]

    job = Job(
        category_id=category_id,
        title=title,
        company_name=company_name,
        employer_contact_name=payload.employer_contact_name,
        employer_email=payload.employer_email,
        employer_phone=payload.employer_phone,
        location_country=location_country,
        location_city=location_city,
        work_location_type=payload.work_location_type or "overseas",
        visa_required=payload.visa_required if payload.visa_required is not None else True,
        visa_type=payload.visa_type or "Employment Visa",
        employment_type=payload.employment_type or "full_time",
        experience_min=exp_min,
        experience_max=payload.experience_max,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        salary_currency=currency,
        job_description=desc,
        requirements=reqs,
        benefits=benefits,
        urgent=bool(payload.urgent),
        featured=bool(payload.featured),
        skills=parsed_skills,
        openings_count=openings,
        deadline=payload.deadline,
        status=target_status
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Load category relation
    stmt = select(Job).options(selectinload(Job.category)).where(Job.id == job.id)
    res = await db.execute(stmt)
    refreshed_job = res.scalar_one()

    log_mutation_details(
        entity_name="Job",
        entity_id=refreshed_job.id,
        operation="INSERT",
        changes={
            "title": refreshed_job.title,
            "company_name": refreshed_job.company_name,
            "location": f"{refreshed_job.location_city or ''}, {refreshed_job.location_country}",
            "openings": refreshed_job.openings_count,
            "status": refreshed_job.status.value,
            "urgent": refreshed_job.urgent
        },
        details=f"Posted new requirement / job vacancy '{refreshed_job.title}' (Openings: {refreshed_job.openings_count}, Status: '{refreshed_job.status.value}')"
    )
    return refreshed_job


@router.post("/jobs", response_model=ApiResponse[JobDetailOut], status_code=status.HTTP_201_CREATED)
async def create_job(payload: JobCreate, db: AsyncSession = Depends(get_db)):
    """
    Publish a new overseas job vacancy or recruitment requirement.
    Immediately makes the vacancy visible on the Job Vacancies page (status: published).
    """
    job = await create_job_internal(payload, db)
    return ApiResponse.ok(job)


@router.post("/requirements", response_model=ApiResponse[JobDetailOut], status_code=status.HTTP_201_CREATED)
async def post_requirement(payload: JobCreate, db: AsyncSession = Depends(get_db)):
    """
    Alias endpoint for 'Post New Requirement' from admin portal or employer forms.
    Immediately makes the requirement visible on the Job Vacancies page.
    """
    job = await create_job_internal(payload, db)
    return ApiResponse.ok(job)

