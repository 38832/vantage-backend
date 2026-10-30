from app.schemas.response import ApiResponse, MetaData, ErrorDetail
from app.schemas.job import JobCategoryOut, JobListItemOut, JobDetailOut, JobCreate, JobUpdate
from app.schemas.application import (
    CandidateApplicationCreate,
    ApplicationUpdate,
    ApplicationOut,
    ATSNoteCreate,
    ATSNoteOut,
    ATSDashboardStats
)
from app.schemas.inquiry import EmployerInquiryCreate, EmployerInquiryOut, ServiceRequestCreate, ServiceRequestOut

__all__ = [
    "ApiResponse",
    "MetaData",
    "ErrorDetail",
    "JobCategoryOut",
    "JobListItemOut",
    "JobDetailOut",
    "JobCreate",
    "JobUpdate",
    "CandidateApplicationCreate",
    "ApplicationUpdate",
    "ApplicationOut",
    "ATSNoteCreate",
    "ATSNoteOut",
    "ATSDashboardStats",
    "EmployerInquiryCreate",
    "EmployerInquiryOut",
    "ServiceRequestCreate",
    "ServiceRequestOut"
]
