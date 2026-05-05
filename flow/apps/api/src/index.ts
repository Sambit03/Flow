import express, { Express, Request, Response } from 'express';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.API_PORT || 5000;

// Middleware
app.use(express.json());

// Initialize Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

// Initialize PostgreSQL
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize BullMQ Queue for workflow execution
const workflowQueue = new Queue('workflow-execution', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Initialize BullMQ Worker for processing workflow jobs
const workflowWorker = new Worker(
  'workflow-execution',
  async (job) => {
    console.log(`Processing workflow job ${job.id}:`, job.data);
    // TODO: Implement workflow execution logic
    return { success: true };
  },
  { connection: redis, concurrency: 5 }
);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'flow-api' });
});

// API endpoints
app.get('/api/workflows', async (req: Request, res: Response) => {
  try {
    const result = await pgPool.query('SELECT * FROM workflows LIMIT 10');
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

app.post('/api/workflows/execute', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.body;
    const job = await workflowQueue.add('execute', {
      workflowId,
      timestamp: new Date(),
    });
    res.json({ jobId: job.id, status: 'queued' });
  } catch (error) {
    console.error('Queue error:', error);
    res.status(500).json({ error: 'Failed to queue workflow execution' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Flow API running on http://localhost:${port}`);
  console.log(`📊 Worker listening for workflow-execution jobs`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await workflowWorker.close();
  await workflowQueue.close();
  await redis.quit();
  await pgPool.end();
  process.exit(0);
});
