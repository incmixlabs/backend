import type { Database } from "@/dbSchema"
import type { Kysely } from "kysely"
import { sql } from "kysely"

export async function up(db: Kysely<Database>): Promise<void> {
  // Insert permissions for admin role
  await db
    .insertInto("permissions")
    .values([
      {
        roleId: 1,
        action: "create",
        subject: "Organisation",
        conditions: sql`null`,
      },
      {
        roleId: 1,
        action: "read",
        subject: "Organisation",
        conditions: sql`null`,
      },
      {
        roleId: 1,
        action: "update",
        subject: "Organisation",
        conditions: sql`null`,
      },
      {
        roleId: 1,
        action: "delete",
        subject: "Organisation",
        conditions: sql`null`,
      },
      { roleId: 1, action: "manage", subject: "Member", conditions: sql`null` },
    ])
    .execute()

  // Insert permissions for owner role
  await db
    .insertInto("permissions")
    .values([
      {
        roleId: 2,
        action: "create",
        subject: "Organisation",
        conditions: sql`null`,
      },
      {
        roleId: 2,
        action: "read",
        subject: "Organisation",
        conditions: sql`null`,
      },
      {
        roleId: 2,
        action: "update",
        subject: "Organisation",
        conditions: sql`null`,
      },
      {
        roleId: 2,
        action: "delete",
        subject: "Organisation",
        conditions: sql`null`,
      },
      { roleId: 2, action: "manage", subject: "Member", conditions: sql`null` },
    ])
    .execute()

  // Insert permissions for viewer role
  await db
    .insertInto("permissions")
    .values([
      {
        roleId: 3,
        action: "read",
        subject: "Organisation",
        conditions: sql`null`,
      },
    ])
    .execute()

  // Insert permissions for editor role
  await db
    .insertInto("permissions")
    .values([
      {
        roleId: 4,
        action: "read",
        subject: "Organisation",
        conditions: sql`null`,
      },
    ])
    .execute()

  // Insert permissions for commenter role
  await db
    .insertInto("permissions")
    .values([
      {
        roleId: 5,
        action: "read",
        subject: "Organisation",
        conditions: sql`null`,
      },
    ])
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.deleteFrom("permissions").where("roleId", ">", 0).execute()
}
