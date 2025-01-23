import { Database } from "bun:sqlite";
import path from "path";
import { readFileSync } from "fs";

export interface DatabaseOptions {
    readonly?: boolean;
    create?: boolean;
    strict?: boolean;
    safeIntegers?: boolean;
}

// Tables in order of dependencies (dependent tables first)
const DROP_TABLE_ORDER = [
    'document_versions',
    'messages',
    'documents',
    'task_dependencies',
    'events',
    'tasks',
    'clients'
];

/**
 * Configure SQLite performance settings
 */
function configureDatabaseSettings(db: Database) {
    // Enable WAL mode for better concurrent performance
    db.run("PRAGMA journal_mode = WAL");
    
    // Other performance optimizations
    db.run("PRAGMA synchronous = NORMAL");
    db.run("PRAGMA temp_store = MEMORY");
    db.run("PRAGMA mmap_size = 30000000000");
    db.run("PRAGMA page_size = 4096");
    db.run("PRAGMA cache_size = -2000");
}

/**
 * Enable or disable foreign key constraints
 */
function setForeignKeyConstraints(db: Database, enabled: boolean) {
    try {
        db.run(`PRAGMA foreign_keys = ${enabled ? 'ON' : 'OFF'}`);
        const status = db.query("PRAGMA foreign_keys").get() as any[];
        console.log("Foreign key status:", status);
    } catch (error) {
        console.error("Error setting foreign keys:", error);
        throw error;
    }
}

/**
 * Verify that the database has all required tables
 */
async function verifySchema(db: Database): Promise<void> {
    const tables = db.query(`
        SELECT name 
        FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `).values();
    
    const tableNames = new Set(tables.map(([name]) => name));
    console.log("Created tables:", Array.from(tableNames).join(", "));
}

/**
 * Set up a new SQLite database with the required schema
 */
export async function setupDatabase(options: DatabaseOptions = {}): Promise<Database> {
    const dbPath = path.join(import.meta.dir, "../../../server/db/db.sqlite");
    console.log("Setting up database at:", dbPath);
    
    try {
        // Open the database with strict mode and safe integers
        const db = new Database(dbPath, {
            create: true,
            ...options,
            strict: true,
            safeIntegers: true,
        });

        // Configure database settings
        console.log("Configuring database settings...");
        configureDatabaseSettings(db);

        // Temporarily disable foreign keys for setup
        console.log("Temporarily disabling foreign keys...");
        setForeignKeyConstraints(db, false);

        // Create schema
        db.transaction(() => {
            try {
                console.log("Dropping existing tables...");
                // Drop existing tables in correct order
                for (const tableName of DROP_TABLE_ORDER) {
                    db.run(`DROP TABLE IF EXISTS ${tableName}`);
                }

                console.log("Reading schema.sql...");
                // Read and execute schema SQL
                const schemaPath = path.join(import.meta.dir, "schema.sql");
                const schemaSql = readFileSync(schemaPath, "utf-8");
                
                console.log("Creating new schema...");
                db.run(schemaSql);
            } catch (error) {
                console.error("Error creating schema:", error);
                throw new Error(`Failed to create schema: ${error}`);
            }
        })();

        // Re-enable foreign keys
        console.log("Re-enabling foreign keys...");
        setForeignKeyConstraints(db, true);

        // Verify the schema was created correctly
        console.log("Verifying schema...");
        await verifySchema(db);

        console.log("Database setup completed successfully");
        return db;
    } catch (error) {
        console.error("Database setup failed:", error);
        throw error;
    }
}

// Allow running directly
if (import.meta.main) {
    setupDatabase()
        .then(() => {
            console.log("Database setup complete");
            process.exit(0);
        })
        .catch((err) => {
            console.error("Error setting up database:", err);
            process.exit(1);
        });
}
