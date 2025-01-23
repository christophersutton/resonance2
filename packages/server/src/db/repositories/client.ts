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
            id: row.id,
            organizationName: row.organization_name,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            services: JSON.parse(row.services) as ClientService[],
            createdAt: row.created_at
        };
    }

    protected mapFromEntity(entity: Omit<Client, 'id' | 'createdAt'>): Partial<ClientRow> {
        return {
            organization_name: entity.organizationName,
            first_name: entity.firstName,
            last_name: entity.lastName,
            email: entity.email,
            phone: entity.phone,
            services: JSON.stringify(entity.services)
        };
    }

    async findByEmail(email: string): Promise<Client | null> {
        const row = this.db.query('SELECT * FROM clients WHERE email = ?')
            .as(ClientRow)
            .get(email) as ClientRow | null;
        
        return row ? this.mapToEntity(row) : null;
    }
}
