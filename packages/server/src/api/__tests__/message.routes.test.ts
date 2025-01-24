import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { MessageRepository } from "../../db/repositories/message";
import { messageRoutes } from "../routes/messages";
import { createTestContext, cleanupTestContext } from "../../db/__tests__/test-utils";
import type { TestContext } from "../../db/__tests__/test-utils";
import type { Message } from "../../../../shared/src/types/entities";

describe("Message Routes", () => {
    let context: TestContext;
    let app: Hono;
    let messageRepo: MessageRepository;

    const testMessageData: Omit<Message, 'id' | 'createdAt' | 'sentAt'> = {
        clientId: 1,
        direction: "outbound",
        body: "Test message content"
    };

    beforeEach(async () => {
        context = await createTestContext();
        messageRepo = new MessageRepository(context.db);
        app = new Hono();
        app.route("/api/messages", messageRoutes(messageRepo));
    });

    afterEach(async () => {
        await cleanupTestContext(context);
    });

    describe("GET /api/messages", () => {
        test("returns all messages", async () => {
            const req = new Request("http://localhost/api/messages");
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(Array.isArray(data)).toBe(true);
        });

        test("returns messages filtered by clientId", async () => {
            const message = await messageRepo.create(testMessageData);
            
            const req = new Request("http://localhost/api/messages?clientId=1");
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].clientId).toBe(1);
        });

        test("returns messages filtered by taskId", async () => {
            const messageWithTask = await messageRepo.create({
                ...testMessageData,
                taskId: 1
            });
            
            const req = new Request("http://localhost/api/messages?taskId=1");
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].taskId).toBe(1);
        });

        test("handles database errors gracefully", async () => {
            const errorApp = new Hono();
            const mockRepo = new MessageRepository(context.db);
            mockRepo.findAll = async () => { throw new Error("Database error"); };
            errorApp.route("/api/messages", messageRoutes(mockRepo));

            const req = new Request("http://localhost/api/messages");
            const res = await errorApp.fetch(req);
            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data.error).toBeDefined();
        });
    });

    describe("GET /api/messages/:id", () => {
        test("returns a single message", async () => {
            const message = await messageRepo.create(testMessageData);
            
            const req = new Request(`http://localhost/api/messages/${message.id}`);
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.id).toBe(message.id);
            expect(data.body).toBe(testMessageData.body);
        });

        test("returns 404 for non-existent message", async () => {
            const req = new Request("http://localhost/api/messages/999999");
            const res = await app.fetch(req);
            expect(res.status).toBe(404);
        });
    });

    describe("GET /api/messages/drafts", () => {
        test("returns all draft messages", async () => {
            await messageRepo.create(testMessageData);
            
            const req = new Request("http://localhost/api/messages/drafts");
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].sentAt).toBeNull();
        });

        test("returns draft messages filtered by clientId", async () => {
            await messageRepo.create(testMessageData);
            
            const req = new Request("http://localhost/api/messages/drafts?clientId=1");
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].clientId).toBe(1);
            expect(data[0].sentAt).toBeNull();
        });
    });

    describe("POST /api/messages", () => {
        test("creates a new message", async () => {
            const req = new Request("http://localhost/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testMessageData)
            });
            const res = await app.fetch(req);
            expect(res.status).toBe(201);
            const data = await res.json();
            expect(data.body).toBe(testMessageData.body);
            expect(data.id).toBeDefined();
        });

        test("returns 400 for missing required fields", async () => {
            const invalidData = {
                clientId: 1
                // missing direction and body
            };
            const req = new Request("http://localhost/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(invalidData)
            });
            const res = await app.fetch(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.missingFields).toBeDefined();
        });
    });

    describe("PUT /api/messages/:id", () => {
        test("updates an existing message", async () => {
            const message = await messageRepo.create(testMessageData);
            const updateData = {
                body: "Updated message content"
            };
            
            const req = new Request(`http://localhost/api/messages/${message.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            });
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.body).toBe(updateData.body);
        });

        test("returns 404 for non-existent message", async () => {
            const req = new Request("http://localhost/api/messages/999999", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body: "Updated content" })
            });
            const res = await app.fetch(req);
            expect(res.status).toBe(404);
        });
    });

    describe("POST /api/messages/:id/send", () => {
        test("marks a message as sent", async () => {
            const message = await messageRepo.create(testMessageData);
            
            const req = new Request(`http://localhost/api/messages/${message.id}/send`, {
                method: "POST"
            });
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.sentAt).toBeDefined();
        });

        test("returns 404 for non-existent message", async () => {
            const req = new Request("http://localhost/api/messages/999999/send", {
                method: "POST"
            });
            const res = await app.fetch(req);
            expect(res.status).toBe(404);
        });
    });
});
