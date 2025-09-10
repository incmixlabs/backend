import path from "path"
import { fileURLToPath } from "url"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Set NODE_ENV before any imports
process.env.NODE_ENV = "test"

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@test": path.resolve(__dirname, "./test"),
      // Redirect env-vars import to test environment
      "@/env-vars": path.resolve(__dirname, "./test/utils/test-env.ts"),
    },
  },
  test: {
    dir: "./test/integration",
    setupFiles: ["./test/utils/setup.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://postgres:password@localhost:54322/incmix",
      FRONTEND_URL: "http://localhost:1420",
    },
    testTimeout: 60000, // 60 seconds for integration tests
    hookTimeout: 120000, // 2 minutes for setup (testcontainers)
    teardownTimeout: 30000,
    pool: "forks", // Use separate processes for each test file
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork to avoid port conflicts
      },
    },
  },
})
