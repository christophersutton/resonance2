# React Frontend (Admin Dashboard)

## Overview

A single-page application (SPA) built with React. It communicates with the Bun server via the REST APIs described above (or GraphQL, if chosen).

## Core UI Components

### 1. Login / Auth (optional)
- If authentication is needed, a login page. Otherwise skip if internal only.

### 2. Tasks List
- Table or cards displaying tasks (title, status, type, urgency, creation date)
- AI Progress indicators showing:
  - Draft status
  - Analysis completion
  - Generated content ready for review
- Filters at the top:
  - By status (open, in_progress, closed)
  - By type (bug, consult, etc.)
  - By urgency (urgent, medium, low)

### 3. Task Detail / Message Thread
- Clicking a task shows:
  - All messages associated with that client/task
  - AI-generated drafts and analysis
  - Suggested responses or actions
  - Context from similar past interactions
- Document management section:
  - Upload new documents
  - View/download existing documents
  - Document version history
- Response composer with:
  - AI-suggested drafts
  - Customization options
  - Tone and style adjustments
  - Preview before sending

### 4. Document Management
- Document list view with filters:
  - By task
  - By client
  - By type (PRD, bug report, etc.)
  - By date range
- Document preview/download capabilities
- Version history tracking
- Integration with task workflows:
  - Auto-attach generated PRDs
  - Link bug reports with GitHub issues
  - Track document approvals and revisions

### 5. Activity Feed
- A chronological list of events from the events table
- For each event, show event_type, timestamp, and relevant details

### 6. Client Profile (Sidebar or separate page)
- clients.summary displayed at the top, plus phone_number, name, etc.
- Possibly an "Edit summary" button if you want to override or manually note something

## State Management
- React Query or Redux can be used to handle server data
- Caching: tasks, events, messages can be cached for quick reloading

## Typical Flows

### Human picks a Task
1. The server returns the entire conversation or relevant events
2. The human can respond with an outbound message, which calls POST /api/messages/send
3. The UI automatically logs a new event in the feed
