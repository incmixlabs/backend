import type { Database } from "@/dbSchema"
import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("emailQueue")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("recipient", "text", (col) => col.notNull())
    .addColumn("template", "text", (col) => col.notNull())
    .addColumn("payload", "text", (col) => col.notNull())
    .addColumn("status", "text", (col) =>
      col
        .notNull()
        .defaultTo("pending")
        .check(sql`status IN ('pending', 'delivered', 'failed')`)
    )
    .addColumn("sgId", "text")
    .addColumn("shouldRetry", "boolean", (col) =>
      col.notNull().defaultTo(false)
    )
    .addColumn("sendgridData", "text")
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("emailQueue").execute()
}
