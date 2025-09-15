import type { Database } from "@incmix-api/utils/db-schema"
import { getDb } from "@incmix-api/utils/fastify-bootstrap"
import type { FastifyRequest } from "fastify"

export const getUserProjectIds = async (
  request: FastifyRequest,
  userId: string
) => {
  const db = getDb<Database>(request)
  const projects = await db
    .selectFrom("projectMembers")
    .select("projectId")
    .where("userId", "=", userId)
    .execute()
  return projects.map((p) => p.projectId)
}
