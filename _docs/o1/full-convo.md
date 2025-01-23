Document 1: High-Level Overview
1.1 Purpose
The goal is to build an LLM-powered CRM workflow that receives inbound client requests via SMS (extensible to other channels), classifies them, decides if AI or a human should respond, and keeps an audit trail of all interactions.

1.2 Flow Summary
Inbound SMS (Twilio) → Bun Server Webhook
Classification: Type & Urgency
Scheduler: Decide if AI can auto-handle or if a human must intervene
Task + Event Creation: Store records in SQLite (tasks, events)
AI Worker (for tasks the model can handle) or Admin Dashboard (for human intervention)
Outbound SMS (via Twilio)
Rolling Summary (optional LLM-based context update)
1.3 Core Technologies
Bun (backend runtime & server)
SQLite (database)
Twilio (SMS in/out)
LLM (classification, summarization, drafting replies)
React (admin dashboard UI)
1.4 Scalability Considerations
Parallel Classifiers: Type + Urgency can be expanded to more classification tasks (e.g., sentiment, language).
Extend Channels: Slack, email, web forms, etc.
Sharding or External DB: For large scale, consider an external RDBMS (PostgreSQL, MySQL).
Task Queue: If concurrency grows, add a queue for AI Worker jobs (e.g., Redis-based).
Document 2: API Routes
Below are example REST endpoints. If you prefer GraphQL, the same logic applies but in a single graph schema.

2.1 Inbound Webhook (Twilio → Bun)
URL: POST /webhook/twilio
Purpose: Receives SMS from Twilio, parses data, stores a message (inbound) in DB, triggers classification, scheduling, etc.
Request Body (simplified from Twilio):
json
Copy
{
  "From": "+15550001111",
  "Body": "Hey team, found a bug",
  "SmsMessageSid": "SMxxx",
  ...
}
Response: Usually a 200 status (Twilio expects a 2xx for success). No immediate JSON response needed.
2.2 Messages API
GET /api/messages
Query Params: optional filters (client_id, direction, etc.)
Response: JSON list of messages from the messages table.
POST /api/messages/send
Purpose: Send an outbound message (usually from the admin dashboard or AI worker).
Request Body:
json
Copy
{
  "to_number": "+15550001111",
  "body": "We’re on it!"
}
Response:
json
Copy
{
  "success": true,
  "message_id": 123
}
2.3 Tasks API
GET /api/tasks
Query Params: filter by status, type, urgency, client_id, etc.
Response: JSON array of tasks.
POST /api/tasks
Purpose: Create a new task manually (in case we want to create tasks not triggered by SMS).
Request Body:
json
Copy
{
  "client_id": 1,
  "title": "Fix checkout bug",
  "type": "bug",
  "urgency": "urgent"
}
PATCH /api/tasks/:id
Purpose: Update task status, reassign type or urgency, etc.
Request Body (example):
json
Copy
{
  "status": "in_progress"
}
2.4 Events API
GET /api/events
Query Params: client_id, task_id, or date range.
Response: JSON array of events.
POST /api/events (optional)
Typically not called directly by the user; events are created automatically by internal services.
2.5 Clients API
GET /api/clients
POST /api/clients
GET /api/clients/:id
Could return summary, contact info, etc.
PATCH /api/clients/:id
Update name, phone_number, or summary.
Document 3: Services
The “services” layer handles business logic: classification, scheduling, summarizing, etc. Each service is typically a function or class (depending on style).

3.1 Classification Service
Function: classifyMessage(messageBody: string) => { type: string, urgency: string }
Flow:
Takes the raw text from the inbound message.
Invokes LLM endpoint (or local function if you’re doing a smaller model).
Returns an object with type (e.g. bug, question, etc.) and urgency (e.g. urgent, medium, low).
Implementation:
Could call an LLM with a prompt:
css
Copy
"Classify the user's request into a type from [bug, consult, feature_request, question, other].
 Then rate the urgency as [urgent, medium, low]."
Parse the LLM’s textual response.
3.2 Scheduling Service
Function: scheduleTask(type: string, urgency: string) => "AI" | "HUMAN"
Flow:
Takes classification results.
Applies rules; for example:
If type = "bug" and urgency = "urgent", maybe route to HUMANS.
If type = "question" and urgency != "urgent", route to AI.
Returns either "AI" or "HUMAN".
Customization: This can be replaced with a more robust logic engine or even an LLM-based “routing” logic.
3.3 AI Worker Service
Function: handleAIResponse(taskId: number) => void
Flow:
Retrieves the relevant task and associated messages from DB.
Fetches the client’s rolling summary.
Calls an LLM with instructions to produce a draft/final response.
Inserts an outbound message record in DB with the AI’s text.
Optionally: triggers the actual send via Twilio.
3.4 Summarization Service
Function: updateClientSummary(clientId: number, newEvent: Event) => void
Flow:
Retrieves clients.summary.
Calls summarization LLM with:
Old summary
The new event’s details
Prompt: “Update the summary with this new event.”
Updates clients.summary with the returned text.
3.5 Event Logging Service
Purpose: Provide a single interface to log all actions (e.g. inbound message, new task, task updated, outbound message).
Function: logEvent(eventType: string, details: object) => number
Insert a row into events with event_type and details.
Document 4: React Frontend (Admin Dashboard)
4.1 Overview
A single-page application (SPA) built with React. It communicates with the Bun server via the REST APIs described above (or GraphQL, if chosen).

4.2 Core UI Components
Login / Auth (optional)
If authentication is needed, a login page. Otherwise skip if internal only.
Tasks List
Table or cards displaying tasks (title, status, type, urgency, creation date).
Filters at the top:
By status (open, in_progress, closed)
By type (bug, consult, etc.)
By urgency (urgent, medium, low)
Task Detail / Message Thread
Clicking a task shows all messages associated with that client or that task.
Inline form to send an outbound message.
Activity Feed
A chronological list of events from the events table.
For each event, show event_type, timestamp, and relevant details.
Client Profile (Sidebar or separate page)
clients.summary displayed at the top, plus phone_number, name, etc.
Possibly an “Edit summary” button if you want to override or manually note something.
4.3 State Management
React Query or Redux can be used to handle server data.
Caching: tasks, events, messages can be cached for quick reloading.
4.4 Typical Flows
Human picks a Task
The server returns the entire conversation or relevant events.
The human can respond with an outbound message, which calls POST /api/messages/send.
The UI automatically logs a new event in the feed.
Manual Classification or Overriding
If classification is incorrect, an admin might update the type or urgency via PATCH /api/tasks/:id.
Document 5: Database Schema (SQLite)
Below is a more formal schema definition, using typical SQL notation. Adapt as needed.

5.1 Table: clients
sql
Copy
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone_number TEXT,
    summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
Notes:
phone_number could be unique if each client has a single number.
summary holds the rolling summary. Optionally a separate table.
5.2 Table: messages
sql
Copy
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER REFERENCES clients(id),
    direction TEXT CHECK(direction IN ('inbound','outbound')) NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
Notes:
Potential fields: twilio_sid, status, sent_by_user_id (if it’s an outbound by a user).
client_id can be derived from phone_number lookups if that’s more reliable.
5.3 Table: tasks
sql
Copy
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER REFERENCES clients(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('open','in_progress','closed')) DEFAULT 'open',
    type TEXT,     -- e.g. 'bug', 'consult', 'feature_request'
    urgency TEXT,  -- e.g. 'urgent', 'medium', 'low'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
Notes:
type & urgency can be enumerated in a real migration or kept as free text.
5.4 Table: events
sql
Copy
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL, -- e.g. 'message_in', 'message_out', 'task_created'
    client_id INTEGER REFERENCES clients(id),
    task_id INTEGER REFERENCES tasks(id),
    message_id INTEGER REFERENCES messages(id),
    details TEXT -- store JSON data
);
Notes:
details is a TEXT column containing serialized JSON, e.g. {"from_number": "+1555...", "classification": {...}}.
5.5 Indexes (Optional)
events(task_id), events(client_id) for faster queries when populating an activity feed.
messages(client_id) for quick filtering.
clients(phone_number) if phone-based lookups are common.
Document 6: Classification & Scheduling Subsystem
While these functions are summarized in Services, this document offers deeper insight into the classification & scheduling flows.

6.1 Classification
Inbound Handler (from Twilio webhook):
Insert row into messages with direction = 'inbound'.
Immediately call classifyMessage(message.body).
The classification service makes an external request to your LLM, e.g.:
js
Copy
const classificationPrompt = `
  Classify the request:
  - Type: [bug, consult, feature_request, question, other]
  - Urgency: [urgent, medium, low]
  The message is: "${messageBody}"
`;
// Call openAI, or your LLM endpoint
const result = await callLLM(classificationPrompt);
// parse result => { type, urgency }
Store the results in a new tasks row or update an existing open task.
Log an event (task_created or task_updated) with classification details.
6.2 Scheduling
Rule-based:
Hardcode a table of (type, urgency) => route.
LLM-based (optional advanced approach):
Prompt the LLM: “Given type=’X’ and urgency=’Y’, should the AI respond or should a human respond? Make a yes/no suggestion for AI.”
Output: “AI” or “HUMAN.”
If “AI,” the “AI Worker” service is triggered.
If “HUMAN,” the task’s status remains open for the admin dashboard.
Document 7: AI Worker
7.1 Purpose
Automatically generate responses for tasks deemed “AI-ready.”

7.2 Trigger
Called after classification & scheduling, or by a queue if using asynchronous jobs.
7.3 Flow
Retrieve Data:
The relevant task’s type and urgency.
The client’s rolling summary from clients.summary.
The last few inbound messages for context.
Generate Draft:
Prompt the LLM:
markdown
Copy
Context: 
  - Client summary: "..."
  - Most recent messages: "..."
Instruction:
  - Provide a concise reply for the client’s message
  - If the question is about a bug: reassure them, gather details, etc.
  - Keep the tone helpful, accurate, and professional.
Store:
Save the draft in a new message row (direction='outbound', maybe flagged as draft).
Insert an events record (message_out with details like {"draft": true, "ai_generated": true}).
Send (optional):
If the system is fully automated, call POST /api/messages/send to actually push out via Twilio.
Document 8: Rolling Client Summaries
8.1 Purpose
Avoid passing large conversation history to the LLM each time. A short textual summary keeps the context.

8.2 Update Trigger
message_in events (new inbound from client).
task_created, task_updated events (major changes to tasks).
message_out events only if relevant (e.g., big milestone or new final answer).
8.3 Example Implementation
js
Copy
async function updateClientSummary(clientId, event) {
  // 1. Fetch existing summary
  const client = await db.getClient(clientId);
  const oldSummary = client.summary || "";

  // 2. Summarize
  const prompt = `
    Existing summary:
    "${oldSummary}"

    New event: ${JSON.stringify(event.details)}

    Please update the summary to include relevant info from this event.
    Keep it short and relevant.
  `;
  const updatedSummary = await callLLM(prompt);

  // 3. Store in DB
  await db.updateClient(clientId, { summary: updatedSummary });
}
Document 9: Putting It All Together
9.1 End-to-End Example
Inbound SMS
Twilio calls POST /webhook/twilio with Body="Found a bug in checkout...".
Bun server logs inbound message_in event.
Classification
classifyMessage("Found a bug...") → returns { type: "bug", urgency: "urgent" }.
Task Creation
Insert new row in tasks with title="Found a bug...", type="bug", urgency="urgent".
Log task_created event.
Scheduling
scheduleTask("bug","urgent") → “HUMAN” (for example).
Admin Dashboard
The new task appears in the “Open Tasks” list.
A human reads the message, possibly changes status to “in_progress,” and sends an outbound message.
Outbound SMS
The user triggers POST /api/messages/send.
This calls Twilio’s API to send the text.
The server logs message_out event.
Summaries
On these major events, the system calls the Summarization Service to keep clients.summary up to date.
9.2 Extension Points
Multi-channel: Slack or email inbound/outbound. Similar logic, just different webhooks & API calls.
AI Suggestion: Even for urgent tasks, AI can produce a “draft” that a human can approve or edit.
Analytics: Add a “reporting” service or queries on events and tasks to measure response times, classification accuracy, etc.
Final Notes
This set of documents provides a modular architecture for:

A Bun-based server handling inbound/outbound messages (initially SMS via Twilio).
LLM-based classification for “type” and “urgency.”
A Scheduling service for deciding AI vs. human handling.
A React Admin Dashboard for manual review and interactions.
A Rolling summary system using LLM to keep a short record of the client’s ongoing context.
All parts are designed to be extensible and scalable as the system grows in complexity.






You said:
Ok this is great. Let’s think through a few more ai worker flows. For example a new feature request, a flow might go like request > agent drafts PRD for both client and consultant > revisions > approval > GitHub Issue. Whereas a bug report might go straight to GitHub issue, and a worker tries to pull more context from code and logs, and owner assigned to look into bug 
ChatGPT
AI Worker Flows
Thought for 1m 38s
Below is an Additional AI Worker Flows document extending the existing architecture. These flows illustrate how the AI worker might behave differently depending on the request type (e.g., feature request vs. bug report).

Document 10: Additional AI Worker Flows
The AI Worker is not just for drafting quick replies; it can handle more complex workflows by gathering context, generating structured documents (PRDs), coordinating revisions, and integrating with external systems (e.g., GitHub).

10.1 Feature Request Flow
Use Case
A client messages: “We’d like a new feature: adding a subscription tier to the product.”

Steps
Classification

The system classifies this as type = feature_request and determines how to handle it.
Suppose the scheduling logic says: “This is AI-manageable at first pass,” or “Route to AI for initial drafting.”
AI Worker: Draft PRD

The AI Worker fetches:
Client’s rolling summary for context (e.g., “They are an e-commerce site, currently wanting new subscription features.”)
The client’s last messages for more details.
The AI Worker constructs a Product Requirements Document (PRD) draft.
It might follow a template: “Overview, Requirements, Constraints, Stakeholders, Timeline, etc.”
Store Draft + Notify

The PRD draft is saved in the system (could be stored in tasks.description or a separate “documents” table).
An outbound message to the client might say, “Here’s our initial draft of the feature requirements. Please review.”
Another outbound message (or internal note) might go to the consultant or product manager.
Revisions

The client or consultant replies with feedback. This triggers additional inbound messages, classification, and events.
The AI Worker or a human user can revise the PRD accordingly.
Each revision can be tracked in the events table (e.g., task_updated with details of the PRD changes).
Approval

Once the client (and possibly the consultant) is happy with the PRD, the system marks the task as approved or final.
An event is logged (task_updated, from “in_progress” to “approved”).
GitHub Issue Creation

The AI Worker or a final step in the Admin Dashboard triggers an API call to GitHub to create a new issue.
The PRD summary or link is included.
A record is logged in events (e.g., {"event_type": "github_issue_created", "task_id": 123, "issue_url": "...", ... }).
Ongoing Updates

Any new developments on the GitHub side (comments, status changes) can be polled or webhooked back into the system.
The client’s summary is updated accordingly: “Feature request approved, GitHub issue #456 created.”
Data Implications
tasks: might gain a field or sub-status (e.g., “awaiting_approval,” “approved”).
events: logs new sub-events like “prd_drafted,” “prd_revised,” “github_issue_created.”
messages: standard inbound/outbound for coordination with client.
10.2 Bug Report Flow
Use Case
A client messages: “We found a serious bug in the checkout process.”

Steps
Classification

The system classifies this as type = bug with some urgency (urgent, medium, etc.).
Scheduling might decide whether to route it to AI or a human, depending on the severity or rules.
AI Worker: Context Gathering

If the system routes it initially to AI (for triage), the AI Worker might:
Retrieve logs or code references from an integrated source.
Summarize known issues or existing tickets to see if it’s a duplicate.
If the rule says “urgent bugs go straight to humans,” it might skip AI drafting. But let’s assume the AI can still do an initial triage.
Immediate Draft (Optional)

The AI Worker could respond to the client with a request for more details:
“Which browser are you using? Do you see any error codes? Please share screenshots if possible.”
This message gets stored in messages with direction='outbound' and is optionally auto-sent.
GitHub Issue Creation

The AI Worker (or a subsequent human action) creates a GitHub issue with:
Bug summary, relevant logs, the client’s environment details.
Store a new events row indicating github_issue_created.
Assign Owner

The system may automatically assign a bug owner based on rules (e.g., “Checkout bugs go to engineer X”).
A task_updated event might record {"assigned_user_id": 42} or similar.
Ongoing AI Support

If more diagnostic info is needed, the AI Worker can automatically prompt the user again or suggest next steps (e.g., “Have you tried clearing cache?”).
The worker can keep updating the GitHub issue with newly discovered details, calling the GitHub API.
Resolution & Update

Once the bug is fixed, the system updates the task status to “closed,” sends an outbound SMS to the client with a final confirmation, and logs an event.
The client’s rolling summary is updated: “Bug #456 in checkout was resolved by engineer X.”
Data Implications
tasks: Similar to feature request flow, but type = “bug.”
events: Additional sub-events like “bug_assigned,” “github_issue_created,” “bug_resolved.”
messages: Continual inbound/outbound messages as the client shares details or receives updates.
10.3 Architectural Considerations
Modular AI Worker
The AI Worker can have multiple “submodules” or “sub-flows” for different request types (e.g., feature request sub-flow, bug sub-flow).
In code, that might look like:
js
Copy
switch (task.type) {
  case "feature_request":
    handleFeatureRequestFlow(task);
    break;
  case "bug":
    handleBugFlow(task);
    break;
  ...
}
External Integrations
GitHub: REST or GraphQL API calls to create issues, post comments, assign owners.
Logging / Code: Tools to fetch logs or code references (e.g., Sentry, Datadog, or direct server logs).
User Overrides
Humans can override any AI action. For example, if the AI incorrectly tries to open a feature request for a bug, an admin can fix it in the dashboard.
Document Store
For more extensive PRDs, you may want a separate “documents” or “attachments” table rather than overloading tasks.description.
10.4 Summary
These expanded flows show how the AI Worker can do much more than simple Q&A:

Feature Requests: AI generates a structured PRD, gathers revisions, and opens GitHub issues.
Bug Reports: AI can triage, gather context, open GitHub issues, and ping the right owners.
All of this still fits into the same fundamental architecture:

Classify the inbound.
Schedule with logic.
AI Worker or Human handles next steps.
Events + messages record everything.
Optional Summaries keep the client’s context up to date.
This approach is flexible and can be extended to additional use cases (e.g., compliance requests, billing inquiries, etc.) as the CRM grows.






You said:
Ok let’s talk about few other related points then. I think you’re right about docs storage or similar - we’ll need a way to store artifacts, pocs, memos and other reports. Some mix of s3 and SQLite. Can you help think through fks and schema updates?
ChatGPT

Thought for a couple of seconds
Certainly! Extending your CRM system to handle the storage of artifacts, proofs of concept (POCs), memos, and other reports is a valuable enhancement. Leveraging a combination of Amazon S3 for scalable object storage and SQLite for relational data management ensures both efficiency and flexibility.

Below, I outline the necessary schema updates, foreign key (FK) relationships, and architecture considerations to integrate document storage seamlessly into your existing system.

Document 11: Document Storage Integration
11.1 Overview
To store and manage artifacts, POCs, memos, and other reports, we'll introduce a document storage subsystem that integrates Amazon S3 for file storage and SQLite for metadata management. This subsystem will allow you to:

Upload and retrieve documents efficiently.
Link documents to relevant entities (e.g., tasks, clients).
Maintain an audit trail for document-related actions.
11.2 Architectural Components
Amazon S3: Stores the actual files (documents, PDFs, images, etc.).
SQLite: Stores metadata about each document, including links to S3 objects and associations with other entities.
Bun Server: Handles API endpoints for uploading, downloading, and managing documents.
React Frontend: Provides UI components for users to upload, view, and manage documents.
11.3 Database Schema Updates
11.3.1 New Tables
1. documents
Stores metadata for each document.

sql
Copy
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
Notes:

s3_key: A unique identifier used to retrieve the file from S3. Typically, this can be the S3 object key.
Associations:
task_id: Links the document to a specific task.
client_id: Links the document to a client (optional, based on context).
event_id: Links the document to a specific event (e.g., a PRD draft).
uploaded_by_user_id: If your system includes user management, this can track who uploaded the document.
2. document_versions (Optional)
To handle versioning of documents.

sql
Copy
CREATE TABLE document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    s3_key TEXT NOT NULL UNIQUE,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT, -- Optional: notes about this version
    FOREIGN KEY (document_id) REFERENCES documents(id)
);
Notes:

Facilitates tracking multiple versions of the same document.
Each version has its own s3_key.
11.3.2 Updated Existing Tables
3. tasks
Add a relationship to documents if you want to list all related documents directly from tasks.

sql
Copy
-- No changes needed if you use the 'documents' table to reference tasks.
-- Alternatively, you could add a 'primary_document_id' if a task has a main document.
ALTER TABLE tasks
ADD COLUMN primary_document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL;
4. events
Optionally, link document-related events.

sql
Copy
-- No changes needed if using the 'documents' table to reference events.
11.3.3 Foreign Keys Summary
documents.task_id → tasks.id: Associates a document with a task.
documents.client_id → clients.id: Optionally associates a document with a client.
documents.event_id → events.id: Optionally associates a document with an event.
document_versions.document_id → documents.id: Links versions to their parent document.
11.4 API Routes for Document Management
11.4.1 Document Upload
Endpoint: POST /api/documents/upload
Purpose: Upload a new document to S3 and store metadata in SQLite.
Authentication: Ensure only authorized users can upload.
Request:
Headers: Content-Type: multipart/form-data
Body:
file: The file to upload.
task_id (optional)
client_id (optional)
event_id (optional)
description (optional)
Process:
Receive the file via multipart form data.
Generate a unique s3_key (e.g., UUID-based).
Upload the file to S3 using the s3_key.
Insert a new row in the documents table with metadata.
Response:
json
Copy
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
11.4.2 Document Download
Endpoint: GET /api/documents/:id/download
Purpose: Retrieve a signed URL for downloading the document from S3.
Authentication: Ensure only authorized users can download.
Process:
Lookup the document by id in SQLite.
Generate a pre-signed URL from S3 for the s3_key.
Return the signed URL.
Response:
json
Copy
{
  "success": true,
  "download_url": "https://s3.amazonaws.com/bucket/documents/2025/01/22/unique-key.pdf?signature=..."
}
11.4.3 Document Metadata Retrieval
Endpoint: GET /api/documents/:id
Purpose: Retrieve metadata about a specific document.
Process:
Query the documents table by id.
Return the metadata.
Response:
json
Copy
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
11.4.4 Document Listing
Endpoint: GET /api/documents
Purpose: List documents with optional filters.
Query Parameters:
task_id
client_id
event_id
uploaded_by_user_id
date_range
Process:
Apply filters based on query parameters.
Query the documents table.
Return the list of documents.
Response:
json
Copy
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
    },
    ...
  ]
}
11.4.5 Document Deletion
Endpoint: DELETE /api/documents/:id
Purpose: Delete a document from both S3 and SQLite.
Authentication: Ensure only authorized users can delete.
Process:
Lookup the document by id.
Delete the file from S3 using the s3_key.
Delete the metadata from SQLite.
Response:
json
Copy
{
  "success": true,
  "message": "Document deleted successfully."
}
11.5 React Frontend Enhancements
11.5.1 UI Components
Document Upload Component

Features:
File picker supporting multiple file types.
Input fields for optional metadata (task_id, client_id, description).
Progress bar for upload status.
Integration:
Calls POST /api/documents/upload.
Displays success or error messages.
Document List View

Features:
Table or grid displaying documents with columns: File Name, Type, Uploaded By, Uploaded At, Description, Actions.
Filters and search functionality.
Pagination for large lists.
Actions:
Download: Calls GET /api/documents/:id/download and redirects to the signed URL.
View Metadata: Opens a modal or separate page showing detailed metadata.
Delete: Triggers DELETE /api/documents/:id after confirmation.
Document Detail View

Features:
Displays full metadata.
Link to download the document.
Option to view version history if document_versions is implemented.
Task/Client Detail Pages

Enhancement:
Include a section/tab for related documents.
Allow users to upload new documents directly from these pages.
11.5.2 State Management
Data Fetching:
Use React Query or SWR for data fetching and caching.
Error Handling:
Display appropriate error messages for failed uploads, downloads, or deletions.
Optimistic Updates:
For actions like deletion, implement optimistic UI updates for better user experience.
11.6 Backend Services Enhancements
11.6.1 S3 Integration
Configuration:
Credentials: Securely store AWS credentials, preferably using environment variables or a secrets manager.
Bucket Policy: Ensure proper permissions are set for uploading and downloading files.
Libraries:
Use AWS SDK for JavaScript in your Bun server to interact with S3.
11.6.2 Document Handling Service
Encapsulate document-related operations in a dedicated service.

javascript
Copy
// services/documentService.js

import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import db from '../db'; // Your SQLite DB handler

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

export async function uploadDocument(file, metadata) {
  const s3Key = `documents/${new Date().toISOString().split('T')[0]}/${uuidv4()}-${file.originalname}`;
  
  // Upload to S3
  await s3.putObject({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }).promise();
  
  // Insert metadata into SQLite
  const result = await db.run(`
    INSERT INTO documents (task_id, client_id, event_id, file_name, file_type, s3_key, uploaded_by_user_id, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    metadata.task_id || null,
    metadata.client_id || null,
    metadata.event_id || null,
    file.originalname,
    file.mimetype,
    s3Key,
    metadata.uploaded_by_user_id || null,
    metadata.description || null,
  ]);
  
  return result.lastID;
}

export async function deleteDocument(documentId) {
  // Retrieve document metadata
  const doc = await db.get(`SELECT * FROM documents WHERE id = ?`, [documentId]);
  if (!doc) throw new Error('Document not found');
  
  // Delete from S3
  await s3.deleteObject({
    Bucket: BUCKET_NAME,
    Key: doc.s3_key,
  }).promise();
  
  // Delete from SQLite
  await db.run(`DELETE FROM documents WHERE id = ?`, [documentId]);
}

export async function getSignedUrl(documentId, expires = 60) {
  const doc = await db.get(`SELECT * FROM documents WHERE id = ?`, [documentId]);
  if (!doc) throw new Error('Document not found');
  
  const url = s3.getSignedUrl('getObject', {
    Bucket: BUCKET_NAME,
    Key: doc.s3_key,
    Expires: expires, // URL expires in seconds
  });
  
  return url;
}
11.6.3 API Route Handlers
Implement API route handlers utilizing the documentService.

javascript
Copy
// routes/documents.js

import express from 'express';
import multer from 'multer';
import { uploadDocument, deleteDocument, getSignedUrl } from '../services/documentService';

const router = express.Router();
const upload = multer(); // Configure storage as needed

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const metadata = req.body; // Extract metadata from request
    const documentId = await uploadDocument(req.file, metadata);
    const document = await db.get(`SELECT * FROM documents WHERE id = ?`, [documentId]);
    res.status(201).json({ success: true, document });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/documents/:id/download
router.get('/:id/download', async (req, res) => {
  try {
    const documentId = req.params.id;
    const downloadUrl = await getSignedUrl(documentId);
    res.json({ success: true, download_url: downloadUrl });
  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await db.get(`SELECT * FROM documents WHERE id = ?`, [documentId]);
    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, document });
  } catch (error) {
    console.error('Get Document Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const filters = req.query; // e.g., task_id, client_id
    let query = `SELECT * FROM documents WHERE 1=1`;
    const params = [];
    
    if (filters.task_id) {
      query += ` AND task_id = ?`;
      params.push(filters.task_id);
    }
    if (filters.client_id) {
      query += ` AND client_id = ?`;
      params.push(filters.client_id);
    }
    if (filters.event_id) {
      query += ` AND event_id = ?`;
      params.push(filters.event_id);
    }
    
    const documents = await db.all(query, params);
    res.json({ success: true, documents });
  } catch (error) {
    console.error('List Documents Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const documentId = req.params.id;
    await deleteDocument(documentId);
    res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Delete Document Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
11.6.4 Integration with Existing Services
AI Worker Enhancements: When generating reports or artifacts (e.g., PRDs), the AI Worker can utilize the uploadDocument service to store generated documents.
Event Logging: Log document-related actions in the events table for audit purposes.
javascript
Copy
// Example: AI Worker generating a PRD and uploading it

import { uploadDocument } from '../services/documentService';
import { logEvent } from '../services/eventLoggingService';

async function handleFeatureRequest(task) {
  // Generate PRD content using LLM
  const prdContent = await generatePRD(task);
  
  // Convert PRD content to a file (e.g., PDF)
  const fileBuffer = await convertToPDF(prdContent, `PRD_${task.id}.pdf`);
  
  // Create a mock file object
  const file = {
    originalname: `PRD_${task.id}.pdf`,
    mimetype: 'application/pdf',
    buffer: fileBuffer,
  };
  
  // Upload to S3 and store metadata
  const documentId = await uploadDocument(file, { task_id: task.id, description: 'PRD for feature request' });
  
  // Log event
  await logEvent('document_uploaded', { document_id: documentId, task_id: task.id });
  
  // Notify client or internal team
  await sendOutboundMessage(task.client_id, 'Here is the initial PRD draft for your feature request.');
}
11.7 Schema Diagram
To visualize the relationships, here’s a simplified Entity-Relationship Diagram (ERD):

lua
Copy
+------------+       +-----------+       +-------------+
|  clients   |<----- |  tasks    |<----- |  documents  |
+------------+       +-----------+       +-------------+
      ^                     ^                   ^
      |                     |                   |
      |                     |                   |
      |                     |                   |
   +------+              +-------+            +-------+
   | events|              | events|            | events|
   +------+              +-------+            +-------+
Explanation:

clients ↔ tasks: A client can have multiple tasks.
tasks ↔ documents: A task can have multiple associated documents.
documents ↔ events: Each document upload can be associated with an event for auditing.
11.8 Additional Considerations
11.8.1 Security
Access Control:
Ensure that only authorized users can upload, download, or delete documents.
Implement role-based access control (RBAC) if necessary.
Data Privacy:
Encrypt sensitive documents at rest and in transit.
Use S3 bucket policies and IAM roles to restrict access.
11.8.2 Scalability
S3:
Highly scalable; suitable for storing large volumes of documents.
SQLite:
Suitable for small to medium-scale applications.
For larger scales, consider migrating to a more robust RDBMS like PostgreSQL or MySQL.
11.8.3 Backup and Recovery
S3:
Utilize S3 versioning and lifecycle policies for data protection.
SQLite:
Regularly back up the SQLite database.
Implement migration strategies if moving to another DBMS.
11.8.4 Performance Optimization
Indexing:
Ensure indexes on frequently queried fields (e.g., task_id, client_id in the documents table).
Caching:
Utilize caching strategies for frequently accessed documents or metadata.
11.8.5 Versioning
document_versions Table:
Facilitates tracking changes over time.
Enables rollback to previous versions if necessary.
11.8.6 Metadata Enrichment
Searchability:
Implement full-text search on document descriptions.
Tagging:
Allow users to tag documents for easier categorization and retrieval.
11.9 Example SQL Schema Updates
Here is the complete SQL schema incorporating the new tables and modifications:

sql
Copy
-- Existing Tables...

-- Table: clients
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: messages
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER REFERENCES clients(id),
    direction TEXT CHECK(direction IN ('inbound','outbound')) NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: tasks
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER REFERENCES clients(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('open','in_progress','closed','approved')) DEFAULT 'open',
    type TEXT,     -- e.g. 'bug', 'consult', 'feature_request'
    urgency TEXT,  -- e.g. 'urgent', 'medium', 'low'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    primary_document_id INTEGER REFERENCES documents(id) -- Optional
);

-- Table: events
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL, -- e.g. 'message_in', 'message_out', 'task_created'
    client_id INTEGER REFERENCES clients(id),
    task_id INTEGER REFERENCES tasks(id),
    message_id INTEGER REFERENCES messages(id),
    details TEXT -- store JSON data
);

-- New Table: documents
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    s3_key TEXT NOT NULL UNIQUE,
    uploaded_by_user_id INTEGER, -- FK to users(id) if applicable
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- New Table: document_versions (Optional)
CREATE TABLE document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    s3_key TEXT NOT NULL UNIQUE,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Indexes for performance
CREATE INDEX idx_documents_task_id ON documents(task_id);
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_event_id ON documents(event_id);
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
11.10 Summary
By integrating Amazon S3 for file storage and enhancing your SQLite schema to manage document metadata, your CRM system becomes more robust and capable of handling various artifacts and reports. This integration ensures:

Scalability: Efficiently handle large volumes of documents.
Flexibility: Link documents to multiple entities (tasks, clients, events).
Security: Protect sensitive data through controlled access and encryption.
Auditability: Maintain a clear audit trail via the events table.
These enhancements not only improve the system’s functionality but also pave the way for future expansions, such as integrating more document types, implementing advanced search capabilities, or migrating to a more scalable database solution as your application grows.

Feel free to ask for further details or specific implementations related to any of these components!