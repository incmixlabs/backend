# Todo API

```bash
pnpm install
pnpm run dev
# Apply schema locally (first run)
npx wrangler d1 migrations apply tasks-api
```

```bash
pnpm run deploy
```

## Docs

1. npx wrangler d1 create tasks-api
2. npx wrangler d1 migrations create tasks-api init
3. npx wrangler d1 migrations create tasks-api email-verifications
4. npx wrangler d1 migrations apply tasks-api
5. npx wrangler d1 migrations apply tasks-api --remote

```bash
npx wrangler d1 delete tasks-api
npx wrangler d1 delete tasks-api --remote
```
