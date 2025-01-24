import { Hono } from "hono";
import { cors } from 'hono/cors'
import { Database } from "bun:sqlite";
import { ClientRepository } from "../db/repositories/client";
import { clientRoutes } from "./routes/clients";
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
    
    // Mount routes
    app.route("/api/clients", clientRoutes(clientRepo));
    
    return app;
}
