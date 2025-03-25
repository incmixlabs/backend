import type { Kysely } from "kysely"

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
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

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom("roles").where("id", ">", 0).execute()
}
