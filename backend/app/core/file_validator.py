import os
import re
from typing import Tuple, Optional
from fastapi import HTTPException, status

# 10 MB maximum upload size for resumes & verification documents
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024

# Allowed file extensions and their canonical MIME types
ALLOWED_EXTENSIONS = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}

# Magic bytes (signatures) for verifying file formats independent of client headers
MAGIC_SIGNATURES = [
    # PDF: starts with %PDF-
    (b"%PDF-", "application/pdf"),
    # Legacy Microsoft Office Compound File Binary (DOC, XLS, PPT): D0 CF 11 E0 A1 B1 1A E1
    (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1", "application/msword"),
    # Modern Microsoft Office OpenXML (DOCX, ZIP-based): PK\x03\x04
    (b"PK\x03\x04", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    # PNG: \x89PNG\r\n\x1a\n
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    # JPEG/JPG: \xff\xd8\xff
    (b"\xff\xd8\xff", "image/jpeg"),
]


def detect_file_type(header: bytes) -> str | None:
    """
    Inspect the initial bytes (magic numbers) of a file to determine its actual MIME type.
    """
    for signature, mime in MAGIC_SIGNATURES:
        if header.startswith(signature):
            return mime
    return None


def validate_uploaded_file(
    file_bytes: bytes,
    filename: Optional[str],
    declared_content_type: Optional[str] = None,
    max_size_bytes: int = MAX_UPLOAD_SIZE_BYTES
) -> Tuple[str, str]:
    """
    Validates uploaded file size, extension, and magic bytes.
    Returns:
        (canonical_mime_type, safe_filename)
    Raises:
        HTTPException(422) if file extension or magic bytes do not match allowed formats.
        HTTPException(413) if file size exceeds maximum allowed threshold.
    """
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded file is empty."
        )

    if len(file_bytes) > max_size_bytes:
        max_mb = max_size_bytes // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {max_mb}MB."
        )

    if not filename or "." not in filename:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Filename is missing or lacks a valid file extension."
        )

    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        allowed_list = ", ".join(ALLOWED_EXTENSIONS.keys())
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File type '{ext}' is not permitted. Allowed formats: {allowed_list}"
        )

    # Magic byte inspection (first 16 bytes is sufficient for all supported formats)
    header = file_bytes[:16]
    detected_mime = detect_file_type(header)
    expected_mime = ALLOWED_EXTENSIONS[ext]

    if not detected_mime or detected_mime != expected_mime:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File content signature does not match declared extension '{ext}'. Executable or spoofed files are rejected."
        )

    # Sanitize filename (strip directory traversal characters, backslashes, null bytes, CRLF)
    safe_basename = os.path.basename(filename.replace("\\", "/")).strip()
    safe_basename = re.sub(r'[^a-zA-Z0-9._-]', '_', safe_basename)
    if not safe_basename or safe_basename.startswith("."):
        safe_basename = f"upload{ext}"

    return detected_mime, safe_basename
