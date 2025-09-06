process.env.NODE_ENV = "test"
process.env.DATABASE_URL = "postgresql://test:test@localhost/test_db"
process.env.SENTRY_DSN = "https://test@sentry.io/123456"
process.env.FRONTEND_URL = "http://localhost:3000"
process.env.DOMAIN = "http://localhost"
process.env.GOOGLE_CLIENT_ID = "test-google-client-id"
process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret"
process.env.REDIS_URL = "redis://localhost:6379"
process.env.AUTH_API_URL = "https://auth.production.com/api"
process.env.EMAIL_API_URL = "https://email.production.com/api"

console.log("AUTH_API_URL before import:", process.env.AUTH_API_URL)

import("./src/env-config/index.js").then(({ createEnvConfig }) => {
  console.log("AUTH_API_URL after import:", process.env.AUTH_API_URL)
  const env = createEnvConfig("bff")
  console.log("Result AUTH_API_URL:", env.AUTH_API_URL)
  console.log("Result EMAIL_API_URL:", env.EMAIL_API_URL)
})
