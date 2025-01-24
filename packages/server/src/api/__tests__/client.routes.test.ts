import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { ClientRepository } from "../../db/repositories/client";
import { clientRoutes } from "../routes/clients";
import { createTestContext, cleanupTestContext, testClientData } from "../../db/__tests__/test-utils";
import type { TestContext } from "../../db/__tests__/test-utils";

describe("Client Routes", () => {
    let context: TestContext;
    let app: Hono;

    beforeEach(async () => {
        context = await createTestContext();
        const clientRepo = new ClientRepository(context.db);
        app = new Hono();
        app.route("/api/clients", clientRoutes(clientRepo));
    });

    afterEach(async () => {
        await cleanupTestContext(context);
    });

    describe("GET /api/clients", () => {
        test("returns all clients", async () => {
            const req = new Request("http://localhost/api/clients");
            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            
            const data = await res.json();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
            expect(data[0]).toHaveProperty("id");
            expect(data[0]).toHaveProperty("organizationName");
        });

        test("handles database errors", async () => {
            // Create a new app with a repository that throws an error
            const errorApp = new Hono();
            const mockRepo = new ClientRepository(context.db);
            mockRepo.findAll = async () => { throw new Error("Database error"); };
            errorApp.route("/api/clients", clientRoutes(mockRepo));

            const req = new Request("http://localhost/api/clients");
            const res = await errorApp.fetch(req);
            expect(res.status).toBe(500);
            
            const data = await res.json();
            expect(data).toHaveProperty("error");
        });
    });

    describe("POST /api/clients", () => {
        test("creates new client successfully", async () => {
            const req = new Request("http://localhost/api/clients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(testClientData),
            });

            const res = await app.fetch(req);
            expect(res.status).toBe(201);
            
            const data = await res.json();
            expect(data).toHaveProperty("id");
            expect(data.email).toBe(testClientData.email);
            expect(data.organizationName).toBe(testClientData.organizationName);
        });

        test("returns 400 when required fields are missing", async () => {
            const incompleteData = {
                firstName: "Test",
                lastName: "User",
            };

            const req = new Request("http://localhost/api/clients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(incompleteData),
            });

            const res = await app.fetch(req);
            expect(res.status).toBe(400);
            
            const data = await res.json();
            expect(data).toHaveProperty("error");
            expect(data).toHaveProperty("missingFields");
            expect(Array.isArray(data.missingFields)).toBe(true);
        });

        test("handles database errors during creation", async () => {
            // Create a new app with a repository that throws an error
            const errorApp = new Hono();
            const mockRepo = new ClientRepository(context.db);
            mockRepo.create = async () => { throw new Error("Database error"); };
            errorApp.route("/api/clients", clientRoutes(mockRepo));

            const req = new Request("http://localhost/api/clients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(testClientData),
            });

            const res = await errorApp.fetch(req);
            expect(res.status).toBe(500);
            
            const data = await res.json();
            expect(data).toHaveProperty("error");
        });
    });

    describe("PUT /api/clients/:id", () => {
        test("updates client successfully", async () => {
            const updateData = {
                organizationName: "Updated Org",
                firstName: "Updated",
                lastName: "User",
                email: "updated@example.com",
                services: ["WEB_DEVELOPMENT", "CONSULTING"]
            };

            const req = new Request(`http://localhost/api/clients/1`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            });

            const res = await app.fetch(req);
            expect(res.status).toBe(200);
            
            const data = await res.json();
            expect(data).toHaveProperty("id", 1);
            expect(data.email).toBe(updateData.email);
            expect(data.organizationName).toBe(updateData.organizationName);
        });

        test("returns 404 when client not found", async () => {
            const updateData = {
                organizationName: "Updated Org",
                firstName: "Updated",
                lastName: "User",
                email: "updated@example.com",
                services: ["WEB_DEVELOPMENT"]
            };

            const req = new Request(`http://localhost/api/clients/999`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            });

            const res = await app.fetch(req);
            expect(res.status).toBe(404);
            
            const data = await res.json();
            expect(data).toHaveProperty("error");
        });

        test("returns 400 when update data is invalid", async () => {
            const invalidData = {
                organizationName: "", // Empty required field
                email: "updated@example.com"
            };

            const req = new Request(`http://localhost/api/clients/1`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(invalidData),
            });

            const res = await app.fetch(req);
            expect(res.status).toBe(400);
            
            const data = await res.json();
            expect(data).toHaveProperty("error");
            expect(data).toHaveProperty("invalidFields");
            expect(Array.isArray(data.invalidFields)).toBe(true);
        });

        test("handles database errors during update", async () => {
            // Create a new app with a repository that throws an error
            const errorApp = new Hono();
            const mockRepo = new ClientRepository(context.db);
            mockRepo.update = async () => { throw new Error("Database error"); };
            errorApp.route("/api/clients", clientRoutes(mockRepo));

            const req = new Request(`http://localhost/api/clients/1`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(testClientData),
            });

            const res = await errorApp.fetch(req);
            expect(res.status).toBe(500);
            
            const data = await res.json();
            expect(data).toHaveProperty("error");
        });
    });

    describe("DELETE /api/clients/:id", () => {
        test("deletes client successfully", async () => {
            const req = new Request(`http://localhost/api/clients/1`, {
                method: "DELETE"
            });

            const res = await app.fetch(req);
            expect(res.status).toBe(204);
            
            // Verify client is deleted
            const getReq = new Request(`http://localhost/api/clients/1`);
            const getRes = await app.fetch(getReq);
            expect(getRes.status).toBe(404);
        });

        test("returns 404 when client not found", async () => {
            const req = new Request(`http://localhost/api/clients/999`, {
                method: "DELETE"
            });

            const res = await app.fetch(req);
            expect(res.status).toBe(404);
            
            const data = await res.json();
            expect(data).toHaveProperty("error");
        });

        test("handles database errors during deletion", async () => {
            // Create a new app with a repository that throws an error
            const errorApp = new Hono();
            const mockRepo = new ClientRepository(context.db);
            mockRepo.delete = async () => { throw new Error("Database error"); };
            errorApp.route("/api/clients", clientRoutes(mockRepo));

            const req = new Request(`http://localhost/api/clients/1`, {
                method: "DELETE"
            });

            const res = await errorApp.fetch(req);
            expect(res.status).toBe(500);
            
            const data = await res.json();
            expect(data).toHaveProperty("error");
        });
    });
});
