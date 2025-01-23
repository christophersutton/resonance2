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
  "type": "bug",
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
  "services": ["Development", "Design", "Product Strategy", "Consulting"]
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
    "services": ["Development", "Design", "Product Strategy", "Consulting"],
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
