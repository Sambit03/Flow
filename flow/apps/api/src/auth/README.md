# Neon Auth Integration

This directory contains authentication middleware and utilities for Neon Auth integration.

## Files

- **neon-auth.ts** - Main authentication module with signup, login, and middleware

## Setup

### 1. Enable Neon Auth

In your Neon Dashboard:

1. Go to your project
2. Navigate to **Settings → Auth**
3. Enable **Auth** feature
4. Neon will configure JWT handling automatically

### 2. Environment Variables

Update `apps/api/.env.local`:

```env
NEON_AUTH_URL=https://auth.neon.tech
NEON_API_KEY=your-neon-api-key-here
```

Get your API key from Neon Project Settings.

### 3. Install Dependencies

```bash
npm install jwt-decode
```

## Usage

### Express Middleware

Protect routes with authentication:

```typescript
import { neonAuthMiddleware } from "@/auth/neon-auth";
import express from "express";

const app = express();

// Protect all routes under /api/
app.use("/api/", neonAuthMiddleware);

app.get("/api/workflows", (req, res) => {
  // req.user is available with userId, email, token
  const { userId } = (req as any).user;

  // Query database with userId
  res.json({ workflows: [] });
});
```

### Signup

```typescript
import { signup } from "@/auth/neon-auth";

try {
  const result = await signup("user@example.com", "password", "username");
  console.log(result.token); // JWT token
} catch (error) {
  console.error(error);
}
```

### Login

```typescript
import { login } from "@/auth/neon-auth";

try {
  const result = await login("user@example.com", "password");
  console.log(result.token); // JWT token
} catch (error) {
  console.error(error);
}
```

### Extract User ID

```typescript
import { getUserIdFromToken } from "@/auth/neon-auth";

const userId = getUserIdFromToken(token);
```

## Database Integration

The JWT token is automatically used by Neon DB for RLS policies.

When you send a request with a valid JWT:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/workflows
```

Neon DB's RLS policies use `auth.user_id()` to verify the user owns the data:

```sql
CREATE POLICY "workflows: own rows only" ON workflows
  FOR ALL USING (auth.user_id() = user_id);
```

## Key Points

- **No backend session management** — JWT is stateless
- **RLS enforces data isolation** — Even if API auth is bypassed, RLS protects data
- **Token validation** — Neon Auth manages token verification
- **HTTP-only cookies** — Consider using for extra security in browser apps

## See Also

- [Neon Auth Docs](https://neon.tech/docs/guides/neon-auth)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [RLS Policies](../db/rls-policies.sql)
