import csv
import io
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Literal
from xml.sax.saxutils import escape as xml_escape
from fastapi import APIRouter, Depends, Query, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, update, delete, exists
from sqlalchemy.orm import selectinload

from pydantic import BaseModel

from app.api.deps import get_db, get_current_admin, AdminUser
from app.models.application import Application, ApplicationStatus
from app.models.candidate import Candidate
from app.models.job import Job, JobCategory, JobStatus
from app.models.ats_note import ATSNote
from app.schemas.response import ApiResponse, MetaData
from app.schemas.application import (
    ApplicationOut,
    ApplicationUpdate,
    ATSNoteCreate,
    ATSNoteOut,
    ATSDashboardStats,
    BulkApplicationStatusUpdate,
    BulkApplicationStatusOut,
    QuickContactLogPayload,
    QuickContactLogOut,
)
from app.schemas.job import JobCreate, JobUpdate, JobDetailOut
from app.core.logger import (
    log_query_details,
    log_mutation_details,
    is_detailed_logging_enabled,
    set_detailed_logging,
)
from app.core.config import settings

router = APIRouter()


class AdminLogTogglePayload(BaseModel):
    enabled: bool


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


EXPORT_HEADERS = [
    "Candidate Name",
    "Phone",
    "WhatsApp",
    "Email",
    "Target Trade",
    "Company / Pool",
    "Destination",
    "Experience",
    "Passport Status",
    "Medical Status",
    "Visa Status",
    "Pipeline Status",
    "Recruiter Assigned",
    "Last Contacted",
    "Contact Channel",
    "Contact Outcome",
    "Applied Date",
]


def _build_ats_filter_conditions(
    status_filter: Optional[ApplicationStatus] = None,
    recruiter_assigned: Optional[str] = None,
    search: Optional[str] = None,
    application_ids: Optional[List[uuid.UUID]] = None,
    trade: Optional[str] = None,
    min_experience: Optional[int] = None,
    destination: Optional[str] = None,
    passport_status: Optional[str] = None,
):
    conditions = []
    applied_filters = []

    if application_ids:
        conditions.append(Application.id.in_(application_ids))
        applied_filters.append(f"ids IN ({len(application_ids)})")

    if status_filter:
        conditions.append(Application.application_status == status_filter)
        applied_filters.append(f"status = '{status_filter.value}'")

    if recruiter_assigned:
        conditions.append(func.lower(Application.recruiter_assigned) == recruiter_assigned.lower())
        applied_filters.append(f"recruiter = '{recruiter_assigned}'")

    if trade and trade.strip():
        trade_term = f"%{trade.strip().lower()}%"
        conditions.append(
            or_(
                func.lower(Candidate.current_job_title).like(trade_term),
                func.lower(Candidate.preferred_job_category).like(trade_term),
                func.lower(Job.title).like(trade_term),
            )
        )
        applied_filters.append(f"trade LIKE '{trade.strip()}'")

    if min_experience is not None:
        conditions.append(func.coalesce(Candidate.years_experience, 0) >= min_experience)
        applied_filters.append(f"years_experience >= {min_experience}")

    if destination and destination.strip():
        dest_term = f"%{destination.strip().lower()}%"
        conditions.append(
            or_(
                func.lower(Job.location_country).like(dest_term),
                func.lower(Job.location_city).like(dest_term),
                func.lower(Candidate.preferred_country).like(dest_term),
                func.lower(Candidate.preferred_city).like(dest_term),
            )
        )
        applied_filters.append(f"destination LIKE '{destination.strip()}'")

    if passport_status and passport_status.strip():
        pass_term = f"%{passport_status.strip().lower()}%"
        conditions.append(func.lower(func.coalesce(Candidate.passport_status, "")).like(pass_term))
        applied_filters.append(f"passport_status LIKE '{passport_status.strip()}'")

    if search and search.strip():
        search_term = f"%{search.strip().lower()}%"
        conditions.append(
            or_(
                func.lower(func.coalesce(Candidate.full_name, "")).like(search_term),
                func.lower(func.coalesce(Candidate.phone, "")).like(search_term),
                func.lower(func.coalesce(Candidate.whatsapp, "")).like(search_term),
                func.lower(func.coalesce(Candidate.email, "")).like(search_term),
                func.lower(func.coalesce(Candidate.current_job_title, "")).like(search_term),
                func.lower(func.coalesce(Candidate.preferred_job_category, "")).like(search_term),
                func.lower(func.coalesce(Candidate.cover_letter, "")).like(search_term),
                func.lower(func.coalesce(Candidate.nationality, "")).like(search_term),
                func.lower(func.coalesce(Candidate.current_city, "")).like(search_term),
                func.lower(func.coalesce(Candidate.current_country, "")).like(search_term),
                func.lower(func.coalesce(Candidate.preferred_city, "")).like(search_term),
                func.lower(func.coalesce(Candidate.preferred_country, "")).like(search_term),
                func.lower(func.coalesce(Job.title, "")).like(search_term),
                func.lower(func.coalesce(Job.company_name, "")).like(search_term),
                func.lower(func.coalesce(Application.interview_notes, "")).like(search_term),
                func.lower(func.coalesce(Application.notes, "")).like(search_term),
                func.lower(func.coalesce(Application.recruiter_assigned, "")).like(search_term),
                exists().where(
                    and_(
                        ATSNote.application_id == Application.id,
                        func.lower(ATSNote.note).like(search_term),
                    )
                ),
            )
        )
        applied_filters.append(f"profile search LIKE '{search.strip()}' (name/company/skills/remarks)")

    return conditions, applied_filters


def _sanitize_spreadsheet_cell(value: object) -> str:
    text = "" if value is None else str(value)
    if text and text[0] in ("=", "+", "-", "@", "\t", "\r"):
        return f"'{text}"
    return text


def _application_to_export_row(app: Application) -> List[str]:
    cand = app.candidate
    jb = app.job

    cand_name = cand.full_name if cand else "Unknown Candidate"
    cand_phone = cand.phone if cand else ""
    cand_whatsapp = cand.whatsapp if (cand and cand.whatsapp) else cand_phone
    cand_email = cand.email if (cand and cand.email) else ""
    cand_trade = (
        cand.current_job_title
        if (cand and cand.current_job_title)
        else (jb.title if jb else "General Deployment Candidate")
    )
    company = jb.company_name if jb else "Consultancy Pool"
    dest_country = (
        jb.location_country
        if (jb and jb.location_country)
        else (cand.preferred_country if (cand and cand.preferred_country) else "GCC / Overseas")
    )
    exp_years = cand.years_experience if (cand and cand.years_experience is not None) else 0
    exp_formatted = f"{exp_years} yrs" if exp_years else "Fresher / Entry"
    pass_status = cand.passport_status if (cand and cand.passport_status) else "ready"
    applied_date = app.created_at.strftime("%Y-%m-%d") if app.created_at else ""

    raw_values = [
        cand_name,
        cand_phone,
        cand_whatsapp,
        cand_email,
        cand_trade,
        company,
        dest_country,
        exp_formatted,
        pass_status,
        app.medical_status or "pending",
        app.visa_status or "not_started",
        app.application_status.value if hasattr(app.application_status, "value") else str(app.application_status),
        app.recruiter_assigned or "",
        app.last_contacted_at.strftime("%Y-%m-%d %H:%M") if app.last_contacted_at else "",
        app.last_contact_channel or "",
        app.last_contact_outcome or "",
        applied_date,
    ]
    return [_sanitize_spreadsheet_cell(val) for val in raw_values]


def _render_csv_bytes(rows: List[List[str]]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(EXPORT_HEADERS)
    writer.writerows(rows)
    return ("\ufeff" + buf.getvalue()).encode("utf-8")


def _render_excel_xml_bytes(rows: List[List[str]]) -> bytes:
    header_cells = "".join(
        f'<Cell ss:StyleID="Header"><Data ss:Type="String">{xml_escape(h)}</Data></Cell>'
        for h in EXPORT_HEADERS
    )
    data_rows_xml = []
    for row in rows:
        cells = "".join(
            f'<Cell><Data ss:Type="String">{xml_escape(cell)}</Data></Cell>'
            for cell in row
        )
        data_rows_xml.append(f"<Row>{cells}</Row>")

    xml_doc = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<?mso-application progid="Excel.Sheet"?>\n'
        '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" '
        'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n'
        '<Styles>\n'
        '<Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/>'
        '<Interior ss:Color="#0F2B48" ss:Pattern="Solid"/></Style>\n'
        '</Styles>\n'
        '<Worksheet ss:Name="Candidates">\n'
        '<Table>\n'
        f'<Row>{header_cells}</Row>\n'
        + "\n".join(data_rows_xml)
        + "\n</Table>\n</Worksheet>\n</Workbook>\n"
    )
    return xml_doc.encode("utf-8")


ATSSortOption = Literal[
    "date_desc",
    "date_asc",
    "experience_desc",
    "experience_asc",
    "name_asc",
    "name_desc",
]


def _resolve_ats_sort_order(sort_by: ATSSortOption):
    sort_map = {
        "date_desc": ([Application.created_at.desc()], ["Application.created_at DESC"]),
        "date_asc": ([Application.created_at.asc()], ["Application.created_at ASC"]),
        "experience_desc": (
            [func.coalesce(Candidate.years_experience, 0).desc(), Application.created_at.desc()],
            ["Candidate.years_experience DESC", "Application.created_at DESC"],
        ),
        "experience_asc": (
            [func.coalesce(Candidate.years_experience, 0).asc(), Application.created_at.desc()],
            ["Candidate.years_experience ASC", "Application.created_at DESC"],
        ),
        "name_asc": (
            [func.lower(Candidate.full_name).asc(), Application.created_at.desc()],
            ["Candidate.full_name ASC", "Application.created_at DESC"],
        ),
        "name_desc": (
            [func.lower(Candidate.full_name).desc(), Application.created_at.desc()],
            ["Candidate.full_name DESC", "Application.created_at DESC"],
        ),
    }
    return sort_map[sort_by]


@router.get("/ats/applications/export")
async def export_ats_applications(
    export_format: Literal["csv", "excel"] = Query("csv", alias="format"),
    status_filter: Optional[ApplicationStatus] = Query(None, alias="status"),
    recruiter_assigned: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    trade: Optional[str] = Query(None),
    min_experience: Optional[int] = Query(None, ge=0),
    destination: Optional[str] = Query(None),
    passport_status: Optional[str] = Query(None),
    sort_by: ATSSortOption = Query("date_desc"),
    application_ids: Optional[List[uuid.UUID]] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Export selected or filtered ATS candidate applications as CSV or Excel (.xls).
    """
    conditions, applied_filters = _build_ats_filter_conditions(
        status_filter=status_filter,
        recruiter_assigned=recruiter_assigned,
        search=search,
        application_ids=application_ids,
        trade=trade,
        min_experience=min_experience,
        destination=destination,
        passport_status=passport_status,
    )

    query = (
        select(Application)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .outerjoin(Job, Application.job_id == Job.id)
        .options(selectinload(Application.candidate), selectinload(Application.job))
    )
    if conditions:
        query = query.where(and_(*conditions))

    order_clauses, sorting_fields = _resolve_ats_sort_order(sort_by)
    query = query.order_by(*order_clauses)
    res = await db.execute(query)
    applications = res.scalars().all()

    rows = [_application_to_export_row(app) for app in applications]
    date_stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    log_query_details(
        entity="Application",
        operation=f"EXPORT ({export_format.upper()})",
        filters=applied_filters,
        sorting=sorting_fields,
        returned_count=len(rows),
        total_count=len(rows),
    )

    if export_format == "excel":
        content = _render_excel_xml_bytes(rows)
        return Response(
            content=content,
            media_type="application/vnd.ms-excel; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="candidates_export_{date_stamp}.xls"',
            },
        )

    content = _render_csv_bytes(rows)
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="candidates_export_{date_stamp}.csv"',
        },
    )


@router.get("/ats/applications", response_model=ApiResponse[List[ApplicationOut]])
async def list_ats_applications(
    status_filter: Optional[ApplicationStatus] = Query(None, alias="status"),
    recruiter_assigned: Optional[str] = Query(None),
    search: Optional[str] = Query(None, description="Search candidate name, phone, or job title"),
    trade: Optional[str] = Query(None, description="Filter by trade or skill keyword"),
    min_experience: Optional[int] = Query(None, ge=0, description="Minimum years of experience"),
    destination: Optional[str] = Query(None, description="Filter by target destination country or city"),
    passport_status: Optional[str] = Query(None, description="Filter by passport readiness (ready, ecr, renewal, none)"),
    sort_by: ATSSortOption = Query("date_desc", description="Sort candidates by date, experience, or name"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin recruiter view of candidate applications across stages
    """
    conditions, applied_filters = _build_ats_filter_conditions(
        status_filter=status_filter,
        recruiter_assigned=recruiter_assigned,
        search=search,
        trade=trade,
        min_experience=min_experience,
        destination=destination,
        passport_status=passport_status,
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
    order_clauses, sorting_fields = _resolve_ats_sort_order(sort_by)
    data_query = base_query.order_by(*order_clauses).offset(offset).limit(limit)
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
                last_contacted_at=app.last_contacted_at,
                last_contact_channel=app.last_contact_channel,
                last_contact_outcome=app.last_contact_outcome,
                created_at=app.created_at
            )
        )

    return ApiResponse.ok(data=out_list, meta=MetaData(page=page, limit=limit, total=total))


@router.post("/ats/applications/{application_id}/contact-log", response_model=ApiResponse[QuickContactLogOut])
async def log_candidate_contact(
    application_id: uuid.UUID,
    payload: QuickContactLogPayload,
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """
    Record last contacted timestamp, channel, and optional quick outcome for a candidate application.
    """
    res = await db.execute(select(Application).where(Application.id == application_id))
    app = res.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    now = datetime.now(timezone.utc)
    outcome_text = payload.outcome.strip() if payload.outcome and payload.outcome.strip() else "Outreach initiated"

    app.last_contacted_at = now
    app.last_contact_channel = payload.channel
    app.last_contact_outcome = outcome_text

    if payload.outcome and payload.outcome.strip():
        author = (payload.author_name or current_admin.email or "Recruiter").strip()[:100]
        note = ATSNote(
            application_id=application_id,
            author_name=author,
            note=f"[{payload.channel.upper()} Contact] {outcome_text}",
        )
        db.add(note)

    await db.commit()
    await db.refresh(app)

    log_mutation_details(
        entity_name="Application",
        entity_id=application_id,
        operation="CONTACT_LOG",
        changes={
            "last_contacted_at": now.isoformat(),
            "last_contact_channel": payload.channel,
            "last_contact_outcome": outcome_text,
        },
        details=f"Contact logged via {payload.channel}: '{outcome_text}'"
    )

    return ApiResponse.ok(
        QuickContactLogOut(
            application_id=app.id,
            last_contacted_at=app.last_contacted_at,
            last_contact_channel=app.last_contact_channel,
            last_contact_outcome=app.last_contact_outcome,
            message=f"Logged {payload.channel} contact: {outcome_text}",
        )
    )


@router.patch("/ats/applications/bulk-status", response_model=ApiResponse[BulkApplicationStatusOut])
async def bulk_update_application_status(
    payload: BulkApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Batch update ATS application status (and optional recruiter assignment) for multiple applications.
    """
    unique_ids = list(dict.fromkeys(payload.application_ids))
    query = select(Application).where(Application.id.in_(unique_ids))
    res = await db.execute(query)
    applications = res.scalars().all()

    if not applications:
        raise HTTPException(status_code=404, detail="No matching applications found")

    found_by_id = {app.id: app for app in applications}
    updated_ids: List[str] = []
    missing_ids: List[str] = []

    for app_id in unique_ids:
        app = found_by_id.get(app_id)
        if not app:
            missing_ids.append(str(app_id))
            continue
        app.application_status = payload.application_status
        if payload.recruiter_assigned is not None:
            app.recruiter_assigned = payload.recruiter_assigned
        updated_ids.append(str(app.id))

    await db.commit()

    log_mutation_details(
        entity_name="Application",
        entity_id=updated_ids[0],
        operation="BULK_UPDATE",
        changes={
            "updated_count": len(updated_ids),
            "application_status": payload.application_status.value,
            "recruiter_assigned": payload.recruiter_assigned,
        },
        details=f"Bulk updated {len(updated_ids)} application(s) to '{payload.application_status.value}'"
    )

    return ApiResponse.ok(
        BulkApplicationStatusOut(
            updated_count=len(updated_ids),
            updated_ids=updated_ids,
            missing_ids=missing_ids,
            application_status=payload.application_status.value,
            recruiter_assigned=payload.recruiter_assigned,
            message=f"Updated {len(updated_ids)} application(s) to '{payload.application_status.value}'",
        )
    )


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


@router.post("/jobs", response_model=ApiResponse[JobDetailOut])
async def create_job(
    payload: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin),
):
    """
    Publish a new recruitment drive / job opening from Admin ATS
    """
    category = await db.get(JobCategory, payload.category_id)
    if not category or not category.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job category does not exist or is inactive",
        )

    job = Job(**payload.model_dump(exclude={"salary"}), status=JobStatus.published)
    db.add(job)
    await db.commit()
    await db.refresh(job)

    log_mutation_details(
        entity_name="Job",
        entity_id=job.id,
        operation="CREATE",
        changes=payload.model_dump(exclude={"salary"}),
        details=f"Job Title: '{job.title}', Published by: {current_admin.email} ({current_admin.role})",
    )

    return ApiResponse.ok(job)


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


@router.get("/me", response_model=ApiResponse[AdminUser])
async def get_admin_profile(current_admin: AdminUser = Depends(get_current_admin)):
    """
    Get profile, assigned role, and authentication provider for current admin/recruiter.
    """
    return ApiResponse.ok(current_admin)


@router.get("/logging")
async def get_logging_status():
    """
    Check current detailed terminal logging level and configuration (Protected route).
    """
    enabled = is_detailed_logging_enabled()
    return {
        "success": True,
        "detailed_logs_enabled": enabled,
        "configured_default": settings.enable_detailed_logs,
        "message": "Detailed terminal console logging is ON" if enabled else "Detailed terminal console logging is OFF"
    }


@router.post("/logging/toggle")
async def toggle_logging(payload: AdminLogTogglePayload):
    """
    Dynamically turn detailed terminal logging ON or OFF at runtime (Protected route).
    """
    new_state = set_detailed_logging(payload.enabled)
    return {
        "success": True,
        "detailed_logs_enabled": new_state,
        "message": f"Detailed terminal logging set to {new_state}"
    }

