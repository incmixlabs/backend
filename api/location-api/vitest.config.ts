import path from "node:path"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.test.ts",
        "**/*.config.ts",
        "**/types.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@incmix-api/utils": path.resolve(
        __dirname,
        "../../shared/utils/src/utils"
      ),
      "@incmix-api/utils/middleware": path.resolve(
        __dirname,
        "../../shared/utils/src/middleware"
      ),
      "@incmix-api/utils/authorization": path.resolve(
        __dirname,
        "../../shared/utils/src/authorization"
      ),
      "@incmix-api/utils/errors": path.resolve(
        __dirname,
        "../../shared/utils/src/errors"
      ),
      "@incmix-api/utils/kv-store": path.resolve(
        __dirname,
        "../../shared/utils/src/kv-store"
      ),
      "@incmix-api/utils/types": path.resolve(
        __dirname,
        "../../shared/utils/src/types"
      ),
      "@incmix-api/utils/db-schema": path.resolve(
        __dirname,
        "../../shared/utils/src/db-schema"
      ),
      "@incmix-api/utils/zod-schema": path.resolve(
        __dirname,
        "../../shared/utils/src/zod-schema"
      ),
      "@incmix-api/utils/queue": path.resolve(
        __dirname,
        "../../shared/utils/src/bullmq"
      ),
      "@incmix-api/utils/env-config": path.resolve(
        __dirname,
        "../../shared/utils/src/env-config"
      ),
      "@incmix-api/utils/service-bootstrap": path.resolve(
        __dirname,
        "../../shared/utils/src/service-bootstrap"
      ),
      "@incmix-api/utils/ajv-schema": path.resolve(
        __dirname,
        "../../shared/utils/src/ajv-schema"
      ),
      "@incmix-api/utils/fastify-middleware": path.resolve(
        __dirname,
        "../../shared/utils/src/fastify-middleware"
      ),
      "@incmix-api/utils/fastify-bootstrap": path.resolve(
        __dirname,
        "../../shared/utils/src/fastify-bootstrap"
      ),
      "@incmix-api/utils/db-operations": path.resolve(
        __dirname,
        "../../shared/utils/src/db-operations"
      ),
      "@incmix-api/utils/audit": path.resolve(
        __dirname,
        "../../shared/utils/src/audit"
      ),
      "@incmix-api/utils/fastify-middleware/auth": path.resolve(
        __dirname,
        "../../shared/utils/src/fastify-middleware/auth"
      ),
      "@incmix-api/utils/fastify-middleware/rbac": path.resolve(
        __dirname,
        "../../shared/utils/src/fastify-middleware/rbac"
      ),
    },
  },
})
