# Email Webhook Integration Flow

## Overview
This document outlines the implementation plan for receiving and processing emails via Mailgun webhook integration, using OpenAI for message classification and task generation.

## Components

### 1. Webhook Endpoint
- Route: `/api/v1/webhooks/email`
- Method: POST
- Authentication: Mailgun webhook signing key validation
- Payload: Standard Mailgun webhook payload containing email details

### 2. Email Processing Flow

1. **Webhook Reception**
   - Validate Mailgun webhook signature
   - Extract email data (from, subject, body, attachments)
   - Identify client based on sender email
   - Create initial message record with direction='inbound'

2. **Content Processing**
   - Strip email formatting/signatures
   - Handle attachments if present
   - Extract meaningful content for AI processing

3. **AI Classification** (using OpenAI)
   - Analyze email content to determine:
     - Task type (feature_request, bug, question, etc.)
     - Service category (strategy, design, dev, consult)
     - Urgency level
     - Whether it relates to existing task
   - Generate structured task details (title, description)

4. **Task Management**
   - If new task needed:
     - Create task record with AI-generated details
     - Associate message with new task
   - If related to existing task:
     - Update existing task with new information
     - Associate message with existing task
   - Generate appropriate events

5. **Response Generation**
   - Use OpenAI to draft initial response if needed
   - Store as outbound message
   - Queue for human review if necessary
   - Send via Mailgun API (future implementation)

## Implementation Steps

1. **Setup & Dependencies**
   - Install OpenAI SDK
   - Configure Mailgun webhook settings
   - Add webhook security middleware

2. **Database Updates**
   - Add email_thread_id to messages table (for threading)
   - Add email_metadata JSON field for storing headers, etc.

3. **New Services**
   - EmailWebhookService: Handle webhook validation and initial processing
   - EmailParserService: Clean and structure email content
   - MessageClassifierService: OpenAI integration for analysis
   - TaskManagerService: Handle task creation/updates

4. **Testing**
   - Unit tests for each service
   - Integration tests with Mailgun webhook simulation
   - AI classification accuracy testing

## Security Considerations

- Validate all Mailgun webhook signatures
- Store API keys securely in environment variables
- Sanitize email content before processing
- Rate limiting on webhook endpoint
- Access logging for audit trail

## Future Enhancements

1. Attachment handling and storage
2. Email threading support
3. Automated response sending
4. HTML email formatting
5. Email template system for responses

## Configuration Requirements

```typescript
interface EmailConfig {
  mailgun: {
    webhookSigningKey: string;
    apiKey: string;
    domain: string;
  };
  openai: {
    apiKey: string;
    model: string; // e.g., "gpt-4-turbo-preview"
  };
}
```

## Implementation Progress

### Phase 1 - Initial Setup (2025-01-24)
- ✅ Added OpenAI SDK dependency
- ✅ Created OpenAIService for message classification
- ✅ Created EmailService for handling incoming emails
- ✅ Implemented webhook endpoint at `/api/v1/webhooks/email`
- ✅ Added configuration for OpenAI and Mailgun

### Next Steps
1. Implement Mailgun webhook signature validation
2. Add proper TypeScript types for Mailgun client
3. Enhance email content cleaning (signatures, reply chains)
4. Add tests for services and webhook endpoint
5. Set up proper error handling and logging
