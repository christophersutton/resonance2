import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { MessageRepository } from "../repositories/message";
import { ClientRepository } from "../repositories/client";
import { TaskRepository } from "../repositories/task";
import { createTestContext, cleanupTestContext, testClientData, testTaskData } from "./test-utils";
import type { TestContext } from "./test-utils";
import type { Message } from "../../../../shared/src/types/entities";

describe("MessageRepository", () => {
    let context: TestContext;
    let repository: MessageRepository;
    let clientId: number;
    let taskId: number;

    const testMessageData: Omit<Message, 'id' | 'createdAt'> = {
        clientId: 0, // Will be set in beforeEach
        taskId: undefined,
        direction: 'inbound',
        body: 'Test message content',
        sentAt: new Date().toISOString()
    };

    const testDraftData: Omit<Message, 'id' | 'createdAt'> = {
        clientId: 0, // Will be set in beforeEach
        taskId: undefined,
        direction: 'outbound',
        body: 'Draft message content'
        // No sentAt for drafts
    };

    beforeEach(async () => {
        context = await createTestContext();
        repository = new MessageRepository(context.db);
        
        // Create a test client and task to use for message tests
        const clientRepo = new ClientRepository(context.db);
        const client = await clientRepo.create(testClientData);
        clientId = client.id;
        
        const taskRepo = new TaskRepository(context.db);
        const task = await taskRepo.create({ ...testTaskData, clientId });
        taskId = task.id;

        testMessageData.clientId = clientId;
        testDraftData.clientId = clientId;
    });

    afterEach(async () => {
        await cleanupTestContext(context);
    });

    describe("findAll", () => {
        test("returns all messages", async () => {
            await repository.create(testMessageData);
            const messages = await repository.findAll();
            expect(Array.isArray(messages)).toBe(true);
            expect(messages.length).toBeGreaterThan(0);
            expect(messages[0]).toHaveProperty("id");
            expect(messages[0]).toHaveProperty("body");
        });
    });

    describe("findById", () => {
        test("returns message when found", async () => {
            const created = await repository.create(testMessageData);
            const message = await repository.findById(created.id);
            expect(message).not.toBeNull();
            expect(message?.id).toBe(created.id);
            expect(message?.body).toBe(testMessageData.body);
        });

        test("returns null when not found", async () => {
            const message = await repository.findById(99999);
            expect(message).toBeNull();
        });
    });

    describe("findByClientId", () => {
        test("returns messages for client", async () => {
            await repository.create(testMessageData);
            
            const messages = await repository.findByClientId(clientId);
            expect(messages.length).toBeGreaterThan(0);
            expect(messages[0].clientId).toBe(clientId);
            expect(messages[0].body).toBe(testMessageData.body);
        });

        test("returns empty array when client has no messages", async () => {
            const messages = await repository.findByClientId(99999);
            expect(messages).toEqual([]);
        });
    });

    describe("findByTaskId", () => {
        test("returns messages for task", async () => {
            await repository.create({ ...testMessageData, taskId });
            
            const messages = await repository.findByTaskId(taskId);
            expect(messages.length).toBeGreaterThan(0);
            expect(messages[0].taskId).toBe(taskId);
            expect(messages[0].body).toBe(testMessageData.body);
        });

        test("returns empty array when task has no messages", async () => {
            const messages = await repository.findByTaskId(99999);
            expect(messages).toEqual([]);
        });
    });

    describe("create", () => {
        test("creates new message successfully", async () => {
            const created = await repository.create(testMessageData);
            expect(created).toHaveProperty("id");
            expect(created.body).toBe(testMessageData.body);
            expect(created.direction).toBe(testMessageData.direction);
            expect(created.clientId).toBe(clientId);
        });

        test("creates message with task association", async () => {
            const messageWithTask = { ...testMessageData, taskId };
            const created = await repository.create(messageWithTask);
            expect(created.taskId).toBe(taskId);
        });
    });

    describe("update", () => {
        test("updates existing message", async () => {
            const created = await repository.create(testMessageData);
            
            const updateData = {
                body: "Updated message content",
                direction: "outbound" as const
            };
            
            const updated = await repository.update(created.id, updateData);
            expect(updated).not.toBeNull();
            expect(updated?.body).toBe(updateData.body);
            expect(updated?.direction).toBe(updateData.direction);
        });

        test("returns null when updating non-existent message", async () => {
            const updated = await repository.update(99999, { body: "test" });
            expect(updated).toBeNull();
        });
    });

    describe("delete", () => {
        test("deletes existing message", async () => {
            const created = await repository.create(testMessageData);
            const deleted = await repository.delete(created.id);
            expect(deleted).toBe(true);

            const message = await repository.findById(created.id);
            expect(message).toBeNull();
        });

        test("returns false when deleting non-existent message", async () => {
            const deleted = await repository.delete(99999);
            expect(deleted).toBe(false);
        });
    });

    describe("draft messages", () => {
        test("creates draft message without sentAt", async () => {
            const draft = await repository.create(testDraftData);
            expect(draft.sentAt).toBeNull();
            expect(draft.createdAt).toBeDefined();
            expect(draft.body).toBe(testDraftData.body);
        });

        test("marks draft as sent", async () => {
            const draft = await repository.create(testDraftData);
            const sent = await repository.markAsSent(draft.id);
            expect(sent?.sentAt).toBeDefined();
            expect(sent?.createdAt).toBe(draft.createdAt);
        });

        test("findDrafts returns only unsent messages", async () => {
            await repository.create(testMessageData); // Create sent message
            const draft1 = await repository.create(testDraftData);
            const draft2 = await repository.create({...testDraftData, body: 'Another draft'});
            
            const drafts = await repository.findDrafts();
            expect(drafts.length).toBe(2);
            expect(drafts.every(d => !d.sentAt)).toBe(true);
            expect(drafts.map(d => d.id).sort()).toEqual([draft1.id, draft2.id].sort());
        });

        test("findDraftsByClientId returns client's draft messages", async () => {
            const draft1 = await repository.create(testDraftData);
            await repository.create({...testDraftData, body: 'Another draft'});
            
            // Create draft for different client
            const otherClientRepo = new ClientRepository(context.db);
            const otherClient = await otherClientRepo.create({...testClientData, email: 'other@example.com'});
            await repository.create({...testDraftData, clientId: otherClient.id});
            
            const drafts = await repository.findDraftsByClientId(clientId);
            expect(drafts.length).toBe(2);
            expect(drafts.every(d => d.clientId === clientId)).toBe(true);
            expect(drafts.every(d => !d.sentAt)).toBe(true);
        });
    });

    describe("entity mapping", () => {
        test("correctly maps database row to entity", async () => {
            const created = await repository.create(testMessageData);
            expect(created.direction).toBe(testMessageData.direction);
            expect(created.body).toBe(testMessageData.body);
            expect(created.sentAt).toBe(testMessageData.sentAt);
            expect(created.clientId).toBe(testMessageData.clientId);
        });
    });
});
