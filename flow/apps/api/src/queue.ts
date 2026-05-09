import dotenv from "dotenv";
import { Queue } from "bullmq";
import Redis from "ioredis";

// Ensure dotenv is loaded
dotenv.config();

const redisSharedOpts = {
  maxRetriesPerRequest: null as null, // Required for BullMQ
  enableReadyCheck: false,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
};

const redisUrl = process.env.REDIS_TLS_URL || process.env.REDIS_URL;

export const redis = redisUrl
  ? new Redis(redisUrl, {
      ...redisSharedOpts,
      tls: redisUrl.startsWith("rediss://") ? {} : undefined,
    })
  : new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
      ...redisSharedOpts,
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
    removeOnFail: { count: 100 }, // keep last 100 failures for debugging; prevents unbounded queue growth
  },
});
