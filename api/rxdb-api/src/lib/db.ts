import type { Database } from "@incmix-api/utils/db-schema"
import { getDb } from "@incmix-api/utils/fastify-bootstrap"
import type { FastifyRequest } from "fastify"

export function getProjectById(request: FastifyRequest, projectId: string) {
  const db = getDb<Database>(request)
  return db
    .selectFrom("projects")
    .selectAll()
    .where("id", "=", projectId)
    .executeTakeFirst()
}
