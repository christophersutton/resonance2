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

export function setupRoutes(db: Database) {
    const app = new Hono();

    // Initialize repositories
    const clientRepo = new ClientRepository(db);
    const messageRepo = new MessageRepository(db);
    const taskRepo = new TaskRepository(db);
    const userRepo = new UserRepository(db);

    // Auth routes (no auth required)
    app.route("/api/auth", authRoutes(userRepo));

    // Protected API routes
    const protectedRoutes = new Hono();
    
    // Apply auth middleware to all protected routes
    protectedRoutes.use("*", authMiddleware);
    protectedRoutes.use("*", requireAuth);

    // Mount protected routes
    protectedRoutes.route("/clients", clientRoutes(clientRepo));
    protectedRoutes.route("/messages", messageRoutes(messageRepo));
    protectedRoutes.route("/tasks", taskRoutes(taskRepo));

    // Mount all protected routes under /api
    app.route("/api", protectedRoutes);

    return app;
}
