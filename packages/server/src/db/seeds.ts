import { Database } from "bun:sqlite";
import { type DatabaseOptions } from "./setup";
import type { Client, Task, Message } from "../../../shared/src/types/entities";
import { ClientRepository } from "./repositories/client";
import { TaskRepository } from "./repositories/task";
import { MessageRepository } from "./repositories/message";
import { config } from "../config";
import type { TaskStatus } from "../../../shared/src/types/enums";

const TEST_CLIENTS: Omit<Client, 'id' | 'createdAt'>[] = [
    {
        organizationName: "Acme Corp",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@acme.com",
        phone: "+1 (555) 000-0000",
        services: ["STRATEGY", "DESIGN", "DEV"]
    },
    {
        organizationName: "TechStart Inc",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@techstart.com",
        phone: "+1 (555) 111-1111",
        services: ["DEV", "CONSULT"]
    }
];

const TEST_TASKS: Omit<Task, 'id' | 'clientId' | 'createdAt'>[] = [
    {
        type: "FEATURE_REQUEST",
        serviceCategory: "DEV",
        urgency: "medium",
        status: "open",
        title: "Implement User Authentication",
        description: "Add OAuth2 authentication flow for users"
    },
    {
        type: "RESEARCH",
        serviceCategory: "STRATEGY",
        urgency: "low",
        status: "in_progress",
        title: "Market Analysis",
        description: "Research competitor pricing models"
    },
    {
        type: "BUG",
        serviceCategory: "DEV",
        urgency: "urgent",
        status: "needs_review",
        title: "Fix Payment Processing",
        description: "Users receiving duplicate charges"
    }
];

const TEST_MESSAGES: Omit<Message, 'id' | 'clientId' | 'taskId' | 'createdAt'>[] = [
    {
        direction: "inbound",
        body: "Hi, we need help with implementing OAuth2 for our users.",
        sentAt: new Date().toISOString()
    },
    {
        direction: "outbound",
        body: "I'll help you with that. Let me create a task to track this.",
        sentAt: new Date().toISOString()
    },
    {
        direction: "inbound",
        body: "We're also seeing some issues with duplicate charges in our payment system.",
        sentAt: new Date().toISOString()
    },
    {
        direction: "outbound",
        body: "I understand. I've created a high-priority task to investigate the payment issues.",
        sentAt: new Date().toISOString()
    }
];

// Helper function to create a status change event
function createStatusChangeEvent(db: Database, taskId: number, from: TaskStatus, to: TaskStatus) {
    return db.query(`
        INSERT INTO events (task_id, event_type, details)
        VALUES (?, 'STATUS_CHANGE', ?)
    `).run(taskId, JSON.stringify({ from, to }));
}

// Helper function to create a comment event
function createCommentEvent(db: Database, taskId: number, comment: string) {
    return db.query(`
        INSERT INTO events (task_id, event_type, details)
        VALUES (?, 'COMMENT', ?)
    `).run(taskId, JSON.stringify({ comment }));
}

// Helper function to create a message event
function createMessageEvent(db: Database, taskId: number, messageId: number) {
    return db.query(`
        INSERT INTO events (task_id, event_type, details)
        VALUES (?, 'MESSAGE', ?)
    `).run(taskId, JSON.stringify({ messageId }));
}

async function cleanupDatabase(db: Database) {
    // Delete in reverse order of dependencies
    await db.run('DELETE FROM events');
    await db.run('DELETE FROM messages');
    await db.run('DELETE FROM task_dependencies');
    await db.run('DELETE FROM tasks');
    await db.run('DELETE FROM clients');
}

export async function seedDatabase(db: Database, options?: DatabaseOptions) {
    const log = (message: string) => {
        if (!options?.quiet) {
            console.log(message);
        }
    };

    log("Starting database seeding...");
    
    try {
        // Clear existing data
        await cleanupDatabase(db);
        log("✓ Cleaned up existing data");

        const clientRepo = new ClientRepository(db);
        const taskRepo = new TaskRepository(db);
        const messageRepo = new MessageRepository(db);

        // Insert test clients
        const clients = await Promise.all(
            TEST_CLIENTS.map(client => clientRepo.create(client))
        );
        log(`✓ Created ${clients.length} test clients`);

        const firstClient = clients[0];
        if (!firstClient) throw new Error("Failed to create test client");

        // Insert tasks for the first client
        const tasks = await Promise.all(
            TEST_TASKS.map(task => taskRepo.create({
                ...task,
                clientId: firstClient.id
            }))
        );
        log(`✓ Created ${tasks.length} test tasks`);

        // Insert messages for the first client
        const messages = await Promise.all(
            TEST_MESSAGES.map((msg, i) => messageRepo.create({
                ...msg,
                clientId: firstClient.id,
                // Attach first two messages to first task, last two to third task
                taskId: i < 2 ? tasks[0].id : tasks[2].id
            }))
        );
        log(`✓ Created ${messages.length} test messages`);

        // Add task dependencies
        if (tasks.length >= 2) {
            await db.run(`
                INSERT INTO task_dependencies (
                    dependent_task_id, required_task_id
                ) VALUES (?, ?)
            `, [tasks[1].id, tasks[0].id]);
            log("✓ Created test task dependency");
        }

        // Add events for tasks
        if (tasks.length > 0) {
            // Events for the first task (Auth Implementation)
            await createStatusChangeEvent(db, tasks[0].id, "open", "in_progress");
            await createCommentEvent(db, tasks[0].id, "Starting work on OAuth2 implementation");
            await createMessageEvent(db, tasks[0].id, messages[0].id);
            await createMessageEvent(db, tasks[0].id, messages[1].id);

            // Events for the second task (Market Analysis)
            await createStatusChangeEvent(db, tasks[1].id, "open", "in_progress");
            await createCommentEvent(db, tasks[1].id, "Researching top 5 competitors");

            // Events for the third task (Payment Bug)
            await createStatusChangeEvent(db, tasks[2].id, "open", "in_progress");
            await createStatusChangeEvent(db, tasks[2].id, "in_progress", "needs_review");
            await createCommentEvent(db, tasks[2].id, "Found the source of duplicate charges");
            await createMessageEvent(db, tasks[2].id, messages[2].id);
            await createMessageEvent(db, tasks[2].id, messages[3].id);

            log("✓ Created test events for tasks");
        }

        log("✓ Database seeded successfully");
    } catch (err) {
        log(`✗ Failed to seed database: ${err}`);
        throw err;
    }
}

// Allow running directly
if (import.meta.main) {
    const db = new Database(config.dbPath);
    seedDatabase(db)
        .then(() => console.log("Seeding completed"))
        .catch(console.error)
        .finally(() => db.close());
}
