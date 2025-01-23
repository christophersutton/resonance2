# Services

Below is an overview of the key services in our application and how they relate to the current task flows and database schema.

## Classification Service

- **Purpose**: Processes inbound messages and classifies them into defined task types (e.g., Feature Request, Bug Report, Question, Research).
- **Flow**:  
  1. Receives new inbound messages from the webhook/event pipeline.  
  2. Uses the updated classification approach to assign the correct category/type to each task.  
  3. Inserts or updates the corresponding record in the database (referencing the `tasks` table) with the identified category and initial status.  
- **Considerations**:  
  - Must handle edge cases (uncertain classification, incomplete metadata).  
  - May invoke confidence checks or fallback logic.  

## AI Worker Service

- **Purpose**: Manages advanced logic and text processing once the task type is confirmed by the Classification Service.  
- **Flow**:  
  1. Listens for new or updated tasks in the "ready for AI" status.  
  2. Performs the relevant AI operations (e.g., summarizing user requests, refining bug reproduction steps, drafting responses) based on task type.  
  3. Updates task details in the database, optionally transitioning the task status from "AI Review" to "Human Review" or finalization.  
- **Considerations**:  
  - Error handling should be consistent with the new events-based approach, ensuring retries or fallback if an AI task fails.  
  - Incorporate concurrency safeguards and timeouts for large volumes of tasks.  

## GitHub Integration Service

- **Purpose**: Creates or updates GitHub issues for tasks classified as code-related (e.g., Feature Requests, Bug Reports).  
- **Flow**:  
  1. Subscribes to task events indicating a new or reclassified code-related task.  
  2. Creates a GitHub issue (or updates existing issues) with relevant details, such as steps to reproduce for bugs or acceptance criteria for feature requests.  
  3. Tracks and synchronizes status changes in both systems (task closed on GitHub → updates "tasks" table, for example).  
- **Considerations**:  
  - Must handle GitHub API rate limits and authentication.  
  - Ensures that status changes are propagated accurately (e.g., linking GitHub issue closure to the corresponding local task status).  

## Other Supporting Services

- **Document Management**  
  - Manages file attachments associated with tasks, ensuring consistent references in the `documents` table.  
- **Notification/Alert Service**  
  - Monitors critical system events and escalates (e.g., errors during AI processing, repeated classification failures).  

## Concurrency and Event Handling

- Services communicate primarily through event subscriptions (see `events.md`).  
- Each service is designed to handle concurrent tasks and process them in FIFO or priority-based order as needed.  
- Retry logic, dead-letter queues, and error-catching best practices are recommended to ensure resilient task handling.

---

This updated structure aligns with the latest task definitions ("core_flows.md" and "database_schema.md") and clarifies how each service interacts with the new classification approach. Make sure to keep the references to task lifecycle status states and event triggers up to date as new features or flows are added.
