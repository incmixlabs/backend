import type { Database } from "@/dbSchema"
import type { Kysely } from "kysely"

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<Database>): Promise<void> {
  await db.deleteFrom("userProfiles").execute()

  await db.schema
    .alterTable("userProfiles")
    .addColumn("companyName", "text", (col) => col.notNull())
    .addColumn("companySize", "text", (col) => col.notNull())
    .addColumn("teamSize", "text", (col) => col.notNull())
    .addColumn("purpose", "text", (col) => col.notNull())
    .addColumn("role", "text", (col) => col.notNull())
    .addColumn("manageFirst", "text", (col) => col.notNull())
    .addColumn("focusFirst", "text", (col) => col.notNull())
    .addColumn("referralSources", "jsonb", (col) => col.notNull())
    .addColumn("onboardingCompleted", "boolean", (col) =>
      col.notNull().defaultTo(false)
    )
    .execute()
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("userProfiles")
    .dropColumn("companyName")
    .dropColumn("companySize")
    .dropColumn("teamSize")
    .dropColumn("purpose")
    .dropColumn("role")
    .dropColumn("manageFirst")
    .dropColumn("focusFirst")
    .dropColumn("referralSources")
    .dropColumn("onboardingCompleted")
    .execute()
}
