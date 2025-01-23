# AI Worker Flows

The AI Worker handles complex workflows by managing task dependencies, coordinating reviews, and integrating with external systems.

## Feature Request Flow

### Use Case
A client messages: "We'd like a new feature: adding a subscription tier to the product."

### Steps

1. **Initial Classification & Task Creation**

   ```javascript
   // Example flow
   const tasks = await createFeatureTasks({
     title: "Add subscription tier",
     clientId: client.id,
     services: client.services // ["STRATEGY", "DESIGN", "DEV"]
   });
   
   // Creates dependent tasks based on available services
   const strategyTask = {
     type: "FEATURE_REQUEST",
     service_category: "STRATEGY",
     status: "open"
   };
   
   const designTask = {
     type: "FEATURE_REQUEST",
     service_category: "DESIGN",
     status: "blocked"
   };
   
   const devTask = {
     type: "FEATURE_REQUEST",
     service_category: "DEV",
     status: "blocked"
   };
   
   // Set up dependencies
   await createDependency(designTask.id, strategyTask.id);
   await createDependency(devTask.id, designTask.id);
   ```

2. **Strategy Phase (PRD Creation)**
   - AI drafts initial PRD
   - Moves task to needs_client_review
   - Sends client review request message
   - On approval:
     - Marks strategy task complete
     - Unblocks design task
     - Logs task_service_phase_complete

3. **Design Phase**

   ```javascript
   // When design task unblocks
   async function handleDesignPhase(task) {
     // Get context from completed strategy task
     const strategyTask = await getRequiredTask(task.id);
     const prd = await getTaskDocument(strategyTask.id);
     
     // Generate design requirements
     const designReqs = await generateDesignRequirements(prd);
     
     // Create design doc
     const designDoc = await createDocument({
       task_id: task.id,
       content: designReqs
     });
     
     // Move to review
     await updateTaskStatus(task.id, "needs_review");
     await logEvent("task_needs_review", {
       task_id: task.id,
       document_ids: [designDoc.id]
     });
   }
   ```

4. **Development Phase**
   - Triggers when design is approved
   - Creates GitHub issue with PRD + design refs
   - Sets up implementation tasks
   - Manages technical review process

## Review Handling

### Internal Review Flow

```javascript
async function handleInternalReview(task) {
  // Prepare review package
  const docs = await getTaskDocuments(task.id);
  const context = await getTaskContext(task.id);
  
  await updateTaskStatus(task.id, "needs_review");
  await logEvent("task_needs_review", {
    task_id: task.id,
    document_ids: docs.map(d => d.id),
    review_notes: await generateReviewNotes(context)
  });
}
```

### Client Review Flow

```javascript
async function handleClientReview(task) {
  // Prepare client-facing summary
  const summary = await generateClientSummary(task);
  
  // Send review request
  const message = await sendOutboundMessage({
    client_id: task.client_id,
    body: summary
  });
  
  await updateTaskStatus(task.id, "needs_client_review");
  await logEvent("task_needs_client_review", {
    task_id: task.id,
    outbound_message_id: message.id
  });
}
```

## Dependency Management

### Task Blocking

```javascript
async function handleTaskDependencies(taskId) {
  const deps = await getTaskDependencies(taskId);
  const unmetDeps = deps.filter(d => !isComplete(d));
  
  if (unmetDeps.length > 0) {
    await updateTaskStatus(taskId, "blocked");
    await logEvent("task_blocked", {
      task_id: taskId,
      blocked_by_task_ids: unmetDeps.map(d => d.id)
    });
  }
}
```

### Task Unblocking

```javascript
async function checkDependencies(taskId) {
  const deps = await getTaskDependencies(taskId);
  const allMet = deps.every(isComplete);
  
  if (allMet) {
    await updateTaskStatus(taskId, "open");
    await logEvent("task_unblocked", {
      task_id: taskId,
      completed_dependencies: deps.map(d => d.id)
    });
  }
}
```

## Architectural Considerations

### 1. Review State Management
- Track both internal and client review states
- Handle review feedback and revision cycles
- Maintain document versions during reviews

### 2. Dependency Tracking
- Verify service availability before creating dependent tasks
- Handle dependency chain updates
- Manage task blocking/unblocking

### 3. Document Flow
- Maintain document relationships across dependent tasks
- Version control for revisions
- Link documents in GitHub issues

### 4. Client Communication
- Automated status updates
- Review request messages
- Progress notifications

## Bug Report Flow

### Use Case
A client messages: "We found a serious bug in the checkout process."

### Steps

1. **Classification & Task Creation**

   ```javascript
   const task = await createBugTask({
     title: "Checkout process bug",
     clientId: client.id,
     service_category: "DEV", // Bugs are always DEV
     urgency: await classifyBugUrgency(message)
   });
   ```

2. **Context Gathering**

   ```javascript
   async function gatherBugContext(task) {
     // Get logs and error context
     const logs = await fetchRecentLogs({
       service: "checkout",
       timeWindow: "24h",
       errorOnly: true
     });
     
     // Check for duplicates
     const similarIssues = await findSimilarGitHubIssues(task.title);
     
     // Create context document
     const contextDoc = await createDocument({
       task_id: task.id,
       content: {
         logs,
         similar_issues: similarIssues,
         environment_details: await getEnvironmentDetails()
       }
     });
     
     return contextDoc;
   }
   ```

3. **GitHub Integration**

   ```javascript
   async function createGitHubIssue(task, contextDoc) {
     const issueBody = await generateIssueBody({
       task,
       context: contextDoc,
       template: "bug_report"
     });
     
     const issue = await github.createIssue({
       title: task.title,
       body: issueBody,
       labels: ["bug", task.urgency]
     });
     
     await logEvent("github_issue_created", {
       task_id: task.id,
       issue_url: issue.html_url,
       issue_number: issue.number
     });
     
     return issue;
   }
   ```

4. **Owner Assignment**

   ```javascript
   async function assignBugOwner(task, issue) {
     // Determine owner based on affected area
     const owner = await findBestOwner({
       service: "checkout",
       type: "bug",
       context: await getTaskContext(task.id)
     });
     
     // Assign in GitHub
     await github.addAssignee(issue.number, owner);
     
     // Update task and log event
     await updateTaskStatus(task.id, "in_progress");
     await logEvent("task_updated", {
       task_id: task.id,
       changes: {
         assigned_to: [null, owner],
         status: ["open", "in_progress"]
       }
     });
   }
   ```

5. **Review Process**

   ```javascript
   async function handleBugReview(task) {
     // For critical bugs
     if (task.urgency === "urgent") {
       // Request immediate technical review
       await handleInternalReview(task);
     }
     
     // Once fix is ready
     await handleClientReview(task, {
       template: "bug_fix_review",
       include_testing_notes: true
     });
   }
   ```

## Research/Report Flow

### Use Case
A client messages: "Can you research cloud storage options for our use case?"

### Steps

1. **Classification & Task Creation**

   ```javascript
   const task = await createResearchTask({
     title: "Cloud storage options research",
     clientId: client.id,
     service_category: await classifyResearchCategory(message),
     type: "RESEARCH"
   });
   
   // Create research plan document
   const planDoc = await createDocument({
     task_id: task.id,
     title: "Research Plan",
     content: await generateResearchPlan(task)
   });
   ```

2. **Research Phase**

   ```javascript
   async function conductResearch(task) {
     // Gather context and requirements
     const requirements = await extractRequirements(task);
     
     // Research process
     const research = await Promise.all([
       analyzeOptions(requirements),
       gatherCaseStudies(requirements),
       compareProviders(requirements)
     ]);
     
     // Generate report
     const reportDoc = await createDocument({
       task_id: task.id,
       title: "Research Report",
       content: await generateReport(research)
     });
     
     // Move to review
     await handleInternalReview(task, {
       template: "research_review",
       document_ids: [reportDoc.id]
     });
   }
   ```

3. **Review & Revision**

   ```javascript
   async function handleResearchReview(task) {
     // Internal review first
     await handleInternalReview(task);
     
     // After internal approval, prepare client version
     const clientDoc = await createClientVersion(task);
     
     // Request client review
     await handleClientReview(task, {
       template: "research_delivery",
       document_ids: [clientDoc.id]
     });
   }
   ```

## Revision Request Flow

### Use Case
A client messages: "Can we update the mockups to use our new brand colors?"

### Steps

1. **Classification & Task Creation**

   ```javascript
   const task = await createRevisionTask({
     title: "Update mockups with new brand colors",
     clientId: client.id,
     service_category: "DESIGN",
     type: "REVISION"
   });
   
   // Try to link to original task
   const originalTask = await findRelatedTask(task);
   if (originalTask) {
     await linkTasks(task.id, originalTask.id);
   }
   ```

2. **Context Gathering**

   ```javascript
   async function gatherRevisionContext(task) {
     // Get original assets
     const originalDocs = await getLinkedTaskDocuments(task.id);
     
     // Get brand guidelines
     const brandDocs = await findClientDocuments(task.client_id, "brand_guidelines");
     
     // Create revision spec
     const revisionDoc = await createDocument({
       task_id: task.id,
       title: "Revision Specification",
       content: await generateRevisionSpec({
         original_docs: originalDocs,
         brand_docs: brandDocs,
         revision_request: task.description
       })
     });
     
     return revisionDoc;
   }
   ```

3. **Version Management**

   ```javascript
   async function handleRevisionVersions(task, originalDoc) {
     // Create new version
     const newVersion = await createDocumentVersion({
       document_id: originalDoc.id,
       based_on: originalDoc.current_version,
       changes: await generateChangeList(task)
     });
     
     // Update task with new version
     await updateTask(task.id, {
       primary_document_id: newVersion.id
     });
     
     // Log version creation
     await logEvent("document_version_created", {
       task_id: task.id,
       document_id: originalDoc.id,
       version_id: newVersion.id
     });
   }
   ```

4. **Review Process**

   ```javascript
   async function handleRevisionReview(task) {
     // Internal design review
     await handleInternalReview(task, {
       template: "design_revision_review",
       reviewers: await findDesignReviewers()
     });
     
     // After internal approval, send to client
     await handleClientReview(task, {
       template: "design_revision_approval",
       include_version_comparison: true
     });
   }
   ```

5. **Finalization**

   ```javascript
   async function finalizeRevision(task) {
     // On approval, update all references
     await updateDesignReferences(task);
     
     // If part of larger feature, notify dependent tasks
     await notifyDependentTasks(task);
     
     // Archive old versions
     await archiveOldVersions(task);
   }
   ```

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
