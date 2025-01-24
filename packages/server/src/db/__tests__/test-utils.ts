import { Database } from "bun:sqlite";
import { setupDatabase } from "../setup";
import { seedDatabase } from "../seeds";
import type { Client, Task } from "../../../../shared/src/types/entities";
import { ClientRow, TaskRow } from "../types/rows";
export interface TestContext {
    db: Database;
}

export async function createTestContext(): Promise<TestContext> {
    const options = { 
        create: true,
        dbPath: ':memory:',
        quiet: true
    };
    const db = await setupDatabase(options);
    await seedDatabase(db, options);
    return { db };
}

export async function cleanupTestContext(context: TestContext | undefined) {
    if (context?.db) {
        context.db.close();
    }
}

// Test data helpers
export const testClientData: Omit<Client, 'id' | 'createdAt'> = {
    organizationName: "Test Org",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    phone: "123-456-7890",
    services: ["DEV", "DESIGN"]
};

export const testClientRow: Omit<ClientRow, 'id' | 'created_at'> = {
    organization_name: "Test Org",
    first_name: "Test",
    last_name: "User",
    email: "test@example.com",
    phone: "123-456-7890",
    services: JSON.stringify(["DEV", "DESIGN"])
};

// Add these new exports at the bottom
export const testTaskData: Omit<Task, 'id' | 'clientId' | 'createdAt'> = {
    type: "FEATURE_REQUEST",
    serviceCategory: "DEV",
    urgency: "medium",
    status: "open",
    title: "Test Task",
    description: "This is a test task"
};

export const testTaskRow: Omit<TaskRow, 'id' | 'client_id' | 'created_at'> = {
    type: "FEATURE_REQUEST",
    service_category: "DEV",
    urgency: "medium",
    status: "open",
    title: "Test Task",
    description: "This is a test task"
};