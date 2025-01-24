import { Hono } from "hono";
import { MessageRepository } from "../../db/repositories/message";
import type { Message } from "../../../../shared/src/types/entities";

export function messageRoutes(messageRepo: MessageRepository) {
    const app = new Hono();

    // GET /api/messages - List all messages (with optional clientId or taskId filter)
    app.get("/", async (c) => {
        try {
            const clientId = c.req.query("clientId");
            const taskId = c.req.query("taskId");
            
            if (clientId) {
                const messages = await messageRepo.findByClientId(Number(clientId));
                return c.json(messages);
            }

            if (taskId) {
                const messages = await messageRepo.findByTaskId(Number(taskId));
                return c.json(messages);
            }
            
            const messages = await messageRepo.findAll();
            return c.json(messages);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error fetching messages:", error);
            }
            return c.json({ error: "Failed to fetch messages" }, 500);
        }
    });

    // GET /api/messages/drafts - List all draft messages
    app.get("/drafts", async (c) => {
        try {
            const clientId = c.req.query("clientId");
            
            if (clientId) {
                const messages = await messageRepo.findDraftsByClientId(Number(clientId));
                return c.json(messages);
            }
            
            const messages = await messageRepo.findDrafts();
            return c.json(messages);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error fetching draft messages:", error);
            }
            return c.json({ error: "Failed to fetch draft messages" }, 500);
        }
    });

    // GET /api/messages/:id - Get single message
    app.get("/:id", async (c) => {
        try {
            const id = Number(c.req.param("id"));
            const message = await messageRepo.findById(id);
            
            if (!message) {
                return c.json({ error: "Message not found" }, 404);
            }
            
            return c.json(message);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error fetching message:", error);
            }
            return c.json({ error: "Failed to fetch message" }, 500);
        }
    });

    // POST /api/messages - Create a new message
    app.post("/", async (c) => {
        try {
            const body = await c.req.json();
            
            // Basic validation
            const requiredFields = ["clientId", "direction", "body"];
            const missingFields = requiredFields.filter(field => !(field in body));
            
            if (missingFields.length > 0) {
                return c.json({
                    error: "Missing required fields",
                    missingFields: missingFields
                }, 400);
            }
            
            const message = await messageRepo.create(body);
            return c.json(message, 201);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error creating message:", error);
            }
            return c.json({ error: "Failed to create message" }, 500);
        }
    });

    // PUT /api/messages/:id - Update a message
    app.put("/:id", async (c) => {
        try {
            const id = Number(c.req.param("id"));
            const body = await c.req.json();
            
            const existingMessage = await messageRepo.findById(id);
            if (!existingMessage) {
                return c.json({ error: "Message not found" }, 404);
            }

            const updatedMessage = await messageRepo.update(id, body);
            return c.json(updatedMessage);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error updating message:", error);
            }
            return c.json({ error: "Failed to update message" }, 500);
        }
    });

    // POST /api/messages/:id/send - Mark a message as sent
    app.post("/:id/send", async (c) => {
        try {
            const id = Number(c.req.param("id"));
            
            const existingMessage = await messageRepo.findById(id);
            if (!existingMessage) {
                return c.json({ error: "Message not found" }, 404);
            }

            const sentMessage = await messageRepo.markAsSent(id);
            return c.json(sentMessage);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error marking message as sent:", error);
            }
            return c.json({ error: "Failed to mark message as sent" }, 500);
        }
    });

    return app;
}
