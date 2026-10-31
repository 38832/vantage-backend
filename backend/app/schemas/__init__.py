from app.schemas.response import ApiResponse, MetaData, ErrorDetail
from app.schemas.job import JobCategoryOut, JobListItemOut, JobDetailOut, JobCreate, JobUpdate
from app.schemas.application import (
    CandidateApplicationCreate,
    ApplicationUpdate,
    ApplicationOut,
    ATSNoteCreate,
    ATSNoteOut,
    ATSDashboardStats,
    CandidateResumeOut
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
    "CandidateResumeOut",
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
