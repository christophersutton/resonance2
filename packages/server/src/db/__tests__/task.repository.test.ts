import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { TaskRepository } from "../repositories/task";
import { ClientRepository } from "../repositories/client";
import { createTestContext, cleanupTestContext, testTaskData, testClientData } from "./test-utils";
import type { TestContext } from "./test-utils";

describe("TaskRepository", () => {
    let context: TestContext;
    let repository: TaskRepository;
    let clientId: number;

    beforeEach(async () => {
        context = await createTestContext();
        repository = new TaskRepository(context.db);
        // Create a test client to use for task tests
        const clientRepo = new ClientRepository(context.db);
        const client = await clientRepo.create(testClientData);
        clientId = client.id;
    });

    afterEach(async () => {
        await cleanupTestContext(context);
    });

    describe("findAll", () => {
        test("returns all tasks", async () => {
            const tasks = await repository.findAll();
            expect(Array.isArray(tasks)).toBe(true);
            expect(tasks.length).toBeGreaterThan(0);
            expect(tasks[0]).toHaveProperty("id");
            expect(tasks[0]).toHaveProperty("title");
        });
    });

    describe("findById", () => {
        test("returns task when found", async () => {
            const created = await repository.create({ ...testTaskData, clientId });
            const task = await repository.findById(created.id);
            expect(task).not.toBeNull();
            expect(task?.id).toBe(created.id);
        });

        test("returns null when not found", async () => {
            const task = await repository.findById(99999);
            expect(task).toBeNull();
        });
    });

    describe("findByClientId", () => {
        test("returns tasks for client", async () => {
            // Create a test task
            await repository.create({ ...testTaskData, clientId });
            
            const tasks = await repository.findByClientId(clientId);
            expect(tasks.length).toBeGreaterThan(0);
            expect(tasks[0].clientId).toBe(clientId);
        });

        test("returns empty array when client has no tasks", async () => {
            const tasks = await repository.findByClientId(99999);
            expect(tasks).toEqual([]);
        });
    });

    describe("findByStatus", () => {
        test("returns tasks with matching status", async () => {
            // Create a test task
            await repository.create({ ...testTaskData, clientId });
            
            const tasks = await repository.findByStatus("open");
            expect(tasks.length).toBeGreaterThan(0);
            expect(tasks[0].status).toBe("open");
        });

        test("returns empty array when no tasks match status", async () => {
            const tasks = await repository.findByStatus("closed");
            expect(tasks).toEqual([]);
        });
    });

    describe("create", () => {
        test("creates new task successfully", async () => {
            const created = await repository.create({ ...testTaskData, clientId });
            expect(created).toHaveProperty("id");
            expect(created.title).toBe(testTaskData.title);
            expect(created.type).toBe(testTaskData.type);
            expect(created.clientId).toBe(clientId);
        });
    });

    describe("update", () => {
        test("updates existing task", async () => {
            // First create a task
            const created = await repository.create({ ...testTaskData, clientId });
            
            // Update the task
            const updateData = {
                title: "Updated Task",
                status: "in_progress" as const
            };
            
            const updated = await repository.update(created.id, updateData);
            expect(updated).not.toBeNull();
            expect(updated?.title).toBe(updateData.title);
            expect(updated?.status).toBe(updateData.status);
            // Other fields should remain unchanged
            expect(updated?.type).toBe(created.type);
        });

        test("returns null when updating non-existent task", async () => {
            const updated = await repository.update(99999, { title: "Test" });
            expect(updated).toBeNull();
        });
    });

    describe("delete", () => {
        test("deletes existing task", async () => {
            // First create a task
            const created = await repository.create({ ...testTaskData, clientId });
            
            // Delete the task
            const result = await repository.delete(created.id);
            expect(result).toBe(true);
            
            // Verify task is deleted
            const deleted = await repository.findById(created.id);
            expect(deleted).toBeNull();
        });

        test("returns false when deleting non-existent task", async () => {
            const result = await repository.delete(99999);
            expect(result).toBe(false);
        });
    });

    describe("entity mapping", () => {
        test("correctly maps database row to entity", async () => {
            const created = await repository.create({ ...testTaskData, clientId });
            expect(created.type).toBe(testTaskData.type);
            expect(created.serviceCategory).toBe(testTaskData.serviceCategory);
            expect(created.urgency).toBe(testTaskData.urgency);
            expect(created.status).toBe(testTaskData.status);
            expect(created.title).toBe(testTaskData.title);
            if (testTaskData.description) {
                expect(created.description).toBeDefined();
                expect(created.description).toBe(testTaskData.description);
            }
            expect(created).toHaveProperty("createdAt");
            expect(created.clientId).toBe(clientId);
        });
    });
});