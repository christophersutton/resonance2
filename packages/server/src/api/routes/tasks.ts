import { Hono } from "hono";
import { TaskRepository } from "../../db/repositories/task";
import type { Task } from "../../../../shared/src/types/entities";
import type { TaskStatus } from "../../../../shared/src/types/enums";

export function taskRoutes(taskRepo: TaskRepository) {
    const app = new Hono();

    // GET /api/tasks - List all tasks (with optional clientId filter)
    app.get("/", async (c) => {
        try {
            const clientId = c.req.query("clientId");
            
            if (clientId) {
                const tasks = await taskRepo.findByClientId(Number(clientId));
                return c.json(tasks);
            }
            
            const tasks = await taskRepo.findAll();
            return c.json(tasks);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error fetching tasks:", error);
            }
            return c.json({ error: "Failed to fetch tasks" }, 500);
        }
    });

    // GET /api/tasks/:id - Get single task
    app.get("/:id", async (c) => {
        try {
            const id = Number(c.req.param("id"));
            const task = await taskRepo.findById(id);
            
            if (!task) {
                return c.json({ error: "Task not found" }, 404);
            }
            
            return c.json(task);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error fetching task:", error);
            }
            return c.json({ error: "Failed to fetch task" }, 500);
        }
    });

    // GET /api/tasks/status/:status - List tasks by status
    app.get("/status/:status", async (c) => {
        try {
            const status = c.req.param("status") as TaskStatus;
            const tasks = await taskRepo.findByStatus(status);
            return c.json(tasks);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error fetching tasks by status:", error);
            }
            return c.json({ error: "Failed to fetch tasks" }, 500);
        }
    });

    // POST /api/tasks - Create a new task
    app.post("/", async (c) => {
        try {
            const body = await c.req.json();
            
            // Basic validation
            const requiredFields = ["clientId", "type", "serviceCategory", "urgency", "status", "title"];
            const missingFields = requiredFields.filter(field => !(field in body));
            
            if (missingFields.length > 0) {
                return c.json({
                    error: "Missing required fields",
                    missingFields: missingFields
                }, 400);
            }
            
            const task = await taskRepo.create(body);
            return c.json(task, 201);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error creating task:", error);
            }
            return c.json({ error: "Failed to create task" }, 500);
        }
    });

    // PUT /api/tasks/:id - Update a task
    app.put("/:id", async (c) => {
        try {
            const id = Number(c.req.param("id"));
            const body = await c.req.json();
            
            const existingTask = await taskRepo.findById(id);
            if (!existingTask) {
                return c.json({ error: "Task not found" }, 404);
            }

            const updatedTask = await taskRepo.update(id, body);
            return c.json(updatedTask);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error updating task:", error);
            }
            return c.json({ error: "Failed to update task" }, 500);
        }
    });

    // DELETE /api/tasks/:id - Delete a task
    app.delete("/:id", async (c) => {
        try {
            const id = Number(c.req.param("id"));
            
            const existingTask = await taskRepo.findById(id);
            if (!existingTask) {
                return c.json({ error: "Task not found" }, 404);
            }

            await taskRepo.delete(id);
            return c.json({ success: true });
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error deleting task:", error);
            }
            return c.json({ error: "Failed to delete task" }, 500);
        }
    });

    return app;
}
