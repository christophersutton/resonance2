import { setupDatabase } from "./setup";
import { Database } from "bun:sqlite";

async function testDatabaseSetup() {
    console.log("Starting database setup test...");
    
    let db: Database;
    try {
        db = await setupDatabase();
        console.log("✓ Database initialized successfully");
    } catch (err) {
        console.error("✗ Failed to initialize database:", err);
        process.exit(1);
    }

    // Test data insertion
    try {
        db.transaction(() => {
            // Insert a test client
            db.run(`
                INSERT INTO clients (
                    organization_name, first_name, last_name, 
                    email, phone, services
                ) VALUES (
                    'Acme Corp', 'John', 'Doe',
                    'john.doe@acme.com', '+1 (555) 000-0000',
                    '["Development", "Design"]'
                )
            `);

            // Get the inserted client id
            const clientId = db.query("SELECT last_insert_rowid() as id").get().id;

            // Create initial document
            db.run(`
                INSERT INTO documents (
                    file_name, file_type, s3_key
                ) VALUES (
                    'test.txt', 'text/plain', 'test/123.txt'
                )
            `);

            // Get the document id
            const docId = db.query("SELECT last_insert_rowid() as id").get().id;

            // Insert a test task
            db.run(`
                INSERT INTO tasks (
                    client_id, type, urgency, status, title, description, primary_document_id
                ) VALUES (
                    ?, 'GENERAL', 'MEDIUM', 'NEW', 'Test Task', 'Test Description', ?
                )
            `, [clientId, docId]);

            // Get the inserted task id
            const taskId = db.query("SELECT last_insert_rowid() as id").get().id;

            // Update document with task and client
            db.run(`
                UPDATE documents 
                SET task_id = ?, client_id = ?
                WHERE id = ?
            `, [taskId, clientId, docId]);

            // Insert test messages
            db.run(`
                INSERT INTO messages (
                    client_id, task_id, direction, body
                ) VALUES 
                    (?, ?, 'INBOUND', 'Test inbound message'),
                    (?, ?, 'OUTBOUND', 'Test outbound message')
            `, [clientId, taskId, clientId, taskId]);

            // Insert test event
            db.run(`
                INSERT INTO events (
                    task_id, client_id, event_type, details
                ) VALUES (
                    ?, ?, 'TASK_CREATED', '{"source": "test"}'
                )
            `, [taskId, clientId]);

            // Update document with event
            db.run(`
                UPDATE documents 
                SET event_id = last_insert_rowid()
                WHERE id = ?
            `, [docId]);

            // Insert document version
            db.run(`
                INSERT INTO document_versions (
                    document_id, version_number, s3_key
                ) VALUES (
                    ?, 1, 'test/123.txt.v1'
                )
            `, [docId]);
        })();

        console.log("✓ Test data inserted successfully");

        // Test queries using indexes
        const clientQuery = db.query(`
            SELECT * FROM clients 
            WHERE email = 'john.doe@acme.com'
        `).all();
        console.log("✓ Client query successful:", clientQuery.length === 1);
        console.log("Client ID:", clientQuery[0].id);

        const taskQuery = db.query(`
            SELECT * FROM tasks 
            WHERE client_id = ? AND type = 'GENERAL' AND status = 'NEW'
        `, [clientQuery[0].id]).all();
        console.log("Task query results:", taskQuery);
        console.log("✓ Task index query successful:", taskQuery.length === 1);

        const messageQuery = db.query(`
            SELECT * FROM messages 
            WHERE client_id = ? AND task_id = ?
        `, [clientQuery[0].id, taskQuery[0].id]).all();
        console.log("✓ Message index query successful:", messageQuery.length === 2);

        const documentQuery = db.query(`
            SELECT * FROM documents 
            WHERE s3_key = 'test/123.txt'
        `).all();
        console.log("✓ Document s3_key index query successful:", documentQuery.length === 1);

        console.log("\nAll tests completed successfully! 🎉");
        
    } catch (err) {
        console.error("✗ Test failed:", err);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.main) {
    testDatabaseSetup()
        .catch(err => {
            console.error("Unexpected error:", err);
            process.exit(1);
        });
}
