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
      "@incmix-api/utils/middleware": path.resolve(
        __dirname,
        "../../shared/utils/dist/src/middleware"
      ),
      "@incmix-api/utils": path.resolve(
        __dirname,
        "../../shared/utils/dist/src"
      ),
    },
  },
})
