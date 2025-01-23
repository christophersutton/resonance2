# High-Level Overview

## Purpose

The goal is to build an LLM-powered CRM workflow that receives inbound client requests via SMS (extensible to other channels), classifies them, and uses AI to augment human responses while maintaining a comprehensive audit trail. The system enables more frequent and personalized interactions by having AI handle cognitive tasks while humans focus on relationship building and critical decision-making.

## Services Offered

We provide four main service categories to clients:

- **Development**: Software development and implementation
- **Design**: UI/UX and product design
- **Product Strategy**: Product planning and roadmap development
- **Consulting**: General technical and business consulting

## Flow Summary

1. **Client Onboarding**
   - Create client profile with organization and contact details
   - Configure services they're using
   - Set up communication channels

2. **Request Handling**
   - Inbound SMS (Twilio) → Bun Server Webhook
   - AI Classification: Type (bug, feature, question) & Urgency
   - Task Creation with appropriate routing (AI or Human)

3. **Task Processing**
   - **Feature Requests**: AI drafts PRD → Review → GitHub Issue
   - **Bug Reports**: Context gathering → GitHub Issue → Assignment
   - **Questions**: AI draft or Human response → Client communication

4. **Documentation & Tracking**
   - Comprehensive event logging for all actions
   - Document management (PRDs, specs, etc.)
   - GitHub integration for development tasks

5. **Communication**
   - Outbound SMS responses (via Twilio)
   - Status updates and notifications
   - Client dashboard access (optional)

## Core Technologies

- **Backend**:
  - Bun (runtime & server)
  - SQLite (database)
- **Communication**:
  - Twilio (SMS in/out)
- **AI/ML**:
  - LLM (classification, drafting, analysis)
- **Storage & Integration**:
  - Amazon S3 (document storage)
  - GitHub (issue tracking, development)
- **Frontend**:
  - React (admin dashboard UI)

## Scalability Considerations

- **Parallel Classifiers**: Type + Urgency can be expanded to more classification tasks (e.g., sentiment, language)
- **Extend Channels**: Slack, email, web forms, etc.
- **Sharding or External DB**: For large scale, consider an external RDBMS (PostgreSQL, MySQL)
- **Task Queue**: If concurrency grows, add a queue for AI Worker jobs (e.g., Redis-based)
- **Document Storage**: Consider CDN integration for frequently accessed documents
- **Version Control**: Implement document versioning for PRDs and other critical documents
