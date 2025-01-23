# Glossary & Constants

This document defines key terms used across the application and lists all official constants (enums, status values, types, etc.) to ensure consistency in code and documentation.

---

## Glossary

### 1. **Client**

- A paying customer or stakeholder using the system’s services. Each client has an associated organization name, primary contact (first_name, last_name), and optional phone number. Clients are stored in the `clients` table.

### 2. **Message**

- An inbound or outbound communication record (typically SMS for now). Contains fields like `direction` (`inbound` or `outbound`), `body`, timestamps, and links to the client or task, if applicable.

### 3. **Task**

- A unit of work created in response to a client’s request or internal need (e.g., bug fix, feature request, revision). Tasks have properties such as type, urgency, status, and optional references to documents or dependencies.

### 4. **Task Dependency**

- A relationship in which one task cannot proceed until another task is completed. Represented in the `task_dependencies` table.

### 5. **Event**

- A record in the `events` table that captures key actions or state changes throughout the system (e.g., `task_created`, `message_in`, `client_updated`). Used for audit logs, analytics, and triggering downstream processes.

### 6. **Document**

- A file or artifact (like a PRD, bug report, design mockup) associated with a task, client, or event. Stored in the `documents` table, with versioning in `document_versions`.

### 7. **AI Worker**

- A service or process responsible for advanced text-generation, classification, summarization, and other AI/ML tasks. Operates in the background, triggered by events or status changes in tasks.

### 8. **Classification**

- The process that interprets inbound messages and assigns a category (bug, feature, question, etc.) and urgency. Often the first step after a message is received.

### 9. **GitHub Integration**

- A service that synchronizes tasks with GitHub issues for code-related work. It creates or updates issues, links them with local tasks, and updates statuses accordingly.

### 10. **Review**

- A state in which a task or document is awaiting approval or feedback, either internally (by team members) or externally (by the client).

### 11. **Dashboard (React Frontend)**

- The admin interface for managing tasks, messages, documents, and client data. Communicates with the backend via REST (or GraphQL).

---

## Constants

Below are the key enumerations and standard values used throughout the system.  
Use these values exactly to ensure consistent validation, API responses, and database operations.

### 1. **Task Types**

Common categories assigned to a task in the `tasks.type` field.

| Constant           | Description                                              |
|--------------------|----------------------------------------------------------|
| `BUG`              | Fixing code defects or other system errors               |
| `FEATURE_REQUEST`  | Adding new functionality or enhancements                 |
| `REVISION`         | Updating existing assets or deliverables (e.g., design)  |
| `RESEARCH`         | Investigating technology, feasibility, or best practices |
| `QUESTION`         | Simple or complex questions needing a response           |

### 2. **Service Categories**

Which high-level service a task belongs to (`tasks.service_category` or `clients.services` array).

| Constant    | Description                                |
|-------------|--------------------------------------------|
| `STRATEGY`  | Product planning, roadmap creation         |
| `DESIGN`    | UI/UX design or branding                   |
| `DEV`       | Software development, coding tasks         |
| `CONSULT`   | General business or technical consulting   |

### 3. **Task Statuses**

Represents the current lifecycle state of a task (`tasks.status`).

| Constant               | Description                                                      |
|------------------------|------------------------------------------------------------------|
| `open`                 | Newly created, not yet assigned or in progress                  |
| `blocked`              | Waiting on a dependency or external input                       |
| `in_progress`          | Being actively worked on                                        |
| `needs_review`         | Awaiting internal review/approval                               |
| `needs_client_review`  | Awaiting feedback or approval from the client                   |
| `closed`               | Completed or otherwise concluded                                |

> *Note*: Some teams add intermediate statuses like `needs_specs`, `needs_estimate`, `on_hold`, etc. if helpful.

### 4. **Urgency Levels**

Defines how quickly a task needs attention (`tasks.urgency`).

| Constant   | Description                  |
|------------|------------------------------|
| `urgent`   | Highest priority, immediate  |
| `medium`   | Important but not critical   |
| `low`      | Normal priority or backlog   |

### 5. **Message Direction**

Applies to the `messages.direction` field.

| Constant      | Description                              |
|---------------|------------------------------------------|
| `inbound`     | From the client to the system            |
| `outbound`    | From the system (AI or human) to client  |

### 6. **Event Types**

The `events.event_type` field captures the nature of the action. Below is a non-exhaustive list; refer to [events.md](./events.md) for details.

| Constant               | Description                                                     |
|------------------------|-----------------------------------------------------------------|
| `message_in`           | Inbound message from client                                     |
| `message_out`          | Outbound message to client                                      |
| `task_created`         | A new task was created                                          |
| `task_updated`         | Existing task had status/type/field changes                     |
| `task_blocked`         | Task became blocked due to unmet dependencies                   |
| `task_unblocked`       | Task is now unblocked                                           |
| `task_needs_review`    | Task entered an internal review state                           |
| `task_needs_client_review` | Task is awaiting client feedback                           |
| `task_service_phase_complete` | A specific service phase (e.g., STRATEGY) completed     |
| `github_issue_created` | A new GitHub issue was created for a task                       |
| `client_created`       | A new client record was created                                 |
| `client_updated`       | Client’s information was updated                                |
| `document_uploaded`    | A document was uploaded or created                              |
| `document_version_created` | A new version of an existing document was added            |

### 7. **Other Potential Constants**

Depending on your design, you may want constants for:
- **User Roles** (e.g., `ADMIN`, `DEVELOPER`, `DESIGNER`)
- **Error Codes** (if standardizing them in the API)
- **Channel Types** (e.g., `SMS`, `SLACK`, `EMAIL`, `WEB_FORM`)

---

## Usage Guidelines

- **Database Columns**: When inserting or updating rows in `tasks`, `messages`, `events`, etc., use these exact string values (case-sensitive) to avoid confusion or mismatched records.
- **API Responses**: Where possible, return these constant strings in JSON responses for consistency. For example, `"status": "in_progress"` rather than a numeric code.
- **Front-End Display**: The React dashboard can map these constants to user-friendly labels (e.g., `URGENT` → “Urgent!”). However, keep the underlying values consistent with this doc.

---

**Last Updated**: 2025-01-23

*For any changes to enumerated values, update this file and notify the team to maintain system-wide consistency.*
