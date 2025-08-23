import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@": "/Users/umam3/projects/venturaz/incmix/backend/api/auth/src",
      "@test": "/Users/umam3/projects/venturaz/incmix/backend/api/auth/test",
    },
  },
  test: {
    dir: "./test",
    setupFiles: ["./test/setup.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://postgres:password@localhost:54321/incmix",
      GOOGLE_CLIENT_ID: "test-google-client-id",
      GOOGLE_CLIENT_SECRET: "test-google-client-secret",
      FRONTEND_URL: "http://localhost:1472",
      GOOGLE_REDIRECT_URL: "http://localhost:1472/auth/google/callback",
      COOKIE_NAME: "test_session",
      DOMAIN: "localhost",
      EMAIL_API_URL: "http://localhost:8787/api/email",
      INTL_API_URL: "http://localhost:8787/api/intl",
      USERS_API_URL: "http://localhost:8787/api/users",
    },
  },
})
