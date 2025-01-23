# Services

The "services" layer handles business logic: classification, scheduling, task processing, etc. Each service is typically a function or class (depending on style).

## Classification Service

- **Function**: `classifyMessage(messageBody: string) => { type: string, urgency: string }`
- **Flow**:
  1. Takes the raw text from the inbound message
  2. Invokes LLM endpoint
  3. Returns an object with:
     - type: 'bug', 'feature_request', 'question', etc.
     - urgency: 'urgent', 'medium', 'low'
  4. This classification guides task creation and routing

## Task Processing Service

- **Function**: `processTask(taskId: number) => void`
- **Flow**:
  1. Takes classification results and creates/updates tasks
  2. Triggers appropriate workflow based on task type:
     - Feature Request: PRD generation → Review → GitHub
     - Bug Report: Context gathering → GitHub Issue
     - Question: AI draft or human routing
  3. Maintains state of both AI and human activities
  4. Logs events for all state changes

## AI Worker Service

- **Function**: `handleAIProcessing(taskId: number) => void`
- **Purpose**: Support and augment human responses with AI-powered analysis and content
- **Flow**:
  1. Retrieves the relevant task and associated messages
  2. Performs cognitive tasks based on type:
     - Feature requests: Generates PRD drafts, analyzes requirements
     - Bug reports: Triages, gathers context, suggests solutions
     - General inquiries: Prepares response drafts, finds relevant documentation
  3. Creates necessary documents and messages
  4. Logs appropriate events
  5. Updates dashboard for human review

## GitHub Integration Service

- **Function**: `createGitHubIssue(taskId: number) => string`
- **Purpose**: Create and manage GitHub issues for development tasks
- **Flow**:
  1. Retrieves task details and related documents
  2. Formats issue content based on task type:
     - Feature requests: Convert PRD to issue format
     - Bug reports: Format with reproduction steps
  3. Creates issue in appropriate repository
  4. Stores issue URL in task details
  5. Logs github_issue_created event

## Event Logging Service

- **Purpose**: Provide a single interface to log all system actions
- **Function**: `logEvent(eventType: string, details: object) => number`
- **Event Types**:
  - Message events: message_in, message_out
  - Task events: task_created, task_updated
  - Client events: client_created, client_updated
  - GitHub events: github_issue_created
  - Document events: document_created, document_updated
- See events.md for detailed event structures
