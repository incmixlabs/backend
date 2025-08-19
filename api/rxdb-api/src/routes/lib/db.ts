import type { Context } from "@/types"

export const getUserProjectIds = async (c: Context, userId: string) => {
  const db = c.get("db")
  const projects = await db
    .selectFrom("projectMembers")
    .select("projectId")
    .where("userId", "=", userId)
    .execute()
  return projects.map((p) => p.projectId)
}
