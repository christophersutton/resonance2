import { Database, Statement } from "bun:sqlite";

export class BaseRepository {
    protected db: Database;
    private statements: Map<string, Statement> = new Map();

    constructor(db: Database) {
        this.db = db;
    }

    protected query<T extends object>(sql: string): Statement<any, T> {
        let stmt = this.statements.get(sql);
        if (!stmt) {
            stmt = this.db.query(sql);
            this.statements.set(sql, stmt);
        }
        return stmt;
    }

    protected findOne<T extends object>(sql: string, params?: Record<string, any>): T | undefined {
        return this.query<T>(sql).get(params);
    }

    protected findMany<T extends object>(sql: string, params?: Record<string, any>): T[] {
        return this.query<T>(sql).all(params);
    }

    protected create<T extends object>(
        table: string, 
        data: Record<string, any>
    ): { lastInsertRowid: number; changes: number } {
        const keys = Object.keys(data);
        const placeholders = keys.map(key => `$${key}`).join(',');
        
        const sql = `
            INSERT INTO ${table} (${keys.join(',')})
            VALUES (${placeholders})
        `;
        
        return this.query(sql).run(data);
    }

    protected update(
        table: string,
        id: number,
        data: Record<string, any>
    ): { lastInsertRowid: number; changes: number } {
        const setClause = Object.keys(data)
            .map(key => `${key} = $${key}`)
            .join(',');
        
        const sql = `
            UPDATE ${table}
            SET ${setClause}
            WHERE id = $id
        `;
        
        return this.query(sql).run({ ...data, id });
    }

    protected delete(
        table: string, 
        id: number
    ): { lastInsertRowid: number; changes: number } {
        const sql = `DELETE FROM ${table} WHERE id = $id`;
        return this.query(sql).run({ id });
    }

    protected transaction<T>(callback: () => T): T {
        return this.db.transaction(callback)();
    }

    /**
     * Clean up any prepared statements
     */
    public dispose(): void {
        for (const stmt of this.statements.values()) {
            stmt.finalize();
        }
        this.statements.clear();
    }
}
