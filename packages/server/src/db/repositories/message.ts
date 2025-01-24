// @ts-nocheck
import { Database } from "bun:sqlite";
import { BaseRepository } from "./base";
import { MessageRow } from "../types/rows";
import type { Message } from "../../../../shared/src/types/entities";
import type { MessageDirection } from "../../../../shared/src/types/enums";

export class MessageRepository extends BaseRepository<MessageRow, Message> {
    constructor(db: Database) {
        super(db, 'messages');
    }

    protected get rowType() {
        return MessageRow;
    }

    protected mapToEntity(row: MessageRow): Message {
        return {
            id: Number(row.id),
            clientId: Number(row.client_id),
            taskId: row.task_id ? Number(row.task_id) : undefined,
            direction: row.direction as MessageDirection,
            body: row.body,
            sentAt: row.sent_at,
            createdAt: row.created_at
        };
    }

    protected mapFromEntity(entity: Partial<Omit<Message, 'id'>>): Partial<MessageRow> {
        const mapped: Partial<MessageRow> = {};
        
        if ('clientId' in entity) mapped.client_id = entity.clientId;
        if ('taskId' in entity) mapped.task_id = entity.taskId;
        if ('direction' in entity) mapped.direction = entity.direction;
        if ('body' in entity) mapped.body = entity.body;
        if ('sentAt' in entity) mapped.sent_at = entity.sentAt;
        if ('createdAt' in entity) mapped.created_at = entity.createdAt;
        
        return mapped;
    }

    async findByClientId(clientId: number): Promise<Message[]> {
        const rows = this.db.query(`
            SELECT * FROM messages 
            WHERE client_id = ? 
            ORDER BY created_at ASC
        `)
            .as(MessageRow)
            .all(clientId) as MessageRow[];
        
        return rows.map(row => this.mapToEntity(row));
    }

    async findByTaskId(taskId: number): Promise<Message[]> {
        const rows = this.db.query('SELECT * FROM messages WHERE task_id = ? ORDER BY sent_at DESC')
            .as(MessageRow)
            .all(taskId) as MessageRow[];
        
        return rows.map(row => this.mapToEntity(row));
    }

    // Helper method to mark a message as sent
    async markAsSent(id: number): Promise<Message | null> {
        return this.update(id, { sentAt: new Date().toISOString() });
    }

    // Helper method to find draft messages
    async findDrafts(): Promise<Message[]> {
        const rows = this.db.query('SELECT * FROM messages WHERE sent_at IS NULL ORDER BY created_at DESC')
            .as(MessageRow)
            .all() as MessageRow[];
        
        return rows.map(row => this.mapToEntity(row));
    }

    // Helper method to find draft messages for a client
    async findDraftsByClientId(clientId: number): Promise<Message[]> {
        const rows = this.db.query('SELECT * FROM messages WHERE client_id = ? AND sent_at IS NULL ORDER BY created_at DESC')
            .as(MessageRow)
            .all(clientId) as MessageRow[];
        
        return rows.map(row => this.mapToEntity(row));
    }
}
