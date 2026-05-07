import dotenv from "dotenv";
import { Queue } from "bullmq";
import Redis from "ioredis";

// Ensure dotenv is loaded
dotenv.config();

// Redis client for queue
export const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Workflow execution queue
export const workflowQueue = new Queue("workflow-execution", {
  connection: redis,
  defaultJobOptions: {
    attempts: parseInt(process.env.BULLMQ_MAX_RETRIES || "3"),
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
  },
});
