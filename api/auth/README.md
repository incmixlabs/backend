# Auth API – Custom Authentication Solution

## Overview
This service now uses a **custom authentication system** (migrated from Lucia v3) based on secure session tokens, HTTP-only cookies, and PostgreSQL (via Kysely). Lucia is no longer used or required.

### Key Features
- **Session Management**: Secure, random session IDs (base32) stored in a `sessions` table.
- **Cookie Security**: HttpOnly, SameSite=Lax, Secure (in production), Path=/, Max-Age/Expires set for 30 days.
- **Automatic Session Renewal**: Sessions are renewed automatically when halfway to expiration.
- **Database Integration**: Uses Kysely for all DB operations. No raw SQL.
- **User Context**: Authenticated user and session are attached to the Hono context for all protected routes.
- **Comprehensive Error Handling**: Expired, invalid, or missing sessions are handled gracefully.

## Migration from Lucia
- All Lucia dependencies, code, and DB adapters have been removed.
- The existing `sessions` table is reused (see migrations in `/db/api-migrations`).
- All authentication logic is now in `/src/auth/` (see below).

## Core Files
- `src/auth/session.ts`: Session creation, validation, invalidation (Kysely-based)
- `src/auth/cookies.ts`: Cookie utilities for setting/deleting session cookies
- `src/auth/middleware.ts`: Hono middleware for authentication/session validation
- `src/auth/types.ts`: TypeScript interfaces for session and user
- `src/auth/utils.ts`: Secure session ID generation, base32 encoding

## Usage in Routes
- Use the `authMiddleware` in your Hono app to automatically validate sessions and attach user/session to context.
- On login: call `createSession(db, userId)` and `setSessionCookie(response, session.id, session.expiresAt)`
- On logout: call `invalidateSession(db, sessionId)` and `deleteSessionCookie(response)`
- To logout all devices: call `invalidateAllSessions(db, userId)`

## Example: Login Flow
```ts
const db = c.get('db');
const session = await createSession(db, user.id);
setSessionCookie(c, session.id, session.expiresAt);
// ...return user info and session in response
```

## Example: Logout Flow
```ts
const db = c.get('db');
const session = c.get('session');
await invalidateSession(db, session.id);
deleteSessionCookie(c);
```

## Security Notes
- Session IDs are generated using Node.js crypto and base32-encoded.
- Cookies are HttpOnly, SameSite=Lax, Secure (in production), and have a 30-day expiration.
- Session renewal is automatic when more than half the session lifetime has elapsed.
- All DB queries use Kysely with prepared statements.

## Environment/Config
- Cookie name and security attributes are set via environment variables (see `env-vars.ts`).
- Production environments should use HTTPS and set `NODE_ENV=production` for Secure cookies.

## Further Reading
- See `/src/auth/` for all authentication logic.
- See `/db/api-migrations/002.do.auth-init.sql` for the sessions table schema.

---

**Legacy Lucia/D1 instructions have been removed.**
