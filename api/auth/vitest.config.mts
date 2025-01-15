import path from "node:path"
import {
  defineWorkersProject,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config"
import {
  emailService,
  filesService,
  intlService,
  usersService,
} from "./test/mocks"

import tsconfigPaths from "vite-tsconfig-paths"
export default defineWorkersProject(async () => {
  // Read all migrations in the `migrations` directory
  const migrationsPath = path.join(__dirname, "migrations/d1")
  const migrations = await readD1Migrations(migrationsPath)

  return {
    plugins: [tsconfigPaths()],
    test: {
      dir: "./test",
      setupFiles: ["./test/apply-migrations.ts"],
      poolOptions: {
        workers: {
          singleWorker: true,
          main: "./src/index.ts",
          wrangler: {
            configPath: "./wrangler.toml",
            environment: "test",
          },
          miniflare: {
            bindings: { TEST_MIGRATIONS: migrations },
            serviceBindings: {
              EMAIL: emailService,
              INTL: intlService,
              FILES_API: filesService,
              USERS_API: usersService,
            },
          },
        },
      },
    },
  }
})
