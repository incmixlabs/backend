import type { Database } from "@/dbSchema"
import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("users")
    .addColumn("id", "text", (col) => col.notNull().primaryKey())
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("hashedPassword", "text")
    .addColumn("emailVerified", "boolean", (col) => col.defaultTo(false))
    .addColumn("lastLoggedIn", "timestamptz", (col) =>
      col.defaultTo(sql`now()`)
    )
    .addColumn("isActive", "boolean", (col) => col.defaultTo(true))
    .addColumn("userType", "text", (col) =>
      col
        .notNull()
        .defaultTo("user")
        .check(sql`user_type IN ('super_admin', 'member', 'user')`)
    )
    .execute()

  await db.schema
    .createTable("sessions")
    .addColumn("id", "text", (col) => col.notNull().primaryKey())
    .addColumn("expiresAt", "timestamptz", (col) => col.notNull())
    .addColumn("userId", "text", (col) => col.notNull())
    .execute()

  await db.schema
    .createTable("verificationCodes")
    .addColumn("id", "serial", (col) => col.notNull().primaryKey())
    .addColumn("email", "text")
    .addColumn("userId", "text", (col) => col.unique())
    .addColumn("code", "text")
    .addColumn("expiresAt", "timestamptz")
    .addColumn("description", "text")
    .execute()

  await db.schema
    .createTable("accounts")
    .addColumn("accountId", "text")
    .addColumn("provider", "text")
    .addColumn("userId", "text")
    .addPrimaryKeyConstraint("accounts_primary_key", ["accountId", "userId"])
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("accounts").execute()
  await db.schema.dropTable("verificationCodes").execute()
  await db.schema.dropTable("sessions").execute()
  await db.schema.dropTable("users").execute()
}
