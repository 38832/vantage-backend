import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from app.api.deps import get_db
from app.models.job import Job, JobCategory, JobStatus
from app.schemas.response import ApiResponse, MetaData
from app.schemas.job import JobCategoryOut, JobListItemOut, JobDetailOut
from app.core.logger import log_query_details

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
