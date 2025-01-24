// @ts-nocheck
import { Database } from "bun:sqlite";
import { BaseRepository } from "./base";
import { ClientRow } from "../types/rows";
import type { Client } from "../../../../shared/src/types/entities";
import type { ClientService } from "../../../../shared/src/types/enums";

export class ClientRepository extends BaseRepository<ClientRow, Client> {
    constructor(db: Database) {
        super(db, 'clients');
    }

    protected get rowType() {
        return ClientRow;
    }

    protected mapToEntity(row: ClientRow): Client {
        return {
            id: Number(row.id),
            organizationName: row.organization_name,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            services: JSON.parse(row.services) as ClientService[],
            createdAt: row.created_at
        };
    }

    protected mapFromEntity(entity: Partial<Omit<Client, 'id' | 'createdAt'>>): Partial<ClientRow> {
        const mapped: Partial<ClientRow> = {};

        if ('organizationName' in entity) mapped.organization_name = entity.organizationName;
        if ('firstName' in entity) mapped.first_name = entity.firstName;
        if ('lastName' in entity) mapped.last_name = entity.lastName;
        if ('email' in entity) mapped.email = entity.email;
        if ('phone' in entity) mapped.phone = entity.phone;
        if ('services' in entity) mapped.services = JSON.stringify(entity.services);

        return mapped;
    }

    async findByEmail(email: string): Promise<Client | null> {
        const row = this.query('SELECT * FROM clients WHERE email = ?')
            .as(ClientRow)
            .get(email) as ClientRow | null;
        
        return row ? this.mapToEntity(row) : null;
    }

    async deleteWithRelated(id: number): Promise<boolean> {
        try {
            await this.db.run('BEGIN TRANSACTION');
            
            // Delete related records in correct order
            await this.db.run('DELETE FROM task_dependencies WHERE dependent_task_id IN (SELECT id FROM tasks WHERE client_id = ?) OR required_task_id IN (SELECT id FROM tasks WHERE client_id = ?)', [id, id]);
            await this.db.run('DELETE FROM messages WHERE client_id = ?', [id]);
            await this.db.run('DELETE FROM events WHERE client_id = ?', [id]);
            await this.db.run('DELETE FROM tasks WHERE client_id = ?', [id]);
            await this.db.run('UPDATE documents SET client_id = NULL WHERE client_id = ?', [id]);
            
            // Finally delete the client
            const deleted = await this.delete(id);
            
            await this.db.run('COMMIT');
            return deleted;
        } catch (error) {
            await this.db.run('ROLLBACK');
            throw error;
        }
    }
}
