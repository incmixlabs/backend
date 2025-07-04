import type { Context } from "@/types"

export function getProjectById(c: Context, projectId: string) {
  return c
    .get("db")
    .selectFrom("projects")
    .selectAll()
    .where("id", "=", projectId)
    .executeTakeFirst()
}
