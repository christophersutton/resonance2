import { Hono } from "hono";
import { ClientRepository } from "../../db/repositories/client";
import type { Client } from "../../../../shared/src/types/entities";

export function clientRoutes(clientRepo: ClientRepository) {
    const app = new Hono();

    // GET /api/clients - List all clients
    app.get("/", async (c) => {
        try {
            const clients = await clientRepo.findAll();
            return c.json(clients);
        } catch (error) {
            console.error("Error fetching clients:", error);
            return c.json({ error: "Failed to fetch clients" }, 500);
        }
    });

    // POST /api/clients - Create a new client
    app.post("/", async (c) => {
        try {
            const body = await c.req.json();
            
            // Basic validation
            const requiredFields = ["organizationName", "firstName", "lastName", "email", "services"];
            const missingFields = requiredFields.filter(field => !(field in body));
            
            if (missingFields.length > 0) {
                return c.json({
                    error: "Missing required fields",
                    missingFields: missingFields
                }, 400);
            }
            
            const client = await clientRepo.create(body);
            return c.json(client, 201);
        } catch (error) {
            console.error("Error creating client:", error);
            return c.json({ error: "Failed to create client" }, 500);
        }
    });

    return app;
}
