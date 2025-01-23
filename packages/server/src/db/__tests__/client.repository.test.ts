import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { ClientRepository } from "../repositories/client";
import { createTestContext, cleanupTestContext, testClientData } from "./test-utils";
import type { Client } from "../../../../shared/src/types/entities";
import type { TestContext } from "./test-utils";

describe("ClientRepository", () => {
    let context: TestContext;
    let repository: ClientRepository;

    beforeEach(async () => {
        context = await createTestContext();
        repository = new ClientRepository(context.db);
    });

    afterEach(async () => {
        await cleanupTestContext(context);
    });

    describe("findAll", () => {
        test("returns all clients", async () => {
            const clients = await repository.findAll();
            expect(Array.isArray(clients)).toBe(true);
            expect(clients.length).toBeGreaterThan(0);
            expect(clients[0]).toHaveProperty("id");
            expect(clients[0]).toHaveProperty("organizationName");
        });
    });

    describe("findById", () => {
        test("returns client when found", async () => {
            const clients = await repository.findAll();
            const testId = clients[0].id;
            
            const client = await repository.findById(testId);
            expect(client).not.toBeNull();
            expect(client?.id).toBe(testId);
        });

        test("returns null when not found", async () => {
            const client = await repository.findById(99999);
            expect(client).toBeNull();
        });
    });

    describe("findByEmail", () => {
        test("returns client when email exists", async () => {
            const client = await repository.findByEmail("john.doe@acme.com");
            expect(client).not.toBeNull();
            expect(client?.email).toBe("john.doe@acme.com");
        });

        test("returns null when email doesn't exist", async () => {
            const client = await repository.findByEmail("nonexistent@example.com");
            expect(client).toBeNull();
        });
    });

    describe("create", () => {
        test("creates new client successfully", async () => {
            const created = await repository.create(testClientData);
            expect(created).toHaveProperty("id");
            expect(created.email).toBe(testClientData.email);
            expect(created.organizationName).toBe(testClientData.organizationName);
            expect(created.services).toEqual(testClientData.services);
        });
    });

    describe("update", () => {
        test("updates existing client", async () => {
            // First create a client
            const created = await repository.create(testClientData);
            
            // Update the client
            const updateData = {
                organizationName: "Updated Org",
                firstName: "Updated",
                lastName: testClientData.lastName,
                email: testClientData.email,
                services: testClientData.services
            };
            
            const updated = await repository.update(created.id, updateData);
            expect(updated).not.toBeNull();
            expect(updated?.organizationName).toBe(updateData.organizationName);
            expect(updated?.firstName).toBe(updateData.firstName);
            // Other fields should remain unchanged
            expect(updated?.email).toBe(created.email);
        });

        test("returns null when updating non-existent client", async () => {
            const updated = await repository.update(99999, { organizationName: "Test" });
            expect(updated).toBeNull();
        });
    });

    describe("delete", () => {
        test("deletes existing client", async () => {
            // First create a client
            const created = await repository.create(testClientData);
            
            // Delete the client
            const result = await repository.delete(created.id);
            expect(result).toBe(true);
            
            // Verify client is deleted
            const deleted = await repository.findById(created.id);
            expect(deleted).toBeNull();
        });

        test("returns false when deleting non-existent client", async () => {
            const result = await repository.delete(99999);
            expect(result).toBe(false);
        });
    });

    describe("entity mapping", () => {
        test("correctly maps database row to entity", async () => {
            const created = await repository.create(testClientData);
            expect(created.organizationName).toBe(testClientData.organizationName);
            expect(created.firstName).toBe(testClientData.firstName);
            expect(created.lastName).toBe(testClientData.lastName);
            expect(created.email).toBe(testClientData.email);
            if (testClientData.phone) {
                expect(created.phone).toBe(testClientData.phone);
            } else {
                expect(created.phone).toBeUndefined();
            }
            expect(created.services).toEqual(testClientData.services);
            expect(created).toHaveProperty("createdAt");
        });
    });
});
