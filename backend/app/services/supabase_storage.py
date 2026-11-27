import logging
import uuid
from typing import Any, Dict, Optional
from supabase import Client, create_client
from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageUploadError(RuntimeError):
    """Raised when uploading a file to Supabase Storage fails or storage is unconfigured."""


class SupabaseStorageService:
    def __init__(self):
        if not settings.supabase_url or not settings.supabase_service_role_key:
            self.client: Optional[Client] = None
            return
        try:
            self.client = create_client(
                settings.supabase_url,
                settings.supabase_service_role_key
            )
        except Exception as exc:
            logger.warning("Failed to initialize Supabase client: %s", exc)
            self.client = None

    async def _upload_to_bucket(
        self,
        file_bytes: bytes,
        filename: str,
        bucket_name: str,
        folder_path: str,
        content_type: str,
    ) -> Dict[str, Any]:
        safe_filename = filename.replace(" ", "_").lower()
        storage_path = f"{folder_path}/{uuid.uuid4().hex[:8]}_{safe_filename}"

        if self.client is not None:
            try:
                self.client.storage.from_(bucket_name).upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": content_type},
                )
                signed_url_res = self.client.storage.from_(bucket_name).create_signed_url(
                    storage_path,
                    expires_in=60 * 60 * 24 * 365,
                )
                signed_url = signed_url_res.get("signedURL") if isinstance(signed_url_res, dict) else ""
                if not signed_url:
                    raise StorageUploadError(
                        f"Supabase Storage did not return a signed URL for '{storage_path}'."
                    )
                return {
                    "bucket": bucket_name,
                    "storage_path": storage_path,
                    "signed_url": signed_url,
                    "filename": filename,
                    "size_bytes": len(file_bytes),
                }
            except StorageUploadError:
                raise
            except Exception as exc:
                logger.exception(
                    "Supabase Storage upload failed for bucket='%s', path='%s'",
                    bucket_name,
                    storage_path,
                )
                raise StorageUploadError(
                    f"Failed to upload '{safe_filename}' to bucket '{bucket_name}': {exc}"
                ) from exc

        if settings.mock_storage and (settings.environment or "").lower() != "production":
            logger.warning(
                "MOCK_STORAGE=true: returning mock URL for '%s/%s' (no file persisted).",
                bucket_name,
                storage_path,
            )
            base_url = (settings.supabase_url or "https://mock-storage.local").rstrip("/")
            return {
                "bucket": bucket_name,
                "storage_path": storage_path,
                "signed_url": f"{base_url}/storage/v1/object/public/{bucket_name}/{storage_path}",
                "filename": filename,
                "size_bytes": len(file_bytes),
            }

        logger.error(
            "Supabase Storage client is not configured and MOCK_STORAGE is disabled (bucket='%s').",
            bucket_name,
        )
        raise StorageUploadError(
            "File storage service is not configured and mock storage is disabled."
        )

    async def upload_resume(
        self,
        file_bytes: bytes,
        filename: str,
        application_id: str,
        content_type: str = "application/pdf",
    ) -> Dict[str, Any]:
        """
        Uploads candidate resume to Supabase Storage bucket 'candidate-resumes'
        Path format: candidate-resumes/{application_id}/{filename}
        """
        return await self._upload_to_bucket(
            file_bytes=file_bytes,
            filename=filename,
            bucket_name=settings.candidate_resumes_bucket,
            folder_path=application_id,
            content_type=content_type,
        )

    async def upload_document(
        self,
        file_bytes: bytes,
        filename: str,
        bucket_name: str,
        folder_path: str,
        content_type: str = "application/octet-stream",
    ) -> Dict[str, Any]:
        """
        Generic file upload to any configured Supabase bucket
        """
        return await self._upload_to_bucket(
            file_bytes=file_bytes,
            filename=filename,
            bucket_name=bucket_name,
            folder_path=folder_path,
            content_type=content_type,
        )


supabase_storage = SupabaseStorageService()
