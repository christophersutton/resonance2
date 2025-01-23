# Database Schema

## Core Tables

### clients
```sql
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    services JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Notes:
- `organization_name`: Company or organization the client represents
- `first_name`, `last_name`: Primary contact person details
- `email`: Unique business email for the client
- `phone`: Contact phone number (optional)
- `services`: JSON array of services the client is using (e.g., ["Development", "Design", "Product Strategy", "Consulting"])
- `created_at`: Timestamp when client was added

### messages
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    task_id INTEGER,
    direction TEXT NOT NULL, -- 'inbound' or 'outbound'
    body TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

Notes:
- `direction`: Indicates if message is 'inbound' (from client) or 'outbound' (to client)
- `task_id`: Optional link to associated task
- Messages are always associated with a client via `client_id`

### tasks
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'bug', 'feature_request', 'question', etc.
    urgency TEXT NOT NULL, -- 'urgent', 'medium', 'low'
    status TEXT NOT NULL, -- 'open', 'in_progress', 'closed'
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    primary_document_id INTEGER,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (primary_document_id) REFERENCES documents(id)
);
```

Notes:
- `type`: Categorizes the task (e.g., 'bug', 'feature_request', 'question')
- `urgency`: Priority level of the task
- `status`: Current state of the task
- `primary_document_id`: Optional link to main associated document (e.g., PRD for feature request)

### events
```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    client_id INTEGER,
    event_type TEXT NOT NULL,
    details JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

Notes:
- `event_type`: Type of event (e.g., 'message_in', 'message_out', 'task_created', 'task_updated')
- `details`: JSON field containing event-specific data
- Events can be associated with a task, client, or both

## Document Management Tables

### documents
```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- e.g., 'application/pdf', 'image/png'
    s3_key TEXT NOT NULL UNIQUE, -- Unique identifier for the S3 object
    uploaded_by_user_id INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);
```

### document_versions
```sql
CREATE TABLE document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    s3_key TEXT NOT NULL UNIQUE,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (document_id) REFERENCES documents(id)
);
```

## Indexes

### Core Table Indexes
- `idx_messages_client_task` on messages(client_id, task_id)
- `idx_tasks_client_type_status` on tasks(client_id, type, status)
- `idx_events_task_client_type` on events(task_id, client_id, event_type)

### Document Table Indexes
- documents(task_id, client_id)
- documents(s3_key)
- document_versions(document_id)

## Foreign Key Relationships

### Core Relationships
- messages → tasks, clients
- tasks → clients
- events → tasks, clients

### Document Relationships
- documents → tasks, clients, events
- document_versions → documents
- tasks.primary_document_id → documents
