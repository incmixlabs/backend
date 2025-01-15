import { defineWorkersProject } from "@cloudflare/vitest-pool-workers/config"
import tsconfigPaths from "vite-tsconfig-paths"
import { authService, intlService } from "./test/mocks"

export default defineWorkersProject(() => {
  const R2_ACCESS_KEY_ID = "R2_ACCESS_KEY_ID"
  const R2_ENDPOINT = "R2_ENDPOINT"
  const R2_SECRET_ACCESS_KEY = "R2_SECRET_ACCESS_KEY"

  return {
    plugins: [tsconfigPaths()],
    test: {
      dir: "./test",

      poolOptions: {
        workers: {
          singleWorker: true,
          main: "./src/index.ts",
          wrangler: {
            configPath: "./wrangler.toml",
            environment: "test",
          },
          miniflare: {
            bindings: {
              R2_ACCESS_KEY_ID: R2_ACCESS_KEY_ID,
              R2_ENDPOINT: R2_ENDPOINT,
              R2_SECRET_ACCESS_KEY: R2_SECRET_ACCESS_KEY,
              PORT: 8282,
            },
            serviceBindings: {
              INTL: intlService,
              AUTH: authService,
            },
          },
        },
      },
    },
  }
})
