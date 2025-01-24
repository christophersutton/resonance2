import { Database } from "bun:sqlite";
import { type DatabaseOptions } from "./setup";
import type { Client, Task } from "../../../shared/src/types/entities";
import { ClientRepository } from "./repositories/client";
import { TaskRepository } from "./repositories/task";
import { config } from "../config";

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

export async function seedDatabase(db: Database, options?: DatabaseOptions) {
    const log = (message: string) => {
        if (!options?.quiet) {
            console.log(message);
        }
    };

    log("Starting database seeding...");
    
    try {
        const clientRepo = new ClientRepository(db);
        const taskRepo = new TaskRepository(db);

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

        // Add task dependencies
        if (tasks.length >= 2) {
            await db.run(`
                INSERT INTO task_dependencies (
                    dependent_task_id, required_task_id
                ) VALUES (?, ?)
            `, [tasks[1].id, tasks[0].id]);
            log("✓ Created test task dependency");
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
