import express, { Express, Request, Response, NextFunction } from "express";
import Redis from "ioredis";
import { Queue, Worker } from "bullmq";
import cors from "cors";

// Import route handlers
import authRoutes from "@/routes/auth";
import workflowRoutes from "@/routes/workflows";
import nodeRoutes from "@/routes/nodes";
import edgeRoutes from "@/routes/edges";
import executionRoutes from "@/routes/executions";

// Import queue configuration
import { redis, workflowQueue } from "@/queue";

const app: Express = express();
const port = process.env.API_PORT || 5000;
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

// ─────────────────────────────────────────────────────────────
// Middleware Setup
// ─────────────────────────────────────────────────────────────

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

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] [${req.method}] ${req.path}`);
  next();
});

// ─────────────────────────────────────────────────────────────
// BullMQ Worker Setup
// ─────────────────────────────────────────────────────────────

// Add Redis event listeners
redis.on("error", (err) => console.error("Redis error:", err));
redis.on("connect", () => console.log("✅ Redis connected"));

const workflowWorker = new Worker(
  "workflow-execution",
  async (job) => {
    try {
      console.log(`🔄 Processing workflow job ${job.id}:`, job.data);
      // TODO: Implement workflow execution logic
      // For now, just mark as completed after a short delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, jobId: job.id };
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      throw error;
    }
  },
  { connection: redis, concurrency: 5 },
);

workflowWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

workflowWorker.on("failed", (job, err) => {
  console.log(`❌ Job ${job?.id} failed:`, err.message);
});

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

// Auth routes (no auth middleware required for signup/login)
app.use("/auth", authRoutes);

// Protected routes (require authentication)
app.use("/api/workflows", workflowRoutes);
app.use("/api/workflows", nodeRoutes);
app.use("/api/workflows", edgeRoutes);
app.use("/api/workflows", executionRoutes);

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
