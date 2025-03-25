import type { Database } from "@/db-schema"
import { envVars } from "@/env-vars"
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely"
import pg from "pg"

const dialect = new PostgresDialect({
  pool: new pg.Pool({
    connectionString: envVars.DATABASE_URL,
    max: 10,
  }),
})
export const db = new Kysely<Database>({
  dialect,
  plugins: [new CamelCasePlugin()],
})
