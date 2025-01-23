# Database Schema Documentation

## New Tables

### 1. documents

Stores metadata for each document.

```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- e.g., 'application/pdf', 'image/png'
    s3_key TEXT NOT NULL UNIQUE, -- Unique identifier for the S3 object
    uploaded_by_user_id INTEGER, -- FK to users table if you have one
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT, -- Optional: brief description or notes about the document
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);
```

### 2. document_versions

Optional table to handle versioning of documents.

```sql
CREATE TABLE document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    s3_key TEXT NOT NULL UNIQUE,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT, -- Optional: notes about this version
    FOREIGN KEY (document_id) REFERENCES documents(id)
);
```

## Updated Existing Tables

### 3. tasks

```sql
ALTER TABLE tasks
ADD COLUMN primary_document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL;
```

## Foreign Key Relationships

- documents.task_id → tasks.id: Associates a document with a task
- documents.client_id → clients.id: Optionally associates a document with a client
- documents.event_id → events.id: Optionally associates a document with an event
- document_versions.document_id → documents.id: Links versions to their parent document
