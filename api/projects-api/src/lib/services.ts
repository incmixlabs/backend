import type { Context } from "@/types"

export function getOrgById(c: Context, id: string) {
  return c.db
    .selectFrom("organisations")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
}
