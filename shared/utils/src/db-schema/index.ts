import {
  CamelCasePlugin,
  DeduplicateJoinsPlugin,
  Kysely,
  ParseJSONResultsPlugin,
  PostgresDialect,
} from "kysely"
import pg from "pg"
const { Pool } = pg
import type { EmailTables } from "./email"
import type { FeatureFlagsTables } from "./feature-flags"
import type { GenAiTables } from "./gen-ai"
import type { IntlTables } from "./intl"
import type { OrgTables } from "./org"
import type { TasksTables } from "./tasks"
import type { UsersTables } from "./users"

export interface Database
  extends IntlTables,
    UsersTables,
    OrgTables,
    TasksTables,
    GenAiTables,
    EmailTables,
    FeatureFlagsTables {}

export type KyselyDb = Kysely<Database>

export function initDb(connectionString: string) {
  const dialect = new PostgresDialect({
    pool: new Pool({
      connectionString,
      max: 10,
    }),
  })

  return new Kysely<Database>({
    dialect,
    plugins: [
      new CamelCasePlugin(),
      new DeduplicateJoinsPlugin(),
      new ParseJSONResultsPlugin(),
    ],
  })
}

export * from "./email"
export * from "./feature-flags"
export * from "./gen-ai"
export * from "./intl"
export * from "./org"
export * from "./tasks"
export * from "./users"
