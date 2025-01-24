import { Database } from "bun:sqlite";
import { BaseRepository } from "./base";
import { TaskRow, EventRow } from "../types/rows";
import type { Task, Event } from "../../../../shared/src/types/entities";
import type { TaskType, ServiceCategory, TaskUrgency, TaskStatus } from "../../../../shared/src/types/enums";

// Type for Task with events array
type TaskWithEvents = Task & { events: Event[] };

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

    async findByIdWithEvents(id: number): Promise<TaskWithEvents | null> {
        const task = await this.findById(id);
        if (!task) return null;

        const events = this.db.query(`
            SELECT 
                id, task_id, client_id, event_type, 
                details, created_at 
            FROM events 
            WHERE task_id = ? 
            ORDER BY created_at DESC
        `).all(id) as EventRow[];

        return {
            ...task,
            events: events.map(row => ({
                id: Number(row.id),
                taskId: row.task_id ? Number(row.task_id) : undefined,
                clientId: row.client_id ? Number(row.client_id) : undefined,
                eventType: row.event_type,
                details: row.details ? JSON.parse(row.details) : undefined,
                createdAt: row.created_at
            }))
        };
    }

    async findByClientIdWithEvents(clientId: number): Promise<TaskWithEvents[]> {
        const tasks = await this.findByClientId(clientId);
        if (tasks.length === 0) return [];

        // Get all events for these tasks in a single query
        const events = this.db.query(`
            SELECT 
                id, task_id, client_id, event_type, 
                details, created_at 
            FROM events 
            WHERE task_id IN (${tasks.map(() => '?').join(',')})
            ORDER BY created_at DESC
        `).all(...tasks.map(t => t.id)) as EventRow[];

        // Create a map of taskId to events for efficient lookup
        const eventsByTaskId = new Map<number, Event[]>();
        events.forEach(row => {
            const taskId = Number(row.task_id);
            if (!eventsByTaskId.has(taskId)) {
                eventsByTaskId.set(taskId, []);
            }
            eventsByTaskId.get(taskId)?.push({
                id: Number(row.id),
                taskId: row.task_id ? Number(row.task_id) : undefined,
                clientId: row.client_id ? Number(row.client_id) : undefined,
                eventType: row.event_type,
                details: row.details ? JSON.parse(row.details) : undefined,
                createdAt: row.created_at
            });
        });

        return tasks.map(task => ({
            ...task,
            events: eventsByTaskId.get(task.id) || []
        }));
    }
}