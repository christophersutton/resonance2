import { Database, Statement } from "bun:sqlite";
import type { SQLQueryBindings } from "bun:sqlite";

export abstract class BaseRepository<TRow, TEntity> {
    constructor(
        protected readonly db: Database,
        protected readonly tableName: string
    ) {}

    protected abstract mapToEntity(row: TRow): TEntity;
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
        const columns = Object.keys(data);
        const values = Object.values(data) as SQLQueryBindings[];
        const placeholders = new Array(values.length).fill('?').join(', ');

        const result = await this.db.query(
            `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`
        ).as(this.rowType).get(...values) as TRow;

        return this.mapToEntity(result);
    }

    async update(id: number, entity: Partial<Omit<TEntity, 'id' | 'createdAt'>>): Promise<TEntity | null> {
        const data = this.mapFromEntity(entity as any);
        const setClause = Object.entries(data)
            .map(([key]) => `${key} = ?`)
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
}
