import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { WebSocketServer } from "ws";

import { env } from "./config/env.js";
import callRouter from "./routes/call.js";
import zoomRouter from "./routes/zoom.js";
import catalogRouter from "./routes/catalog.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { handleWebSocketConnection } from "./middleware/websocketHandler.js";
import { websocketService } from "./services/websocketService.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security and logging
app.use(helmet());
app.use(morgan("dev"));

// Static assets
app.use(express.static(path.join(__dirname, "..", "public")));

// View engine (EJS)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

// Rate limit API routes
app.use("/api", rateLimit);
app.use("/call", rateLimit);
app.use("/call-request", rateLimit);

// Routes
app.use("/", callRouter);
app.use("/zoom", zoomRouter);
app.use("/", catalogRouter);

// WebSocket stats endpoint
app.get("/ws-stats", (_, res) => {
  res.json(websocketService.getStats());
});

// Healthcheck
app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

// Error handler (last)
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: "/ws"
});

// Handle WebSocket connections
wss.on('connection', (ws, request) => {
  handleWebSocketConnection(ws, request);
});

server.listen(env.port, () => {
  console.log(`Server running at http://localhost:${env.port}`);
  console.log(`WebSocket server running at ws://localhost:${env.port}/ws`);
});
