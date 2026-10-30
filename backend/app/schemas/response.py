from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class MetaData(BaseModel):
    page: Optional[int] = 1
    limit: Optional[int] = 20
    total: Optional[int] = 0

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    meta: Optional[MetaData] = None
    error: Optional[ErrorDetail] = None

    @classmethod
    def ok(cls, data: Any, meta: Optional[MetaData] = None):
        return cls(success=True, data=data, meta=meta)

    @classmethod
    def fail(cls, message: str, code: str = "bad_request", details: Any = None):
        return cls(success=False, error=ErrorDetail(code=code, message=message, details=details))
