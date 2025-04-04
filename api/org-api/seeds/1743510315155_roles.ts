import type { Database } from "@/dbSchema"
import type { Kysely } from "kysely"

export async function seed(db: Kysely<Database>): Promise<void> {
  await db
    .insertInto("roles")
    .values([
      {
        id: 1,
        name: "admin",
      },
      {
        id: 2,
        name: "owner",
      },
      {
        id: 3,
        name: "viewer",
      },
      {
        id: 4,
        name: "editor",
      },
      {
        id: 5,
        name: "commenter",
      },
    ])
    .execute()
}
