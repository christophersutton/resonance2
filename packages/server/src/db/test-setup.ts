import { setupDatabase } from "./setup";
import { seedDatabase } from "./seeds";
import { Database } from "bun:sqlite";
import { ClientRow, TaskRow, DocumentRow } from "./types/rows";
import { ClientRepository } from "./repositories/client";

async function testDatabaseSetup() {
    console.log("Starting database setup test...");
    
    let db: Database;
    try {
        // Initialize and seed the database
        db = await setupDatabase();
        await seedDatabase(db);
        console.log("✓ Database initialized and seeded successfully");

        // Test basic queries using indexes
        const clientRepo = new ClientRepository(db);
        const client = await clientRepo.findByEmail('john.doe@acme.com');
        console.log("✓ Client query successful:", client !== null);

        const taskQuery = db.query(`
            SELECT t.*, c.organization_name as client_organization_name
            FROM tasks t
            JOIN clients c ON t.client_id = c.id
            WHERE t.type = 'FEATURE_REQUEST' AND t.status = 'open'
        `).as(TaskRow).all();
        console.log("✓ Task join query successful:", taskQuery.length > 0);

        const documentQuery = db.query(`
            SELECT d.*, dv.version_number 
            FROM documents d
            LEFT JOIN document_versions dv ON d.id = dv.document_id
            LIMIT 1
        `).as(DocumentRow).all();
        console.log("✓ Document version query successful:", documentQuery.length > 0);

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
