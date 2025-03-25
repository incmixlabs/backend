import type { Database } from "@/db-schema"
import type { Kysely } from "kysely"

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<Database>): Promise<void> {
  await db
    .insertInto("locales")
    .values([
      {
        id: 1,
        langCode: "en",
        isDefault: true,
      },
      {
        id: 2,
        langCode: "pt",
        isDefault: false,
      },
    ])
    .execute()
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<Database>): Promise<void> {
  await db.deleteFrom("locales").where("id", ">", 0).execute()
}
