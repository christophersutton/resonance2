import { Database } from "bun:sqlite";
import { createApi } from "./api";

// Initialize database
const db = new Database("./db/db.sqlite");

// Create API
const api = createApi(db);

// Create server
const server = Bun.serve({
  port: 3000,
  fetch: api.fetch,
});

console.log(`Listening on http://localhost:${server.port} 🚀`);
