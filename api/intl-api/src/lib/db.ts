import type { Database } from "@/db-schema"
import type { Context } from "@/types"
import { D1Dialect } from "@noxharmonium/kysely-d1"
import { CamelCasePlugin, Kysely } from "kysely"

export function getDatabase(c: Context) {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: c.env.DB }),
    plugins: [new CamelCasePlugin()],
  })
}
