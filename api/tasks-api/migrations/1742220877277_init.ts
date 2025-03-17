import type { Database } from "@/dbSchema"
import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("tasks")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("content", "text")
    .addColumn("status", "text", (col) => col.notNull())
    .addColumn("task_order", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("project_id", "text", (col) => col.notNull())
    .addColumn("column_id", "text", (col) => col.notNull())
    .addColumn("assigned_to", "text", (col) => col.notNull())
    .addColumn("created_by", "text", (col) => col.notNull())
    .addColumn("updated_by", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute()

  await db.schema
    .createTable("columns")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("label", "text")
    .addColumn("column_order", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("project_id", "text", (col) => col.notNull())
    .addColumn("parent_id", "text")
    .addColumn("created_by", "text", (col) => col.notNull())
    .addColumn("updated_by", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addUniqueConstraint("columns_label_project_id_unique", [
      "label",
      "project_id",
    ])
    .execute()

  await db.schema
    .createTable("projects")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("name", "text")
    .addColumn("org_id", "text", (col) => col.notNull())
    .addColumn("created_by", "text", (col) => col.notNull())
    .addColumn("updated_by", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addUniqueConstraint("projects_name_org_id_unique", ["name", "org_id"])
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("tasks").execute()
  await db.schema.dropTable("columns").execute()
  await db.schema.dropTable("projects").execute()
}
