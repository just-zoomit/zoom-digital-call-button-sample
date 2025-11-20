import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./config/env.js";
import callRouter from "./routes/call.js";
import zoomRouter from "./routes/zoom.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";

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

// Healthcheck
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handler (last)
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running at http://localhost:${env.port}`);
});
