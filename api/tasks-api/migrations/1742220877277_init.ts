import type { Database } from "@/dbSchema"
import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("tasks")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("content", "text")
    .addColumn("status", "text", (col) => col.notNull())
    .addColumn("taskOrder", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("projectId", "text", (col) => col.notNull())
    .addColumn("columnId", "text", (col) => col.notNull())
    .addColumn("assignedTo", "text", (col) => col.notNull())
    .addColumn("createdBy", "text", (col) => col.notNull())
    .addColumn("updatedBy", "text", (col) => col.notNull())
    .addColumn("createdAt", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute()

  await db.schema
    .createTable("columns")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("label", "text")
    .addColumn("columnOrder", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("projectId", "text", (col) => col.notNull())
    .addColumn("parentId", "text")
    .addColumn("createdBy", "text", (col) => col.notNull())
    .addColumn("updatedBy", "text", (col) => col.notNull())
    .addColumn("createdAt", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addUniqueConstraint("columns_label_projectId_unique", [
      "label",
      "projectId",
    ])
    .execute()

  await db.schema
    .createTable("projects")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("name", "text")
    .addColumn("orgId", "text", (col) => col.notNull())
    .addColumn("createdBy", "text", (col) => col.notNull())
    .addColumn("updatedBy", "text", (col) => col.notNull())
    .addColumn("createdAt", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("updatedAt", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addUniqueConstraint("projects_name_orgId_unique", ["name", "orgId"])
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("tasks").execute()
  await db.schema.dropTable("columns").execute()
  await db.schema.dropTable("projects").execute()
}
