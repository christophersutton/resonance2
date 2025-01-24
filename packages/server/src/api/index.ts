import { Hono } from "hono";
import { cors } from 'hono/cors'
import { Database } from "bun:sqlite";
import { ClientRepository } from "../db/repositories/client";
import { TaskRepository } from '../db/repositories/task';
import { clientRoutes } from "./routes/clients";
import { taskRoutes } from './routes/tasks';
import { config } from '../config';

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
    
    // Mount routes
    app.route("/api/clients", clientRoutes(clientRepo));
    app.route('/api/tasks', taskRoutes(taskRepo));
    
    return app;
}
