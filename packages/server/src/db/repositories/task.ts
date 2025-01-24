import { Database } from "bun:sqlite";
import { BaseRepository } from "./base";
import { TaskRow } from "../types/rows";
import type { Task } from "../../../../shared/src/types/entities";
import type { TaskType, ServiceCategory, TaskUrgency, TaskStatus } from "../../../../shared/src/types/enums";

export class TaskRepository extends BaseRepository<TaskRow, Task> {
    constructor(db: Database) {
        super(db, 'tasks');
    }

    protected get rowType() {
        return TaskRow;
    }

    protected mapToEntity(row: TaskRow): Task {
        return {
            id: Number(row.id),
            clientId: Number(row.client_id),
            type: row.type as TaskType,
            serviceCategory: row.service_category as ServiceCategory,
            urgency: row.urgency as TaskUrgency,
            status: row.status as TaskStatus,
            title: row.title,
            description: row.description,
            createdAt: row.created_at
        };
    }

    protected mapFromEntity(entity: Partial<Omit<Task, 'id' | 'createdAt'>>): Partial<TaskRow> {
        const mapped: Partial<TaskRow> = {};
        
        if ('clientId' in entity) mapped.client_id = entity.clientId;
        if ('type' in entity) mapped.type = entity.type;
        if ('serviceCategory' in entity) mapped.service_category = entity.serviceCategory;
        if ('urgency' in entity) mapped.urgency = entity.urgency;
        if ('status' in entity) mapped.status = entity.status;
        if ('title' in entity) mapped.title = entity.title;
        if ('description' in entity) mapped.description = entity.description;
        
        return mapped;
    }

    async findByClientId(clientId: number): Promise<Task[]> {
        const rows = this.db.query('SELECT * FROM tasks WHERE client_id = ?')
            .as(TaskRow)
            .all(clientId) as TaskRow[];
        
        return rows.map(row => this.mapToEntity(row));
    }

    async findByStatus(status: TaskStatus): Promise<Task[]> {
        const rows = this.db.query('SELECT * FROM tasks WHERE status = ?')
            .as(TaskRow)
            .all(status) as TaskRow[];
        
        return rows.map(row => this.mapToEntity(row));
    }
}