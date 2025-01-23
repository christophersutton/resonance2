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
  "type": "bug|feature_request|question",
  "urgency": "urgent|medium|low",
  "title": "task title",
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
    "type": ["question", "bug"],
    // other changed fields
  },
  "updated_by_user_id": 1, // if updated by human
  "updated_by_ai": true // if updated by AI
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
  "services": ["Development", "Design"]
}
```

#### client_updated
- When: Client information is modified
- Details JSON structure:
```json
{
  "client_id": 789,
  "changes": {
    "services": [["Development"], ["Development", "Design"]],
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
