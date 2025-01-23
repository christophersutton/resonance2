import type { 
    MessageDirection, TaskType, ServiceCategory, 
    TaskUrgency, TaskStatus, ClientService 
} from './enums';
import type { BaseEntity } from '../../../server/src/db/repositories/base';

export interface Client extends BaseEntity {
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

export interface Task extends BaseEntity {
    id: number;
    clientId: number;
    type: TaskType;
    serviceCategory: ServiceCategory;
    urgency: TaskUrgency;
    status: TaskStatus;
    title: string;
    description?: string;
    createdAt: string; // ISO datetime string
}

export interface TaskDependency {
    id: number;
    dependentTaskId: number;
    requiredTaskId: number;
    createdAt: string; // ISO datetime string
}

export interface Event extends BaseEntity {
    id: number;
    taskId?: number;
    clientId?: number;
    eventType: string;
    details?: Record<string, unknown>;
    createdAt: string; // ISO datetime string
}

export interface Document extends BaseEntity {
    id: number;
    taskId?: number;
    clientId?: number;
    eventId?: number;
    fileName: string;
    fileType: string; // e.g., 'application/pdf', 'image/png'
    s3Key: string; // Unique identifier for the S3 object
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
