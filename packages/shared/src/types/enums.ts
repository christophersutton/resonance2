export type MessageDirection = 'inbound' | 'outbound';

export type TaskType = 'FEATURE_REQUEST' | 'BUG' | 'REVISION' | 'RESEARCH' | 'QUESTION';
export type ServiceCategory = 'STRATEGY' | 'DESIGN' | 'DEV' | 'CONSULT';
export type TaskUrgency = 'urgent' | 'medium' | 'low';
export type TaskStatus = 'open' | 'blocked' | 'in_progress' | 'needs_review' | 'needs_client_review' | 'closed';

export type ClientService = ServiceCategory;
