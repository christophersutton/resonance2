# Core System Flows

This document describes the main workflows in the system, particularly how messages, tasks, and events interact.

## Inbound Message Flow

1. **Message Reception**
   - Twilio webhook receives SMS
   - System creates `messages` record with direction='inbound'
   - System logs `message_in` event

2. **Classification**
   - AI classifies message content (type, urgency)
   - System either:
     a. Creates new task if it's a new request
     b. Associates message with existing task if it's part of ongoing conversation
   - System logs `task_created` or `task_updated` event

3. **Routing**
   - Based on classification, system decides:
     a. AI can handle (draft response, create PRD, etc.)
     b. Needs human attention
   - System updates task status accordingly
   - System logs appropriate events

## Task Type-Specific Flows

### Feature Request Flow
1. **Initial Request**
   - Message classified as 'feature_request'
   - New task created with type='feature_request'

2. **PRD Generation**
   - AI drafts initial PRD
   - System creates document record
   - System logs event with PRD details

3. **Review Process**
   - Client and consultant review PRD
   - System tracks revisions through events
   - Final approval logged as event

4. **GitHub Integration**
   - System creates GitHub issue from approved PRD
   - Issue link stored in task or event details

### Bug Report Flow
1. **Initial Report**
   - Message classified as 'bug'
   - New task created with type='bug'

2. **Context Gathering**
   - AI attempts to gather:
     - Error logs
     - Related code
     - Recent changes
   - Information stored in task description or documents

3. **GitHub Issue**
   - System creates detailed GitHub issue
   - Assigns to appropriate owner
   - Links issue in task details

### General Question Flow
1. **Question Reception**
   - Message classified as 'question'
   - Urgency determined

2. **Response Generation**
   - If simple: AI drafts response
   - If complex: Routed to human expert
   - Response stored as outbound message

3. **Follow-up**
   - System monitors for follow-up messages
   - Associates with original task
   - Updates task status as needed

## Event Tracking

Every significant action in these flows generates events, providing:
- Audit trail
- Activity feed for UI
- State change history
- Integration points for notifications

Example event sequence for feature request:
```
message_in → task_created → document_created → message_out (draft PRD) → 
task_updated (status change) → message_in (feedback) → document_updated → 
task_updated (approved) → github_issue_created
```
