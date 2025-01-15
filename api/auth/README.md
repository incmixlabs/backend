# Auth

```bash
pnpm install
pnpm run dev
npx wrangler d1 migrations apply lucia-auth -- apply schema locally first time
```

```bash
pnpm run deploy
```

## Docs

<https://developers.cloudflare.com/d1/get-started/>
<https://youtu.be/ZD2Lt5GFo48?t=844>
<https://github.com/andfadeev/cloudflare-hono-lucia-auth>
<https://developers.cloudflare.com/workers/wrangler/commands/>

1. npx wrangler d1 create lucia-auth
2. npx wrangler d1 migrations create lucia-auth init
3. npx wrangler d1 migrations create lucia-auth email-verifications
4. npx wrangler d1 migrations apply lucia-auth
5. npx wrangler d1 migrations apply lucia-auth --remote
6. npx wrangler d1 execute lucia-auth --local --file=./migrations/d1/0001_down.sql
7. npx wrangler d1 execute lucia-auth --remote --file=./migrations/d1/0001_down.sql

```bash
npx wrangler d1 delete lucia-auth
npx wrangler d1 delete lucia-auth --remote
npx wrangler d1 execute lucia-auth --local --command="SELECT _ FROM users"
npx wrangler d1 execute lucia-auth --remote --command="SELECT _ FROM users"
```
