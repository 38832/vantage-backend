from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.models.employer import Employer
from app.models.inquiry import EmployerInquiry
from app.models.service_request import ServiceRequest
from app.schemas.response import ApiResponse
from app.schemas.inquiry import EmployerInquiryCreate, ServiceRequestCreate
from app.core.logger import log_mutation_details

router = APIRouter()

@router.post("/inquiries/employer")
async def create_employer_inquiry(
    payload: EmployerInquiryCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Inbound Employer Manpower Request
    """
    # Link or register employer company
    emp_query = select(Employer).where(Employer.email == payload.email)
    emp_res = await db.execute(emp_query)
    employer = emp_res.scalar_one_or_none()

    if not employer:
        employer = Employer(
            company_name=payload.company_name,
            contact_name=payload.contact_name,
            email=payload.email,
            phone=payload.phone,
            industry=payload.industry,
            country=payload.country,
            city=payload.city
        )
        db.add(employer)
        await db.flush()
        log_mutation_details(
            entity_name="Employer",
            entity_id=employer.id,
            operation="INSERT",
            changes={"company_name": employer.company_name, "email": employer.email, "contact": employer.contact_name}
        )

    inquiry = EmployerInquiry(
        employer_id=employer.id,
        company_name=payload.company_name,
        contact_name=payload.contact_name,
        email=payload.email,
        phone=payload.phone,
        requirement_type=payload.requirement_type,
        industry=payload.industry,
        job_title=payload.job_title,
        number_of_positions=payload.number_of_positions or 1,
        country=payload.country,
        city=payload.city,
        work_location=payload.work_location or "overseas",
        budget_range=payload.budget_range,
        urgency=payload.urgency or "normal",
        timeline=payload.timeline,
        notes=payload.notes,
        source="website"
    )
    db.add(inquiry)
    await db.commit()
    await db.refresh(inquiry)

    log_mutation_details(
        entity_name="EmployerInquiry",
        entity_id=inquiry.id,
        operation="INSERT",
        changes={
            "company_name": inquiry.company_name,
            "job_title": inquiry.job_title,
            "positions": inquiry.number_of_positions,
            "urgency": inquiry.urgency,
            "country": inquiry.country
        }
    )

    return ApiResponse.ok({
        "id": str(inquiry.id),
        "status": "received",
        "message": f"Inquiry for {payload.company_name} received. Our corporate mobilization lead will get in touch shortly."
    })


@router.post("/inquiries/service")
async def create_service_request(
    payload: ServiceRequestCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Dedicated Service Request CTA (Recruitment, Visa processing, GAMCA Medical/Documentation, Mobilization)
    """
    request = ServiceRequest(
        service_type=payload.service_type,
        company_name=payload.company_name,
        contact_name=payload.contact_name,
        email=payload.email,
        phone=payload.phone,
        city=payload.city,
        notes=payload.notes,
        source="website"
    )
    db.add(request)
    await db.commit()
    await db.refresh(request)

    log_mutation_details(
        entity_name="ServiceRequest",
        entity_id=request.id,
        operation="INSERT",
        changes={
            "service_type": request.service_type,
            "contact_name": request.contact_name,
            "company": request.company_name,
            "city": request.city
        }
    )

    return ApiResponse.ok({
        "id": str(request.id),
        "service_type": payload.service_type,
        "status": "received",
        "message": f"Service request for '{payload.service_type}' logged successfully."
    })
