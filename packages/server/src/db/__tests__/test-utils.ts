import { Database } from "bun:sqlite";
import { setupDatabase } from "../setup";
import { seedDatabase } from "../seeds";
import type { Client } from "../../../../shared/src/types/entities";
import { ClientRow } from "../types/rows";

export interface TestContext {
    db: Database;
}

export async function createTestContext(): Promise<TestContext> {
    const db = await setupDatabase({ create: true });
    await seedDatabase(db);
    return { db };
}

export async function cleanupTestContext(context: TestContext) {
    context.db.close();
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
