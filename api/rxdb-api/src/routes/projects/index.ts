import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import type { Database } from "@incmix-api/utils/db-schema"
import { ServerError } from "@incmix-api/utils/errors"
import { getDb } from "@incmix-api/utils/fastify-bootstrap"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { FastifyInstance } from "fastify"
import { getUserProjectIds } from "../lib/db"
import { ProjectWithTimeStampsSchema, PullProjectsQuerySchema } from "./schema"
import {
  ProjectSchemaWithTimeStamps,
  type ProjectWithTimeStamps,
} from "./types"

export const setupProjectsRoutes = async (app: FastifyInstance) => {
  // Pull projects endpoint
  app.post(
    "/projects/pull",
    {
      schema: {
        description: "Pull projects for sync",
        tags: ["projects"],
        querystring: PullProjectsQuerySchema,
        response: {
          200: {
            type: "object",
            properties: {
              documents: {
                type: "array",
                items: ProjectWithTimeStampsSchema,
              },
              checkpoint: {
                type: "object",
                properties: {
                  updatedAt: { type: "number" },
                },
              },
            },
          },
          500: {
            type: "object",
            properties: {
              message: { type: "string" },
              success: { type: "boolean" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const t = await useTranslation(request as any)

        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new Error(msg)
        }

        // Get lastPulledAt timestamp to pull only new/updated projects
        const { lastPulledAt } = request.query as { lastPulledAt?: string }
        // Convert lastPulledAt string to a valid date if it exists
        const lastPulledAtDate = lastPulledAt
          ? new Date(Number(lastPulledAt))
          : new Date(0)

        const projectIds = await getUserProjectIds(request as any, user.id)

        // Guard against empty projectIds array to avoid "IN ()" SQL predicate
        if (!projectIds || projectIds.length === 0) {
          // Return empty result without executing DB query or advancing checkpoint
          return reply.code(200).send({
            documents: [],
            checkpoint: {
              updatedAt: Date.now(),
            },
          })
        }

        const db = getDb<Database>(request)

        // Query builder to get user's projects
        const query = db
          .selectFrom("projects")
          .innerJoin("userProfiles as up", "projects.createdBy", "up.id")
          .innerJoin("userProfiles as up2", "projects.updatedBy", "up2.id")
          .select([
            "projects.id",
            "projects.name",
            "projects.description",
            "projects.orgId",
            "projects.company",
            "projects.logo",
            "projects.status",
            "projects.budget",
            "projects.startDate",
            "projects.endDate",
            "projects.createdAt",
            "projects.updatedAt",
            "projects.createdBy",
            "projects.updatedBy",
            "up.fullName as createdByName",
            "up.avatar as createdByImage",
            "up2.fullName as updatedByName",
            "up2.avatar as updatedByImage",
          ])
          .where((eb) => {
            const ands = [eb("projects.id", "in", projectIds)]
            if (lastPulledAt) {
              ands.push(eb("projects.updatedAt", ">=", lastPulledAtDate))
            }
            return eb.and(ands)
          })

        // Execute the query
        const projects = await query.execute()

        const results = ProjectSchemaWithTimeStamps.array().safeParse(
          projects.map(
            (project) =>
              ({
                id: project.id,
                name: project.name,
                description: project.description,
                orgId: project.orgId,
                company: project.company,
                logo: project.logo,
                status: project.status,
                budget: project.budget,
                startDate: project.startDate
                  ? new Date(project.startDate).getTime()
                  : null,
                endDate: project.endDate
                  ? new Date(project.endDate).getTime()
                  : null,
                createdBy: {
                  id: project.createdBy,
                  name: project.createdByName,
                  image: project.createdByImage ?? undefined,
                },
                updatedBy: {
                  id: project.updatedBy,
                  name: project.updatedByName,
                  image: project.updatedByImage ?? undefined,
                },
                createdAt: new Date(project.createdAt).getTime(),
                updatedAt: new Date(project.updatedAt).getTime(),
              }) satisfies ProjectWithTimeStamps
          )
        )

        if (!results.success) {
          throw new ServerError("Invalid projects")
        }

        // Format for RxDB sync protocol
        // RxDB expects a specific format with documents and an optional checkpoint
        return reply.code(200).send({
          documents: results.data,
          checkpoint: {
            updatedAt: Date.now(),
          },
        })
      } catch (error) {
        let message = "Failed to sync projects"
        if (error instanceof Error) message = error.message

        return reply.code(500).send({
          message,
          success: false,
        })
      }
    }
  )
}
