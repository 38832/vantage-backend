import uuid
from typing import Dict, Any, Optional
from supabase import create_client, Client
from app.core.config import settings

class SupabaseStorageService:
    def __init__(self):
        try:
            self.client: Optional[Client] = create_client(
                settings.supabase_url,
                settings.supabase_service_role_key
            )
        except Exception:
            self.client = None

    async def upload_resume(
        self,
        file_bytes: bytes,
        filename: str,
        application_id: str,
        content_type: str = "application/pdf"
    ) -> Dict[str, Any]:
        """
        Uploads candidate resume to Supabase Storage bucket 'candidate-resumes'
        Path format: candidate-resumes/{application_id}/{filename}
        """
        safe_filename = filename.replace(" ", "_").lower()
        storage_path = f"{application_id}/{uuid.uuid4().hex[:8]}_{safe_filename}"
        
        if self.client:
            try:
                response = self.client.storage.from_(settings.candidate_resumes_bucket).upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": content_type}
                )
                # Generate signed download URL (valid for 1 year for recruiter review)
                signed_url_res = self.client.storage.from_(settings.candidate_resumes_bucket).create_signed_url(
                    storage_path,
                    expires_in=60 * 60 * 24 * 365
                )
                signed_url = signed_url_res.get("signedURL") if isinstance(signed_url_res, dict) else ""
                
                return {
                    "bucket": settings.candidate_resumes_bucket,
                    "storage_path": storage_path,
                    "signed_url": signed_url,
                    "filename": filename,
                    "size_bytes": len(file_bytes)
                }
            except Exception as e:
                # Fallback URL for development/mock mode
                pass

        mock_url = f"{settings.supabase_url}/storage/v1/object/public/{settings.candidate_resumes_bucket}/{storage_path}"
        return {
            "bucket": settings.candidate_resumes_bucket,
            "storage_path": storage_path,
            "signed_url": mock_url,
            "filename": filename,
            "size_bytes": len(file_bytes)
        }

    async def upload_document(
        self,
        file_bytes: bytes,
        filename: str,
        bucket_name: str,
        folder_path: str,
        content_type: str = "application/octet-stream"
    ) -> Dict[str, Any]:
        """
        Generic file upload to any configured Supabase bucket
        """
        safe_filename = filename.replace(" ", "_").lower()
        storage_path = f"{folder_path}/{uuid.uuid4().hex[:8]}_{safe_filename}"
        
        if self.client:
            try:
                self.client.storage.from_(bucket_name).upload(
                    path=storage_path,
                    file=file_bytes,
                    file_options={"content-type": content_type}
                )
                signed_url_res = self.client.storage.from_(bucket_name).create_signed_url(
                    storage_path,
                    expires_in=60 * 60 * 24 * 365
                )
                signed_url = signed_url_res.get("signedURL") if isinstance(signed_url_res, dict) else ""
                return {
                    "bucket": bucket_name,
                    "storage_path": storage_path,
                    "signed_url": signed_url,
                    "filename": filename,
                    "size_bytes": len(file_bytes)
                }
            except Exception:
                pass

        return {
            "bucket": bucket_name,
            "storage_path": storage_path,
            "signed_url": f"{settings.supabase_url}/storage/v1/object/public/{bucket_name}/{storage_path}",
            "filename": filename,
            "size_bytes": len(file_bytes)
        }

supabase_storage = SupabaseStorageService()
