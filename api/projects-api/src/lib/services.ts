import type { FastifyRequest } from "fastify"

export function getOrganizationById(c: FastifyRequest, id: string) {
  return c.db
    ?.selectFrom("organisations")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
}
