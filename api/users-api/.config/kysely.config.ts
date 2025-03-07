import { CamelCasePlugin } from "kysely"
import { defineConfig } from "kysely-ctl"
import { Pool } from "pg"

export default defineConfig({
  dialect: "pg",
  dialectConfig: {
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    }),
  },
  migrations: {
    migrationFolder: "migrations",
  },
  plugins: [new CamelCasePlugin()],
  //   seeds: {
  //     seedFolder: "seeds",
  //   }
})
