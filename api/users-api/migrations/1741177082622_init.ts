import type { Database } from "@/dbSchema"
import type { Kysely } from "kysely"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("userProfiles")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("fullName", "text", (col) => col.notNull())
    .addColumn("profileImage", "text")
    .addColumn("localeId", "integer", (col) => col.notNull())
    .addColumn("avatar", "text")
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("userProfiles").execute()
}
