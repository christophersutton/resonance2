import { Hono } from "hono";
import { cors } from 'hono/cors';
import { setupRoutes } from "./api/routes";
import { config } from "./config";
import { setupDatabase } from "./db/setup";

// Initialize the database
const db = await setupDatabase({ dbPath: config.dbPath });
const app = new Hono();

// Configure CORS
app.use('*', cors({
  origin: config.corsOrigin,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Requested-With'],
}));

// Error handling
app.onError((err, c) => {
  console.error(`Error:`, err);
  if (err instanceof Error) {
    return c.json({ error: err.message }, err.name === "NotFoundError" ? 404 : 500);
  }
  return c.json({ error: "An unexpected error occurred" }, 500);
});

const routes = setupRoutes(db);
app.route("/", routes);

Bun.serve({
  port: 3000,
  fetch: app.fetch,
});

console.log("🦊 Server is running at http://localhost:3000");
