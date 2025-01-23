import { Database } from "bun:sqlite";
import path from "path";
import { readFileSync } from "fs";

export interface DatabaseOptions {
    readonly?: boolean;
    create?: boolean;
    strict?: boolean;
    safeIntegers?: boolean;
}

export async function setupDatabase(options: DatabaseOptions = {}): Promise<Database> {
    const dbPath = path.join(import.meta.dir, "../../../db.sqlite");
    
    // Open the database with strict mode and safe integers
    const db = new Database(dbPath, {
        create: true,
        ...options,
        strict: true, // Always use strict mode for better type safety
        safeIntegers: true, // Handle large integers safely
    });

    // Enable WAL mode for better concurrent performance
    db.run("PRAGMA journal_mode = WAL;");
    
    // Ensure WAL mode is NOT persistent to prevent lingering files
    db.fileControl(1034 /* SQLITE_FCNTL_PERSIST_WAL */, 0);

    // Create schema
    db.transaction(() => {
        // Drop existing tables first
        const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").values();
        for (const [tableName] of tables) {
            db.run(`DROP TABLE IF EXISTS ${tableName}`);
        }

        // Read and execute schema SQL
        const schemaPath = path.join(import.meta.dir, "schema.sql");
        const schemaSql = readFileSync(schemaPath, "utf-8");
        db.run(schemaSql);
    })();

    return db;
}

// Allow running directly
if (import.meta.main) {
    setupDatabase()
        .then(() => console.log('Database setup complete'))
        .catch((err) => {
            console.error('Error setting up database:', err);
            process.exit(1);
        });
}
