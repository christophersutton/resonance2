# Event System

The event system provides a comprehensive audit trail of all actions and state changes in the system. Each event is stored in the `events` table with associated metadata and details.

## Event Types

### Message Events

#### message_in

- When: Client sends an inbound message
- Details JSON structure:

```json
{
  "from_number": "+1234567890",
  "body": "message text",
  "message_id": 123,
  "twilio_sid": "SMxxx" // if via Twilio
}
```

#### message_out

- When: System or human sends an outbound message
- Details JSON structure:

```json
{
  "to_number": "+1234567890",
  "body": "message text",
  "message_id": 124,
  "sent_by_user_id": 1, // if sent by human
  "ai_generated": true, // if drafted by AI
  "twilio_sid": "SMxxx" // if via Twilio
}
```

### Task Events

#### task_created

- When: New task is created from message or manually
- Details JSON structure:

```json
{
  "task_id": 456,
  "type": "FEATURE_REQUEST",
  "service_category": "STRATEGY",
  "urgency": "urgent",
  "title": "Add subscription feature",
  "source": "message|manual|ai",
  "source_message_id": 123 // if created from message
}
```

#### task_updated

- When: Task properties are modified
- Details JSON structure:

```json
{
  "task_id": 456,
  "changes": {
    "status": ["open", "in_progress"],
    "type": ["QUESTION", "BUG"],
    "service_category": ["DESIGN", "DEV"],
    // other changed fields
  },
  "updated_by_user_id": 1, // if updated by human
  "updated_by_ai": true // if updated by AI
}
```

#### task_service_phase_complete

- When: A task completes one service phase and moves to another
- Details JSON structure:

```json
{
  "task_id": 456,
  "completed_service": "STRATEGY",
  "next_service": "DESIGN",
  "document_ids": [789], // any final documents from this phase
  "status": "in_progress"
}
```

#### task_dependency_added

- When: A dependency is created between tasks
- Details JSON structure:

```json
{
  "dependent_task_id": 456,
  "required_task_id": 123,
  "dependent_service": "DEV",
  "required_service": "DESIGN"
}
```

#### task_blocked

- When: A task becomes blocked waiting for dependencies
- Details JSON structure:

```json
{
  "task_id": 456,
  "blocked_by_task_ids": [123, 124],
  "status_change": ["in_progress", "blocked"]
}
```

#### task_unblocked

- When: All blocking dependencies are resolved
- Details JSON structure:

```json
{
  "task_id": 456,
  "status_change": ["blocked", "in_progress"],
  "completed_dependencies": [123, 124]
}
```

#### task_needs_review

- When: Task is ready for internal team review
- Details JSON structure:

```json
{
  "task_id": 456,
  "status_change": ["in_progress", "needs_review"],
  "review_type": "internal",
  "reviewer_ids": [1, 2],  // Optional: specific reviewers
  "document_ids": [789],   // Optional: documents to review
  "review_notes": "Please check the API design"
}
```

#### task_needs_client_review

- When: Task is ready for client review
- Details JSON structure:

```json
{
  "task_id": 456,
  "status_change": ["in_progress", "needs_client_review"],
  "document_ids": [789],
  "review_notes": "Please review the proposed design",
  "outbound_message_id": 123  // Reference to the message sent to client
}
```

### Client Events

#### client_created

- When: New client is added to the system
- Details JSON structure:

```json
{
  "client_id": 789,
  "organization_name": "Acme Corp",
  "services": ["STRATEGY", "DESIGN", "DEV"]
}
```

#### client_updated

- When: Client information is modified
- Details JSON structure:

```json
{
  "client_id": 789,
  "changes": {
    "services": [["DEV"], ["DEV", "DESIGN"]],
    "phone": ["old_number", "new_number"]
    // other changed fields
  }
}
```

## Event Queries

Common event queries for different views:

### Activity Feed

```sql
SELECT * FROM events 
WHERE client_id = ? 
ORDER BY created_at DESC 
LIMIT 50
```

### Task History

```sql
SELECT * FROM events 
WHERE task_id = ? 
ORDER BY created_at ASC
```

### Client Audit Trail

```sql
SELECT * FROM events 
WHERE client_id = ? 
  AND event_type IN ('client_created', 'client_updated') 
ORDER BY created_at ASC
```
