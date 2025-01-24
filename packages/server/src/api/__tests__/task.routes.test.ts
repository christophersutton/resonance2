// @ts-nocheck
import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { TaskRepository } from "../../db/repositories/task";
import { taskRoutes } from "../routes/tasks";
import { createTestContext, cleanupTestContext } from "../../db/__tests__/test-utils";
import type { TestContext } from "../../db/__tests__/test-utils";
import type { Task } from "../../../../shared/src/types/entities";

interface Event {
    id: number;
    task_id: number;
    type: string;
    data: string;
    created_at: string;
}

describe("Task Routes", () => {
    let context: TestContext;
    let app: Hono;
    let taskRepo: TaskRepository;

    const testTaskData: Omit<Task, 'id' | 'createdAt'> = {
        clientId: 1,
        type: "FEATURE_REQUEST",
        serviceCategory: "DEV",
        urgency: "medium",
        status: "open",
        title: "Test Task",
        description: "This is a test task"
    };

    beforeEach(async () => {
        context = await createTestContext();
        taskRepo = new TaskRepository(context.db);
        app = new Hono();
        app.route("/api/tasks", taskRoutes(taskRepo));
    });

    afterEach(async () => {
        await cleanupTestContext(context);
    });

    describe("GET /api/tasks", () => {
        test("returns all tasks", async () => {
            const req = new Request("http://localhost/api/tasks");
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(Array.isArray(data)).toBe(true);
        });

        test("returns tasks filtered by clientId", async () => {
            // First create a task
            const task = await taskRepo.create(testTaskData);
            
            const req = new Request("http://localhost/api/tasks?clientId=1");
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].clientId).toBe(1);
        });

        test("handles database errors gracefully", async () => {
            const errorApp = new Hono();
            const mockRepo = new TaskRepository(context.db);
            mockRepo.findAll = async () => { throw new Error("Database error"); };
            errorApp.route("/api/tasks", taskRoutes(mockRepo));

            const req = new Request("http://localhost/api/tasks");
            const res = await errorApp.fetch(req);
            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data.error).toBeDefined();
        });
    });

    describe("GET /api/tasks with events", () => {
        test("returns task with events when includeEvents=true", async () => {
            // First create a task
            const task = await taskRepo.create(testTaskData);
            
            // Create an event for the task
            const result = (await context.db.query(`
                INSERT INTO events (task_id, event_type, details) 
                VALUES (?, ?, ?)
                RETURNING id
            `).get(task.id, "STATUS_CHANGE", JSON.stringify({ from: "open", to: "in_progress" }))) as Event;

            // Verify event was created
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();

            // Verify event exists in database
            const event = (await context.db.query(`
                SELECT * FROM events WHERE id = ?
            `).get(result.id)) as Event;
            expect(event).toBeDefined();
            expect(Number(event.task_id)).toBe(task.id);

            const req = new Request("http://localhost/api/tasks?clientId=1&includeEvents=true");
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
            
            // Find our specific task
            const ourTask = data.find((t: any) => t.id === task.id);
            expect(ourTask).toBeDefined();
            expect(ourTask.events).toBeDefined();
            expect(Array.isArray(ourTask.events)).toBe(true);
            expect(ourTask.events.length).toBe(1);
            expect(ourTask.events[0].eventType).toBe("STATUS_CHANGE");
            expect(ourTask.events[0].details).toEqual({ from: "open", to: "in_progress" });

            // Log the full data for debugging
            console.log('Task data:', JSON.stringify(data, null, 2));
        });

        test("returns task without events when includeEvents is not set", async () => {
            // First create a task
            const task = await taskRepo.create(testTaskData);
            
            // Create an event for the task
            await context.db.query(`
                INSERT INTO events (task_id, event_type, details) 
                VALUES (?, ?, ?)
            `).run(task.id, "STATUS_CHANGE", JSON.stringify({ from: "open", to: "in_progress" }));

            const req = new Request("http://localhost/api/tasks?clientId=1");
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].events).toBeUndefined();
        });
    });

    describe("GET /api/tasks/:id", () => {
        test("returns a single task", async () => {
            const task = await taskRepo.create(testTaskData);
            
            const req = new Request(`http://localhost/api/tasks/${task.id}`);
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.id).toBe(task.id);
            expect(data.title).toBe(testTaskData.title);
        });

        test("returns 404 for non-existent task", async () => {
            const req = new Request("http://localhost/api/tasks/999999");
            const res = await app.fetch(req);
            expect(res.status).toBe(404);
        });
    });

    describe("GET /api/tasks/:id with events", () => {
        test("returns single task with events when includeEvents=true", async () => {
            // First create a task
            const task = await taskRepo.create(testTaskData);
            
            // Create multiple events for the task
            await context.db.query(`
                INSERT INTO events (task_id, event_type, details) 
                VALUES 
                    (?, ?, ?),
                    (?, ?, ?)
            `).run(
                task.id, "STATUS_CHANGE", JSON.stringify({ from: "open", to: "in_progress" }),
                task.id, "COMMENT_ADDED", JSON.stringify({ comment: "Test comment" })
            );

            const req = new Request(`http://localhost/api/tasks/${task.id}?includeEvents=true`);
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            
            expect(data.id).toBe(task.id);
            expect(data.events).toBeDefined();
            expect(Array.isArray(data.events)).toBe(true);
            expect(data.events.length).toBe(2);
            
            // Events should be in descending order by created_at
            expect(data.events[0].eventType).toBeDefined();
            expect(data.events[0].details).toBeDefined();
            expect(data.events[1].eventType).toBeDefined();
            expect(data.events[1].details).toBeDefined();
        });

        test("returns single task without events when includeEvents is not set", async () => {
            // First create a task
            const task = await taskRepo.create(testTaskData);
            
            // Create an event for the task
            await context.db.query(`
                INSERT INTO events (task_id, event_type, details) 
                VALUES (?, ?, ?)
            `).run(task.id, "STATUS_CHANGE", JSON.stringify({ from: "open", to: "in_progress" }));

            const req = new Request(`http://localhost/api/tasks/${task.id}`);
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            
            expect(data.id).toBe(task.id);
            expect(data.events).toBeUndefined();
        });

        test("handles task not found with includeEvents=true", async () => {
            const req = new Request("http://localhost/api/tasks/999?includeEvents=true");
            const res = await app.fetch(req);
            expect(res.status).toBe(404);
            const data = await res.json();
            expect(data.error).toBe("Task not found");
        });
    });

    describe("POST /api/tasks", () => {
        test("creates a new task", async () => {
            const req = new Request("http://localhost/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testTaskData)
            });
            const res = await app.fetch(req);
            expect(res.status).toBe(201);
            const data = await res.json();
            expect(data.title).toBe(testTaskData.title);
            expect(data.id).toBeDefined();
        });

        test("validates required fields", async () => {
            const invalidData = {
                clientId: 1,
                // missing required fields
                description: "Test task"
            };
            const req = new Request("http://localhost/api/tasks", {
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

    describe("PUT /api/tasks/:id", () => {
        test("updates an existing task", async () => {
            const task = await taskRepo.create(testTaskData);
            const updateData = { ...testTaskData, title: "Updated Title" };
            
            const req = new Request(`http://localhost/api/tasks/${task.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            });
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.title).toBe("Updated Title");
        });

        test("returns 404 for non-existent task", async () => {
            const req = new Request("http://localhost/api/tasks/999999", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testTaskData)
            });
            const res = await app.fetch(req);
            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /api/tasks/:id", () => {
        test("deletes an existing task", async () => {
            const task = await taskRepo.create(testTaskData);
            
            const req = new Request(`http://localhost/api/tasks/${task.id}`, {
                method: "DELETE"
            });
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            
            // Verify task is deleted
            const deletedTask = await taskRepo.findById(task.id);
            expect(deletedTask).toBeNull();
        });

        test("returns 404 for non-existent task", async () => {
            const req = new Request("http://localhost/api/tasks/999999", {
                method: "DELETE"
            });
            const res = await app.fetch(req);
            expect(res.status).toBe(404);
        });
    });

    describe("GET /api/tasks/status/:status", () => {
        test("returns tasks filtered by status", async () => {
            // Create a task with known status
            await taskRepo.create(testTaskData);
            
            const req = new Request("http://localhost/api/tasks/status/open");
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
            expect(data[0].status).toBe("open");
        });
    });
});
