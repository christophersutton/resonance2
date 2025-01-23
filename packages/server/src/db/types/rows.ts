import type { 
    MessageDirection, TaskType, ServiceCategory, 
    TaskUrgency, TaskStatus 
} from '../../../../shared/src/types/enums';

export class ClientRow {
    id!: number;
    organization_name!: string;
    first_name!: string;
    last_name!: string;
    email!: string;
    phone?: string;
    services!: string; // JSON string in DB
    created_at!: string;
}

export class MessageRow {
    id!: number;
    client_id!: number;
    task_id?: number;
    direction!: MessageDirection;
    body!: string;
    sent_at!: string;
}

export class TaskRow {
    id!: number;
    client_id!: number;
    type!: TaskType;
    service_category!: ServiceCategory;
    urgency!: TaskUrgency;
    status!: TaskStatus;
    title!: string;
    description?: string;
    created_at!: string;
}

export class TaskDependencyRow {
    id!: number;
    dependent_task_id!: number;
    required_task_id!: number;
    created_at!: string;
}

export class EventRow {
    id!: number;
    task_id?: number;
    client_id?: number;
    event_type!: string;
    details?: string; // JSON string in DB
    created_at!: string;
}

export class DocumentRow {
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
}

export class DocumentVersionRow {
    id!: number;
    document_id!: number;
    version_number!: number;
    s3_key!: string;
    uploaded_at!: string;
    description?: string;
}
