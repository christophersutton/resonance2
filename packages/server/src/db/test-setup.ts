import { setupDatabase } from "./setup";
import { seedDatabase } from "./seeds";
import { Database } from "bun:sqlite";
import { ClientRow, TaskRow, DocumentRow } from "./types/rows";
import { ClientRepository } from "./repositories/client";

async function testDatabaseSetup() {
    let db: Database;
    try {
        // Initialize and seed the database
        db = await setupDatabase({
            create: true,
            dbPath: ':memory:',
            quiet: true
        });
        await seedDatabase(db);

        // Test basic queries using indexes
        const clientRepo = new ClientRepository(db);
        const client = await clientRepo.findByEmail('john.doe@acme.com');
        if (!client) throw new Error("Client query failed");

        const taskQuery = db.query(`
            SELECT t.*, c.organization_name as client_organization_name
            FROM tasks t
            JOIN clients c ON t.client_id = c.id
            WHERE t.type = 'FEATURE_REQUEST' AND t.status = 'open'
        `).as(TaskRow).all();
        if (taskQuery.length === 0) throw new Error("Task join query failed");

        const documentQuery = db.query(`
            SELECT d.*, dv.version_number 
            FROM documents d
            LEFT JOIN document_versions dv ON d.id = dv.document_id
            LIMIT 1
        `).as(DocumentRow).all();
        if (documentQuery.length === 0) throw new Error("Document version query failed");

        // Test foreign key constraints
        try {
            db.run(`
                INSERT INTO tasks (
                    client_id, type, service_category, urgency,
                    status, title, description
                ) VALUES (
                    999999, 'FEATURE_REQUEST', 'DEV', 'medium',
                    'open', 'Test Task', 'Test Description'
                )
            `);
            console.error("✗ Foreign key constraint test failed - should not allow invalid client_id");
            process.exit(1);
        } catch (err) {
            console.log("✓ Foreign key constraints working properly");
        }

        console.log("\nAll database setup tests completed successfully! 🎉");
        
    } catch (err) {
        console.error("✗ Test failed:", err);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.main) {
    testDatabaseSetup()
        .then(() => console.log("Tests completed"))
        .catch(console.error);
}
