import type { Database } from "@/dbSchema"
import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("roles")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "text", (col) =>
      col
        .notNull()
        .unique()
        .check(sql`name IN ('admin', 'owner', 'viewer', 'editor', 'commenter')`)
    )
    .execute()

  await db.schema
    .createTable("permissions")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("roleId", "integer", (col) => col.notNull())
    .addColumn("action", "text", (col) => col.notNull())
    .addColumn("subject", "text", (col) => col.notNull())
    .addColumn("conditions", "text")
    .execute()

  await db.schema
    .createTable("organisations")
    .addColumn("id", "text", (col) => col.primaryKey().notNull())
    .addColumn("name", "text", (col) => col.notNull().unique())
    .addColumn("handle", "text", (col) => col.notNull().unique())
    .execute()

  await db.schema
    .createTable("members")
    .addColumn("userId", "text", (col) => col.notNull())
    .addColumn("orgId", "text", (col) => col.notNull())
    .addColumn("roleId", "integer", (col) => col.notNull())
    .addPrimaryKeyConstraint("members_pkey", ["userId", "orgId"])
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("members").execute()
  await db.schema.dropTable("organisations").execute()
  await db.schema.dropTable("permissions").execute()
  await db.schema.dropTable("roles").execute()
}
