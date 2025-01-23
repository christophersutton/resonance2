# API Routes

Below are example REST endpoints. If you prefer GraphQL, the same logic applies but in a single graph schema.

## Inbound Webhook (Twilio → Bun)

- **URL**: POST /webhook/twilio
- **Purpose**: Receives SMS from Twilio, parses data, stores a message (inbound) in DB, triggers classification, scheduling, etc.
- **Request Body** (simplified from Twilio):

```json
{
  "From": "+15550001111",
  "Body": "Hey team, found a bug",
  "SmsMessageSid": "SMxxx",
  ...
}
```

- **Response**: Usually a 200 status (Twilio expects a 2xx for success). No immediate JSON response needed.

## Messages API

### 1. GET /api/messages

- Query Params: optional filters (client_id, direction, etc.)
- Response: JSON list of messages from the messages table

### 2. POST /api/messages/send

- **Purpose**: Send an outbound message (usually from the admin dashboard or AI worker)
- **Request Body**:

```json
{
  "to_number": "+15550001111",
  "body": "We're on it!"
}
```

- **Response**:

```json
{
  "success": true,
  "message_id": 123
}
```

## Tasks API

### 1. GET /api/tasks

- Query Params: filter by status, type, urgency, client_id, etc.
- Response: JSON array of tasks

### 2. POST /api/tasks

- **Purpose**: Create a new task manually
- **Request Body**:

```json
{
  "client_id": 1,
  "title": "Fix checkout bug",
  "type": "BUG",
  "service_category": "DEV",
  "urgency": "urgent"
}
```

### 3. PATCH /api/tasks/:id

- **Purpose**: Update task status, reassign type or urgency, etc.
- **Request Body**:

```json
{
  "status": "in_progress"
}
```

### 4. POST /api/tasks/:id/dependencies

- **Purpose**: Create a dependency between tasks
- **Request Body**:

```json
{
  "required_task_id": 123
}
```

- **Response**:

```json
{
  "success": true,
  "dependency": {
    "id": 1,
    "dependent_task_id": 456,
    "required_task_id": 123,
    "created_at": "2025-01-23T10:00:00Z"
  }
}
```

### 5. GET /api/tasks/:id/dependencies

- **Purpose**: Get all dependencies for a task
- **Response**:

```json
{
  "success": true,
  "blocking": [
    {
      "task_id": 123,
      "title": "Create PRD",
      "status": "in_progress"
    }
  ],
  "blocked": [
    {
      "task_id": 789,
      "title": "Implement API",
      "status": "blocked"
    }
  ]
}
```

### 6. POST /api/tasks/:id/review

- **Purpose**: Request review for a task
- **Request Body**:

```json
{
  "review_type": "internal|client",
  "reviewer_ids": [1, 2],  // Optional
  "document_ids": [789],   // Optional
  "notes": "Please review the API design"
}
```

## Events API

### 1. GET /api/events

- Query Params: client_id, task_id, or date range
- Response: JSON array of events

### 2. POST /api/events

- Typically not called directly by the user; events are created automatically by internal services

## Clients API

### 1. GET /api/clients

- Query Params: optional filters
- Response: JSON array of clients

### 2. POST /api/clients

- **Purpose**: Create a new client
- **Request Body**:

```json
{
  "organization_name": "Acme Corp",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@acme.com",
  "phone": "+1 (555) 000-0000",
  "services": ["STRATEGY", "DESIGN", "DEV", "CONSULT"]
}
```

- **Response**:

```json
{
  "success": true,
  "client": {
    "id": 1,
    "organization_name": "Acme Corp",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@acme.com",
    "phone": "+1 (555) 000-0000",
    "services": ["STRATEGY", "DESIGN", "DEV", "CONSULT"],
    "created_at": "2025-01-23T10:00:00Z"
  }
}
```

### 3. GET /api/clients/:id

- **Purpose**: Get client details
- **Response**: Full client object as shown above

### 4. PATCH /api/clients/:id

- **Purpose**: Update client information
- **Request Body**: Any subset of client fields to update

```json
{
  "services": ["Development", "Design"],
  "phone": "+1 (555) 111-1111"
}
```

## GitHub Integration API

### 1. POST /api/github/issues

- **Purpose**: Create a GitHub issue from a task
- **Request Body**:

```json
{
  "task_id": 123,
  "repository": "org/repo",
  "labels": ["bug", "urgent"],
  "assignee": "username"
}
```

- **Response**:

```json
{
  "success": true,
  "issue_url": "https://github.com/org/repo/issues/456",
  "issue_number": 456
}
```

### 2. GET /api/github/issues/:task_id

- **Purpose**: Get GitHub issue details for a task
- **Response**:

```json
{
  "success": true,
  "issue": {
    "url": "https://github.com/org/repo/issues/456",
    "number": 456,
    "status": "open",
    "assignee": "username",
    "labels": ["bug", "urgent"]
  }
}
```

## Document Management API

### 1. POST /api/documents/upload

- **Purpose**: Upload a new document
- **Request**: Multipart form data

```json
{
  "file": "(binary file data)",
  "task_id": 123,
  "title": "Subscription Feature PRD",
  "description": "Initial PRD draft"
}
```

- **Response**:

```json
{
  "success": true,
  "document": {
    "id": 789,
    "title": "Subscription Feature PRD",
    "file_name": "prd_subscription.pdf",
    "s3_key": "documents/2025/01/23/unique-key.pdf",
    "task_id": 123,
    "uploaded_at": "2025-01-23T10:00:00Z"
  }
}
```

### 2. POST /api/documents/:id/versions

- **Purpose**: Create new version of existing document
- **Request**: Multipart form data

```json
{
  "file": "(binary file data)",
  "description": "Updated with client feedback"
}
```

- **Response**:

```json
{
  "success": true,
  "version": {
    "id": 2,
    "document_id": 789,
    "version_number": 2,
    "s3_key": "documents/2025/01/24/unique-key-v2.pdf",
    "uploaded_at": "2025-01-24T10:00:00Z"
  }
}
```

### 3. GET /api/documents/:id/versions

- **Purpose**: Get version history of a document
- **Response**:

```json
{
  "success": true,
  "versions": [
    {
      "id": 2,
      "version_number": 2,
      "description": "Updated with client feedback",
      "uploaded_at": "2025-01-24T10:00:00Z"
    },
    {
      "id": 1,
      "version_number": 1,
      "description": "Initial version",
      "uploaded_at": "2025-01-23T10:00:00Z"
    }
  ]
}
```

### 4. GET /api/documents/:id/download

- **Purpose**: Get signed URL for document download
- **Query Params**: version_id (optional)
- **Response**:

```json
{
  "success": true,
  "download_url": "https://s3.amazonaws.com/bucket/path?signature=...",
  "expires_at": "2025-01-23T11:00:00Z"
}
```

## Review API

### 1. POST /api/tasks/:id/review/submit

- **Purpose**: Submit review feedback
- **Request Body**:

```json
{
  "review_type": "internal|client",
  "status": "approved|rejected|changes_requested",
  "feedback": "Please adjust the color scheme",
  "document_ids": [789],
  "reviewer_id": 1
}
```

- **Response**:

```json
{
  "success": true,
  "next_status": "in_progress",
  "events": [
    {
      "type": "review_submitted",
      "task_id": 456,
      "details": {
        "review_type": "internal",
        "status": "changes_requested"
      }
    }
  ]
}
```

### 2. GET /api/tasks/:id/reviews

- **Purpose**: Get review history for a task
- **Response**:

```json
{
  "success": true,
  "reviews": [
    {
      "id": 1,
      "review_type": "internal",
      "status": "approved",
      "feedback": "LGTM",
      "reviewer_id": 1,
      "submitted_at": "2025-01-23T10:00:00Z"
    }
  ]
}
```

## Task Dependencies API

### 1. DELETE /api/tasks/:id/dependencies/:dependency_id

- **Purpose**: Remove a task dependency
- **Response**:

```json
{
  "success": true,
  "events": [
    {
      "type": "dependency_removed",
      "task_id": 456,
      "details": {
        "removed_dependency_id": 123
      }
    }
  ]
}
```

### 2. GET /api/tasks/:id/blocked-by

- **Purpose**: Get detailed info about what's blocking a task
- **Response**:

```json
{
  "success": true,
  "blocking_tasks": [
    {
      "task_id": 123,
      "title": "Create PRD",
      "status": "needs_client_review",
      "service_category": "STRATEGY",
      "estimated_completion": "2025-01-25T00:00:00Z"
    }
  ]
}
```
