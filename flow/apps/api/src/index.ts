import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Import route handlers
import authRoutes from "@/routes/auth";
import workflowRoutes from "@/routes/workflows";
import nodeRoutes from "@/routes/nodes";
import edgeRoutes from "@/routes/edges";
import executionRoutes from "@/routes/executions";
import streamRoutes from "@/routes/streams";
import webhookRoutes from "@/routes/webhooks";

// Import queue configuration, worker, and scheduler
import { redis, workflowQueue } from "@/queue";
import { workflowWorker } from "@/worker/workflowWorker";
import { startScheduler } from "@/scheduler";

const app: Express = express();
// process.env.PORT is set dynamically by Heroku; API_PORT is the local dev default
const port = process.env.PORT || process.env.API_PORT || 5000;
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

// ─────────────────────────────────────────────────────────────
// Middleware Setup
// ─────────────────────────────────────────────────────────────

app.use(helmet({
  // SSE streams need this header absent so browsers don't buffer the response
  crossOriginEmbedderPolicy: false,
}));

// Webhook route gets its own tight body limit — must be mounted BEFORE the
// global json() parser so the 64 KB cap takes effect (body-parser skips
// re-parsing once req.body is already populated).
app.use("/api/webhooks", express.json({ limit: "64kb" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// CORS configuration
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Rate limiting ──────────────────────────────────────────────────────────────

// Global limiter — uses RATE_LIMIT_* env vars (defined in .env.local)
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 min default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Tighter limiter for auth endpoints — prevents brute-force on sessions
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth requests, please try again later." },
});

app.use(globalLimiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] [${req.method}] ${req.path}`);
  next();
});

// ─────────────────────────────────────────────────────────────
// Redis & Worker Setup
// ─────────────────────────────────────────────────────────────

// Add Redis event listeners
redis.on("error", (err) => console.error("Redis error:", err));
redis.on("connect", () => console.log("✅ Redis connected"));

// workflowWorker is imported from @/worker/workflowWorker and starts automatically

// ─────────────────────────────────────────────────────────────
// Health Check Endpoint
// ─────────────────────────────────────────────────────────────

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "flow-api",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ─────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────

// Auth routes — tighter rate limit (brute-force protection)
app.use("/auth", authLimiter, authRoutes);

// Protected routes (require authentication)
app.use("/api/workflows", workflowRoutes);
app.use("/api/workflows", nodeRoutes);
app.use("/api/workflows", edgeRoutes);
app.use("/api/workflows", executionRoutes);
app.use("/api/executions", streamRoutes);

// Public webhook triggers (no JWT — validated by webhook secret)
app.use("/api/webhooks", webhookRoutes);

// ─────────────────────────────────────────────────────────────
// Error Handling Middleware
// ─────────────────────────────────────────────────────────────

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  // Default error response
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    path: req.path,
    method: req.method,
  });
});

// ─────────────────────────────────────────────────────────────
// Server Startup
// ─────────────────────────────────────────────────────────────

async function startServer() {
  try {
    // Start cron scheduler after DB is reachable
    await startScheduler();

    app.listen(port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                    🚀 FLOW API STARTED                    ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  🌐 Server: http://localhost:${port}                      ║
║  🔐 Auth:   http://localhost:${port}/auth                 ║
║  📊 Health: http://localhost:${port}/health               ║
║  ⚙️  Worker: BullMQ (workflow-execution)                  ║
║  💾 Redis:  ${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}                    ║
║  🗄️  DB:    Neon PostgreSQL                              ║
║                                                            ║
║  Environment: ${process.env.NODE_ENV || "development"}                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────────────────────

async function shutdown() {
  console.log("\n🛑 Shutting down gracefully...");
  try {
    await workflowWorker.close();
    console.log("  ✓ Worker closed");

    await workflowQueue.close();
    console.log("  ✓ Queue closed");

    await redis.quit();
    console.log("  ✓ Redis disconnected");

    console.log("✅ Server shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start the server
startServer();

export { app, redis, workflowQueue };
