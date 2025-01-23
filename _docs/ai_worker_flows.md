# AI Worker Flows

The AI Worker is not just for drafting quick replies; it can handle more complex workflows by gathering context, generating structured documents (PRDs), coordinating revisions, and integrating with external systems (e.g., GitHub).

## Feature Request Flow

### Use Case
A client messages: "We'd like a new feature: adding a subscription tier to the product."

### Steps

1. **Classification**
   - System classifies as type = feature_request
   - Scheduling logic determines AI-manageability

2. **AI Worker: Draft PRD**
   - Fetches client's rolling summary and context
   - Constructs a Product Requirements Document (PRD) draft
   - Follows template: Overview, Requirements, Constraints, Stakeholders, Timeline

3. **Store Draft + Notify**
   - Saves PRD draft in system
   - Sends outbound message to client for review
   - Optional: Notifies consultant/product manager

4. **Revisions**
   - Handles client feedback
   - Updates PRD accordingly
   - Tracks revisions in events table

5. **Approval**
   - Marks task as approved/final
   - Logs approval event

6. **GitHub Issue Creation**
   - Creates GitHub issue with PRD
   - Logs github_issue_created event

7. **Ongoing Updates**
   - Monitors GitHub developments
   - Updates client summary

## Bug Report Flow

### Use Case
A client messages: "We found a serious bug in the checkout process."

### Steps

1. **Classification**
   - Classifies as type = bug with urgency level
   - Routes based on severity rules

2. **Context Gathering**
   - Retrieves logs/code references
   - Checks for duplicate issues
   - Determines if human intervention needed

3. **Immediate Draft**
   - Requests additional details if needed
   - Stores outbound message

4. **GitHub Issue Creation**
   - Creates detailed bug report
   - Includes logs and environment details

5. **Assign Owner**
   - Auto-assigns based on rules
   - Logs assignment event

6. **Ongoing AI Support**
   - Prompts for additional info
   - Updates GitHub issue

7. **Resolution & Update**
   - Closes task
   - Notifies client
   - Updates rolling summary

## Architectural Considerations

### 1. Modular AI Worker
```javascript
switch (task.type) {
  case "feature_request":
    handleFeatureRequestFlow(task);
    break;
  case "bug":
    handleBugFlow(task);
    break;
  // ...
}
```

### 2. External Integrations
- GitHub API integration
- Logging tools (Sentry, Datadog)
- Code reference systems

### 3. User Overrides
- Human override capabilities for AI actions
- Dashboard controls for corrections

### 4. Document Store
- Separate tables for extensive documents
- Attachment handling system

## Data Implications

### Tasks Table
- Additional status fields (awaiting_approval, approved)
- Type-specific metadata fields

### Events Table
New event types:
- prd_drafted
- prd_revised
- github_issue_created
- bug_assigned
- bug_resolved

### Messages Table
- Standard inbound/outbound tracking
- Integration with notification system
