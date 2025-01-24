// @ts-nocheck
import { Database } from "bun:sqlite";
import path from "path";
import { readFileSync } from "fs";
import { config } from "../config";

export interface DatabaseOptions {
    readonly?: boolean;
    create?: boolean;
    strict?: boolean;
    safeIntegers?: boolean;
    dbPath?: string;
    quiet?: boolean;
    clean?: boolean;  // If true, drops and recreates all tables
    seed?: boolean;   // If true, seeds the database with test data
}

// Tables in order of dependencies (dependent tables first)
const DROP_TABLE_ORDER = [
    'document_versions',
    'messages',
    'documents',
    'task_dependencies',
    'events',
    'tasks',
    'clients',
    'users'
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
function setForeignKeyConstraints(db: Database, enabled: boolean, quiet?: boolean) {
    try {
        db.run(`PRAGMA foreign_keys = ${enabled ? 'ON' : 'OFF'}`);
        if (!quiet) {
            const status = db.query("PRAGMA foreign_keys").get() as any[];
            console.log("Foreign key status:", status);
        }
    } catch (error) {
        console.error("Error setting foreign keys:", error);
        throw error;
    }
}

/**
 * Verify that the database has all required tables
 */
async function verifySchema(db: Database, quiet?: boolean): Promise<void> {
    const tables = db.query(`
        SELECT name 
        FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `).values();
    
    const tableNames = new Set(tables.map(([name]) => name));
    if (!quiet) {
        console.log("Created tables:", Array.from(tableNames).join(", "));
    }
}

/**
 * Set up a new SQLite database with the required schema
 */
export async function setupDatabase(options: DatabaseOptions = {}): Promise<Database> {
    const {
        readonly = false,
        create = true,
        strict = true,
        safeIntegers = true,
        dbPath = config.dbPath,
        quiet = false,
        clean = false,
        seed = false
    } = options;

    if (!quiet) console.log("Setting up database...");

    try {
        // Open database connection with proper initialization
        const db = new Database(dbPath, { create: true });
        
        if (strict) db.run("PRAGMA strict = ON");
        if (safeIntegers) db.run("PRAGMA trusted_schema = 0");
        
        configureDatabaseSettings(db);

        // Always check if tables exist, create if they don't
        const tablesExist = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='clients'").get();
        
        if (!tablesExist || clean) {
            if (!quiet) console.log(clean ? "Cleaning database..." : "Initializing database schema...");
            // Disable foreign keys while dropping/creating tables
            setForeignKeyConstraints(db, false, quiet);
            
            if (clean) {
                // Drop existing tables in correct order
                for (const table of DROP_TABLE_ORDER) {
                    db.run(`DROP TABLE IF EXISTS ${table}`);
                }
            }
            
            // Re-enable foreign keys for table creation
            setForeignKeyConstraints(db, true, quiet);
            
            // Create tables
            const schema = readFileSync(path.join(__dirname, "schema.sql"), "utf8");
            db.run(schema);
            
            if (!quiet) console.log("Database schema created");
        }

        // Verify schema is correct
        await verifySchema(db, quiet);
        
        return db;
    } catch (error) {
        console.error("Failed to setup database:", error);
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
