import { Hono } from "hono";
import { cors } from 'hono/cors'
import { Database } from "bun:sqlite";
import { ClientRepository,  TaskRepository, MessageRepository } from "../db/repositories/";
import { config } from '../config';
import { clientRoutes, taskRoutes, messageRoutes } from "./routes";
import emailWebhook from './webhooks/email';

export function createApi(db: Database) {
    const app = new Hono();
    
    // Configure CORS
    app.use('*', cors({
        origin: config.corsOrigin,
        credentials: true,
    }));
    
    // Initialize repositories
    const clientRepo = new ClientRepository(db);
    const taskRepo = new TaskRepository(db);
    const messageRepo = new MessageRepository(db);
    
    // Mount routes
    app.route("/api/clients", clientRoutes(clientRepo));
    app.route('/api/tasks', taskRoutes(taskRepo));
    app.route('/api/messages', messageRoutes(messageRepo));
    
    // Mount webhook routes
    app.route('/api/webhooks', emailWebhook(db));
    
    return app;
}
