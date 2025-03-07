import type { Database } from "@/db-schema"
import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("locales")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("langCode", "text", (col) => col.notNull().unique())
    .addColumn("isDefault", "boolean", (col) => col.defaultTo(false))
    .execute()

  await db.schema
    .createTable("translations")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("localeId", "integer", (col) => col.notNull())
    .addColumn("key", "text", (col) => col.notNull())
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("type", "text", (col) =>
      col.notNull().defaultTo("label").check(sql`type IN ('frag', 'label')`)
    )
    .addColumn("namespace", "text", (col) => col.notNull())
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("translations").execute()
  await db.schema.dropTable("locales").execute()
}
