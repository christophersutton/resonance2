import type { 
    MessageDirection, TaskType, ServiceCategory, 
    TaskUrgency, TaskStatus 
} from '../../../../shared/src/types/enums';
import type { BaseRow } from "../repositories/base";

export class ClientRow implements BaseRow {
    id!: bigint;
    organization_name!: string;
    first_name!: string;
    last_name!: string;
    email!: string;
    phone?: string;
    services!: string; // JSON string in DB
    created_at!: string;
}

export class MessageRow implements BaseRow {
    id!: bigint;
    client_id!: bigint;
    task_id?: bigint;
    direction!: MessageDirection;
    body!: string;
    sent_at!: string;
    created_at!: string;
}

export class TaskRow implements BaseRow {
    id!: bigint;
    client_id!: bigint;
    type!: string;
    service_category!: string;
    urgency!: string;
    status!: string;
    title!: string;
    description?: string;
    created_at!: string;
}

export class TaskDependencyRow implements BaseRow {
    id!: bigint;
    dependent_task_id!: bigint;
    required_task_id!: bigint;
    created_at!: string;
}

export class EventRow implements BaseRow {
    id!: bigint;
    task_id?: bigint;
    client_id?: bigint;
    event_type!: string;
    details?: string; // JSON string in DB
    created_at!: string;
}

export class DocumentRow implements BaseRow {
    id!: bigint;
    task_id?: bigint;
    client_id?: bigint;
    event_id?: bigint;
    file_name!: string;
    file_type!: string;
    s3_key!: string;
    uploaded_by_user_id?: bigint;
    uploaded_at!: string;
    description?: string;
    created_at!: string;
}

export class DocumentVersionRow implements BaseRow {
    id!: bigint;
    document_id!: bigint;
    version_number!: number;
    s3_key!: string;
    uploaded_at!: string;
    description?: string;
    created_at!: string;
}
