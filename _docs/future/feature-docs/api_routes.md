# API Routes Documentation

## Document Upload

- **Endpoint**: POST /api/documents/upload
- **Purpose**: Upload a new document to S3 and store metadata in SQLite
- **Authentication Required**: Yes
- **Request**:
  - Headers: Content-Type: multipart/form-data
  - Body:
    - file: The file to upload
    - task_id (optional)
    - client_id (optional)
    - event_id (optional)
    - description (optional)
- **Process**:
  1. Receive file via multipart form data
  2. Generate unique s3_key
  3. Upload file to S3
  4. Insert metadata in documents table
- **Response Example**:
```json
{
  "success": true,
  "document": {
    "id": 1,
    "file_name": "PRD_Feature_X.pdf",
    "file_type": "application/pdf",
    "s3_key": "documents/2025/01/22/unique-key.pdf",
    "uploaded_at": "2025-01-22T10:00:00Z"
  }
}
```

## Document Download

- **Endpoint**: GET /api/documents/:id/download
- **Purpose**: Get signed URL for S3 document download
- **Authentication Required**: Yes
- **Process**:
  1. Lookup document by id
  2. Generate pre-signed S3 URL
  3. Return URL
- **Response Example**:
```json
{
  "success": true,
  "download_url": "https://s3.amazonaws.com/bucket/documents/2025/01/22/unique-key.pdf?signature=..."
}
```

## Document Metadata Retrieval

- **Endpoint**: GET /api/documents/:id
- **Purpose**: Get document metadata
- **Response Example**:
```json
{
  "success": true,
  "document": {
    "id": 1,
    "task_id": 42,
    "client_id": 3,
    "file_name": "PRD_Feature_X.pdf",
    "file_type": "application/pdf",
    "uploaded_at": "2025-01-22T10:00:00Z",
    "description": "Initial PRD draft for Feature X."
  }
}
```

## Document Listing

- **Endpoint**: GET /api/documents
- **Purpose**: List documents with optional filters
- **Query Parameters**:
  - task_id
  - client_id
  - event_id
  - uploaded_by_user_id
  - date_range
- **Response Example**:
```json
{
  "success": true,
  "documents": [
    {
      "id": 1,
      "task_id": 42,
      "client_id": 3,
      "file_name": "PRD_Feature_X.pdf",
      "file_type": "application/pdf",
      "uploaded_at": "2025-01-22T10:00:00Z",
      "description": "Initial PRD draft for Feature X."
    }
  ]
}
```
