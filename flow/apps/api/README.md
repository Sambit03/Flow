# Flow API

Express.js backend for the Flow workflow automation system.

## Technologies

- **Framework**: Express.js
- **Queue**: BullMQ with Redis
- **Database**: PostgreSQL
- **Authentication**: Supabase
- **Language**: TypeScript

## Setup

Install dependencies from root:

```bash
npm install
```

Set environment variables in `.env.local`:

```
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://user:password@localhost:5432/flow
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

## Development

Start in development mode with hot reload:

```bash
npm run dev --workspace=api
```

## Building

Build to JavaScript:

```bash
npm run build --workspace=api
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/workflows` - List workflows
- `POST /api/workflows/execute` - Queue workflow execution
