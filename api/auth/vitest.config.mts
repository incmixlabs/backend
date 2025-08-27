import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

// Don't manually load .env files here - let createEnvConfig handle it
// This ensures proper loading order: root .env -> root .env.test -> service .env -> service .env.test

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
    },
  },
})
