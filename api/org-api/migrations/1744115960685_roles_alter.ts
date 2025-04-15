import type { Kysely } from "kysely"
import { sql } from "kysely"

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("roles")
    .dropConstraint("roles_name_check")
    .execute()
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("roles")
    .addCheckConstraint(
      "roles_name_check",
      sql`name IN ('admin', 'owner', 'viewer', 'editor', 'commenter')`
    )
    .execute()
}
