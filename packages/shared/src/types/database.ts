export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export type TaskType = 'GENERAL' | 'DOCUMENT_REVIEW' | 'MEETING';
export type TaskUrgency = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type ClientService = 'Development' | 'Design' | 'Product Strategy' | 'Consulting';

export interface Client {
    id: number;
    organizationName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    services: ClientService[];
    createdAt: string; // ISO datetime string
}

export interface Message {
    id: number;
    clientId: number;
    taskId?: number;
    direction: MessageDirection;
    body: string;
    sentAt: string; // ISO datetime string
}

export interface Task {
    id: number;
    clientId: number;
    type: TaskType;
    urgency: TaskUrgency;
    status: TaskStatus;
    title: string;
    description?: string;
    createdAt: string; // ISO datetime string
    primaryDocumentId?: number;
}

export interface Event {
    id: number;
    taskId?: number;
    clientId?: number;
    eventType: string;
    details?: Record<string, unknown>;
    createdAt: string; // ISO datetime string
}

export interface Document {
    id: number;
    taskId?: number;
    clientId?: number;
    eventId?: number;
    fileName: string;
    fileType: string;
    s3Key: string;
    uploadedByUserId?: number;
    uploadedAt: string; // ISO datetime string
    description?: string;
}

export interface DocumentVersion {
    id: number;
    documentId: number;
    versionNumber: number;
    s3Key: string;
    uploadedAt: string; // ISO datetime string
    description?: string;
}
