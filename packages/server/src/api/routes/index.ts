//export everything
export * from './clients';
export * from './tasks';
export * from './messages';

import { Hono } from "hono";
import { Database } from "bun:sqlite";
import { clientRoutes } from "./clients";
import { messageRoutes } from "./messages";
import { taskRoutes } from "./tasks";
import { authRoutes } from "./auth";
import { authMiddleware, requireAuth } from "../../middleware/auth";
import { ClientRepository } from "../../db/repositories/client";
import { MessageRepository } from "../../db/repositories/message";
import { TaskRepository } from "../../db/repositories/task";
import { UserRepository } from "../../db/repositories/user";
import { webhookRoutes } from "./webhooks";

export function setupRoutes(db: Database) {
    const app = new Hono();

    // Initialize repositories
    const clientRepo = new ClientRepository(db);
    const messageRepo = new MessageRepository(db);
    const taskRepo = new TaskRepository(db);
    const userRepo = new UserRepository(db);

    // Auth routes
    app.route("/api/auth", authRoutes(userRepo));

    // API routes (no auth required for now)
    app.route("/api/clients", clientRoutes(clientRepo));
    app.route("/api/messages", messageRoutes(messageRepo));
    app.route("/api/tasks", taskRoutes(taskRepo));

    // Webhook routes
    app.route("/api/webhooks", webhookRoutes({ clientRepo, messageRepo, taskRepo }));

    return app;
}
