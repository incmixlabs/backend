import type { Database } from "@/dbSchema"
import type { Kysely } from "kysely"

export async function seed(db: Kysely<Database>): Promise<void> {
  await db
    .insertInto("roles")
    .values([
      {
        name: "admin",
      },
      {
        name: "owner",
      },
      {
        name: "viewer",
      },
      {
        name: "editor",
      },
      {
        name: "commenter",
      },
    ])
    .execute()
}
