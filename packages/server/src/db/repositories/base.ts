import { Database, Statement } from "bun:sqlite";
import type { SQLQueryBindings } from "bun:sqlite";

// Base type for all database rows
export interface BaseRow {
    id: bigint;
    created_at: string;
}

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
        const data = this.mapFromEntity(entity);
        const keys = Object.keys(data);
        const placeholders = keys.map(() => '?').join(', ');
        const values = Object.values(data) as SQLQueryBindings[];

        const row = await this.db.query(
            `INSERT INTO ${this.tableName} (${keys.join(', ')}) 
             VALUES (${placeholders}) 
             RETURNING *`
        ).as(this.rowType).get(...values) as TRow;

        return this.mapToEntity(row);
    }

    async update(id: number, entity: Partial<Omit<TEntity, 'id' | 'createdAt'>>): Promise<TEntity | null> {
        const data = this.mapFromEntity(entity as Omit<TEntity, 'id' | 'createdAt'>);
        const setClause = Object.keys(data)
            .map(key => `${key} = ?`)
            .join(', ');
        const values = [...Object.values(data), id] as SQLQueryBindings[];

        const result = await this.db.query(
            `UPDATE ${this.tableName} SET ${setClause} WHERE id = ? RETURNING *`
        ).as(this.rowType).get(...values) as TRow | null;

        return result ? this.mapToEntity(result) : null;
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
