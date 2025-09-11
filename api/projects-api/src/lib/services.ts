import type { Context } from "@/types"

export function getorgById(c: Context, id: string) {
  return c
    .get("db")
    .selectFrom("organisations")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
}
