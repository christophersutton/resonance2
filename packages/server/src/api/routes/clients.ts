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
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error fetching clients:", error);
            }
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
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error creating client:", error);
            }
            return c.json({ error: "Failed to create client" }, 500);
        }
    });

    // PUT /api/clients/:id - Update a client
    app.put("/:id", async (c) => {
        try {
            const id = Number(c.req.param("id"));
            const body = await c.req.json();
            
            // Check if client exists
            const existingClient = await clientRepo.findById(id);
            if (!existingClient) {
                return c.json({ error: "Client not found" }, 404);
            }

            // Basic validation - only validate fields that are present
            const requiredFields = ["organizationName", "firstName", "lastName", "email", "services"];
            const providedFields = Object.keys(body);
            const invalidFields = providedFields.filter(field => 
                requiredFields.includes(field) && !body[field]
            );
            
            if (invalidFields.length > 0) {
                return c.json({
                    error: "Invalid fields provided",
                    invalidFields
                }, 400);
            }

            const updatedClient = await clientRepo.update(id, body);
            if (!updatedClient) {
                return c.json({ error: "Failed to update client" }, 500);
            }

            return c.json(updatedClient);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error updating client:", error);
            }
            return c.json({ error: "Failed to update client" }, 500);
        }
    });

    // DELETE /api/clients/:id - Delete a client
    app.delete("/:id", async (c) => {
        try {
            const id = Number(c.req.param("id"));
            
            // Check if client exists
            const existingClient = await clientRepo.findById(id);
            if (!existingClient) {
                return c.json({ error: "Client not found" }, 404);
            }

            try {
                await clientRepo.deleteWithRelated(id);
                return new Response(null, { status: 204 });
            } catch (error) {
                return new Response(JSON.stringify({ error: 'Failed to delete client' }), { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error deleting client:", error);
            }
            return c.json({ error: "Failed to delete client" }, 500);
        }
    });

    return app;
}
