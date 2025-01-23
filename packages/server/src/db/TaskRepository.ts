import { BaseRepository } from './BaseRepository';

export class Task {
    id!: number;
    client_id!: number;
    type!: string;
    urgency!: string;
    status!: string;
    title!: string;
    description?: string;
    created_at!: string;
    primary_document_id?: number;

    get isUrgent(): boolean {
        return this.urgency === 'urgent';
    }

    get isOpen(): boolean {
        return this.status === 'open';
    }
}

interface CreateTaskData {
    client_id: number;
    type: string;
    urgency: string;
    title: string;
    description?: string;
    primary_document_id?: number;
}

export class TaskRepository extends BaseRepository {
    // Cache prepared statements with class mapping
    private readonly findByIdStmt = this.query<Task>('SELECT * FROM tasks WHERE id = $id').as(Task);
    private readonly findByClientStmt = this.query<Task>('SELECT * FROM tasks WHERE client_id = $clientId ORDER BY created_at DESC').as(Task);
    private readonly findOpenTasksStmt = this.query<Task>('SELECT * FROM tasks WHERE status = $status ORDER BY created_at DESC').as(Task);

    findById(id: number): Task | undefined {
        return this.findByIdStmt.get({ id });
    }

    findByClientId(clientId: number): Task[] {
        return this.findByClientStmt.all({ clientId });
    }

    findOpenTasks(): Task[] {
        return this.findOpenTasksStmt.all({ status: 'open' });
    }

    create(data: CreateTaskData): { lastInsertRowid: number; changes: number } {
        return this.transaction(() => {
            return super.create('tasks', {
                ...data,
                status: 'open' // Default status for new tasks
            });
        });
    }

    updateStatus(
        id: number, 
        status: string
    ): { lastInsertRowid: number; changes: number } {
        return this.update('tasks', id, { status });
    }

    delete(id: number): { lastInsertRowid: number; changes: number } {
        return this.transaction(() => {
            // Delete associated messages first
            this.query('DELETE FROM messages WHERE task_id = $id')
                .run({ id });
            // Delete the task
            return super.delete('tasks', id);
        });
    }

    /**
     * Example of using the iterate feature for processing large result sets
     */
    *iterateAllTasks(): Generator<Task> {
        const query = this.query<Task>('SELECT * FROM tasks ORDER BY created_at DESC').as(Task);
        for (const task of query.iterate()) {
            yield task;
        }
    }

    /**
     * Example of using values() to get raw arrays for performance
     */
    getRawTaskData(): [number, number, string, string, string, string, string | null, string, number | null][] {
        return this.query('SELECT * FROM tasks ORDER BY id').values();
    }
}
