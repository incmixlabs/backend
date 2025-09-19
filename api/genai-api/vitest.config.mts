import path from "node:path"
import { fileURLToPath } from "node:url"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    dir: "./test",
    setupFiles: [path.resolve(__dirname, "vitest.setup.ts")],
    testTimeout: 30000, // Set global timeout to 30 seconds
  },
  define: {
    "import.meta.vitest": false,
  },
})
