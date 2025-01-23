-- Enable WAL mode for better concurrent performance
PRAGMA journal_mode = WAL;

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Clients table for storing client information
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

-- Documents table for file storage (initial creation)
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    s3_key TEXT NOT NULL UNIQUE,
    uploaded_by_user_id INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Tasks table for tracking work items
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    urgency TEXT NOT NULL,
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    primary_document_id INTEGER,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (primary_document_id) REFERENCES documents(id)
);

-- Events table for tracking system events
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

-- Messages table for storing all communication
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    task_id INTEGER,
    direction TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Document versions table for version control
CREATE TABLE document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    s3_key TEXT NOT NULL UNIQUE,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- Update documents table with references
ALTER TABLE documents ADD COLUMN task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN event_id INTEGER REFERENCES events(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_messages_client_task ON messages(client_id, task_id);
CREATE INDEX idx_tasks_client_type_status ON tasks(client_id, type, status);
CREATE INDEX idx_events_task_client_type ON events(task_id, client_id, event_type);
CREATE INDEX idx_documents_task_client ON documents(task_id, client_id);
CREATE INDEX idx_documents_s3_key ON documents(s3_key);
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
