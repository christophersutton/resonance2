import { Hono } from "hono";
import { Database } from "bun:sqlite";
import { ClientRepository } from "../db/repositories/client";
import { clientRoutes } from "./routes/clients";

export function createApi(db: Database) {
    const app = new Hono();
    
    // Initialize repositories
    const clientRepo = new ClientRepository(db);
    
    // Mount routes
    app.route("/api/clients", clientRoutes(clientRepo));
    
    return app;
}
