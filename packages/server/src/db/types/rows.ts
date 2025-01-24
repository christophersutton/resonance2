import type { 
    MessageDirection, TaskType, ServiceCategory, 
    TaskUrgency, TaskStatus 
} from '../../../../shared/src/types/enums';

export interface BaseRow {
    id: number;
    created_at: string;
}

export class ClientRow implements BaseRow {
    id!: number;
    organization_name!: string;
    first_name!: string;
    last_name!: string;
    email!: string;
    phone?: string;
    services!: string; // JSON string in DB
    created_at!: string;
}

export class TaskRow implements BaseRow {
    id!: number;
    client_id!: number;
    type!: string;
    service_category!: string;
    urgency!: string;
    status!: string;
    title!: string;
    description?: string;
    created_at!: string;
}

export class MessageRow implements BaseRow {
    id!: number;
    client_id!: number;
    task_id?: number;
    direction!: MessageDirection;
    body!: string;
    sent_at?: string; // Optional for draft messages
    created_at!: string;
}

export class TaskDependencyRow implements BaseRow {
    id!: number;
    dependent_task_id!: number;
    required_task_id!: number;
    created_at!: string;
}

export class EventRow implements BaseRow {
    id!: number;
    task_id?: number;
    client_id?: number;
    event_type!: string;
    details?: string; // JSON string in DB
    created_at!: string;
}

export class DocumentRow implements BaseRow {
    id!: number;
    task_id?: number;
    client_id?: number;
    event_id?: number;
    file_name!: string;
    file_type!: string;
    s3_key!: string;
    uploaded_by_user_id?: number;
    uploaded_at!: string;
    description?: string;
    created_at!: string;
}

export class DocumentVersionRow implements BaseRow {
    id!: number;
    document_id!: number;
    version_number!: number;
    s3_key!: string;
    uploaded_at!: string;
    description?: string;
    created_at!: string;
}
