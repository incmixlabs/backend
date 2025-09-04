import type { Context } from "@/types"

export function getOrganizationById(c: Context, id: string) {
  return c
    .get("db")
    .selectFrom("orgs")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
}
