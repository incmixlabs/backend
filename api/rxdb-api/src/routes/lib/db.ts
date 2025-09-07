import type { FastifyRequest } from "fastify"

export const getUserProjectIds = async (
  request: FastifyRequest,
  userId: string
) => {
  const db = request.db
  if (!db) throw new Error("Database not available")

  const projects = await db
    .selectFrom("projectMembers")
    .select("projectId")
    .where("userId", "=", userId)
    .execute()
  return projects.map((p) => p.projectId)
}
