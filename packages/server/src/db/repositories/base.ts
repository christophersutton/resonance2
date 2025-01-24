import { Database, Statement } from "bun:sqlite";
import type { SQLQueryBindings } from "bun:sqlite";
import type { BaseRow } from "../types/rows";

// Base type for all entities
export interface BaseEntity {
    id: number;
    createdAt: string;
}

export abstract class BaseRepository<TRow extends BaseRow, TEntity extends BaseEntity> {
    constructor(
        protected readonly db: Database,
        protected readonly tableName: string
    ) {}

    protected abstract mapFromEntity(entity: Omit<TEntity, 'id' | 'createdAt'>): Partial<TRow>;
    protected abstract get rowType(): new () => TRow;

    protected query<T>(sql: string): Statement<T> {
        return this.db.query(sql);
    }

    async findById(id: number): Promise<TEntity | null> {
        const row = await this.db.query(`SELECT * FROM ${this.tableName} WHERE id = ?`)
            .as(this.rowType)
            .get(id) as TRow | null;
        
        return row ? this.mapToEntity(row) : null;
    }

    async findAll(): Promise<TEntity[]> {
        const rows = await this.db.query(`SELECT * FROM ${this.tableName}`)
            .as(this.rowType)
            .all() as TRow[];

        return rows.map(row => this.mapToEntity(row));
    }

    async create(entity: Omit<TEntity, 'id' | 'createdAt'>): Promise<TEntity> {
        const data = {
            ...this.mapFromEntity(entity),
            created_at: new Date().toISOString()
        };
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data) as SQLQueryBindings[];

        // Insert and get the created row in one step
        const row = await this.db.query(
            `INSERT INTO ${this.tableName} (${columns}) 
             VALUES (${placeholders}) 
             RETURNING *`
        ).get(...values) as TRow;

        if (!row) {
            throw new Error('Failed to create entity');
        }

        return this.mapToEntity(row);
    }

    async update(id: number, entity: Partial<Omit<TEntity, 'id' | 'createdAt'>>): Promise<TEntity | null> {
        // For partial updates, we need to be careful about mapping fields
        // We'll create a minimal entity with just the fields being updated
        const partialEntity = Object.entries(entity).reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {} as Record<string, any>);

        const data = this.mapFromEntity(partialEntity as any);
        
        if (Object.keys(data).length === 0) {
            return this.findById(id);
        }

        const setClause = Object.keys(data)
            .map(key => `${key} = ?`)
            .join(', ');
        const values = [...Object.values(data), id] as SQLQueryBindings[];

        // First perform the update
        const result = await this.db.query(
            `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`
        ).run(...values);

        // If no rows were modified, return null
        if (result.changes === 0) {
            return null;
        }

        // Return the updated entity
        return this.findById(id);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.db.query(
            `DELETE FROM ${this.tableName} WHERE id = ? RETURNING id`
        ).get(id);
        
        return !!result;
    }

    protected mapToEntity(row: TRow): TEntity {
        const { id, created_at, ...rest } = row;
        return {
            id: Number(id),
            createdAt: created_at,
            ...rest
        } as unknown as TEntity;
    }
}
