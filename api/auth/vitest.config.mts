import * as dotenv from "dotenv"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

// Load test environment variables from .env.test
dotenv.config({ path: ".env.test" })

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
      ...process.env,
    },
  },
})
