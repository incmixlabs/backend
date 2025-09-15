import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import type { Database, Label } from "@incmix-api/utils/db-schema"
import { BadRequestError, ServerError } from "@incmix-api/utils/errors"
import { errorResponseSchema, getDb } from "@incmix-api/utils/fastify-bootstrap"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { FastifyInstance } from "fastify"
import { getUserProjectIds } from "../lib/db"
import {
  LabelWithTimeStampsSchema,
  PullLabelsQuerySchema,
  PushLabelsBodySchema,
} from "./schema"
import { LabelSchemaWithTimeStamps, type LabelWithTimeStamps } from "./types"

export const setupLabelsRoutes = (app: FastifyInstance) => {
  // Pull labels endpoint
  app.post(
    "/labels/pull",
    {
      schema: {
        description: "Pull labels for sync",
        tags: ["labels"],
        querystring: PullLabelsQuerySchema,
        response: {
          200: {
            type: "object",
            properties: {
              documents: {
                type: "array",
                items: LabelWithTimeStampsSchema,
              },
              checkpoint: {
                type: "object",
                properties: {
                  updatedAt: { type: "number" },
                },
              },
            },
          },
          401: { ...errorResponseSchema },
          500: {
            ...errorResponseSchema,
          },
          400: {
            ...errorResponseSchema,
          },
          409: {
            ...errorResponseSchema,
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
          return reply.code(401).send({ message: msg, success: false })
        }
        const { lastPulledAt } = request.query as { lastPulledAt?: string }
        let lastPulledAtDate = new Date(0)
        if (lastPulledAt !== undefined) {
          const ms = Number(lastPulledAt)
          if (!Number.isFinite(ms)) {
            return reply
              .code(400)
              .send({ message: "Invalid lastPulledAt", success: false })
          }
          lastPulledAtDate = new Date(ms)
        }

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

        // Query builder to get user's labels from projects they're members of
        const query = db
          .selectFrom("labels")
          .innerJoin("userProfiles as up", "labels.createdBy", "up.id")
          .innerJoin("userProfiles as up2", "labels.updatedBy", "up2.id")
          .select([
            "labels.id",
            "labels.projectId",
            "labels.type",
            "labels.name",
            "labels.description",
            "labels.color",
            "labels.order",
            "labels.createdAt",
            "labels.updatedAt",
            "labels.createdBy",
            "labels.updatedBy",
            "up.fullName as createdByName",
            "up.avatar as createdByImage",
            "up2.fullName as updatedByName",
            "up2.avatar as updatedByImage",
          ])
          .where((eb) => {
            const ands = [eb("labels.projectId", "in", projectIds)]
            if (lastPulledAt) {
              ands.push(eb("labels.updatedAt", ">=", lastPulledAtDate))
            }
            return eb.and(ands)
          })

        // Execute the query
        const labels = await query.execute()

        const results = LabelSchemaWithTimeStamps.array().safeParse(
          labels.map(
            (label) =>
              ({
                id: label.id,
                projectId: label.projectId,
                type: label.type,
                name: label.name,
                description: label.description,
                color: label.color,
                order: label.order,
                createdBy: {
                  id: label.createdBy,
                  name: label.createdByName,
                  image: label.createdByImage ?? undefined,
                },
                updatedBy: {
                  id: label.updatedBy,
                  name: label.updatedByName,
                  image: label.updatedByImage ?? undefined,
                },
                createdAt: new Date(label.createdAt).getTime(),
                updatedAt: new Date(label.updatedAt).getTime(),
              }) satisfies LabelWithTimeStamps
          )
        )

        if (!results.success) {
          throw new ServerError("Invalid labels")
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
        let message = "Failed to sync labels"
        if (error instanceof Error) message = error.message

        return reply.code(500).send({
          message,
          success: false,
        })
      }
    }
  )

  // Push labels endpoint
  app.post(
    "/labels/push",
    {
      schema: {
        description: "Push labels for sync",
        tags: ["labels"],
        body: PushLabelsBodySchema,
        response: {
          500: {
            ...errorResponseSchema,
          },
          401: { ...errorResponseSchema },
          409: {
            type: "array",
            items: LabelWithTimeStampsSchema,
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
          return reply.code(401).send({ message: msg, success: false })
        }

        // Get change rows from the client
        const { changeRows } = request.body as { changeRows: any[] }

        // Validate incoming data
        if (!Array.isArray(changeRows)) {
          throw new BadRequestError(
            "Invalid request format: expected an array of changed rows"
          )
        }

        const db = getDb<Database>(request)
        const conflicts = []
        const event = {
          documents: [] as Label[],
          checkpoint: null as { id: string; updatedAt: Date } | null,
        }

        // Process each change row
        for (const changeRow of changeRows) {
          // Ensure the document belongs to the user or is assigned to them
          const newDoc = changeRow.newDocumentState

          if (!newDoc || !newDoc.id) {
            conflicts.push({
              error: "Invalid document format: missing id",
              document: newDoc,
            })
            continue
          }

          // Get the real current state from the database
          const realMasterState = await db
            .selectFrom("labels")
            .innerJoin(
              "projectMembers",
              "labels.projectId",
              "projectMembers.projectId"
            )
            .select([
              "labels.id",
              "labels.projectId",
              "labels.type",
              "labels.name",
              "labels.color",
              "labels.order",
              "labels.description",
              "labels.createdAt",
              "labels.updatedAt",
              "labels.createdBy",
              "labels.updatedBy",
            ])
            .where((eb) =>
              eb.and([
                eb("labels.id", "=", newDoc.id),
                eb("projectMembers.userId", "=", user.id),
              ])
            )
            .executeTakeFirst()

          // Check if the user has permission to modify this label
          if (realMasterState && realMasterState.createdBy !== user.id) {
            conflicts.push({
              error: "Unauthorized to modify this label",
              document: newDoc,
            })
            continue
          }

          // Detect conflicts by comparing the assumed master state with the real master state
          if (
            (realMasterState && !changeRow.assumedMasterState) ||
            (realMasterState &&
              changeRow.assumedMasterState &&
              new Date(
                realMasterState.updatedAt as unknown as string
              ).getTime() > Number(changeRow.assumedMasterState.updatedAt))
          ) {
            // We have a conflict - return the current server state
            conflicts.push(realMasterState)
          } else {
            try {
              if (realMasterState) {
                // Update existing label
                const updatedLabel = await db
                  .updateTable("labels")
                  .set({
                    name: newDoc.name,
                    color: newDoc.color,
                    order: newDoc.order,
                    description: newDoc.description,
                    updatedAt: new Date(newDoc.updatedAt).toISOString(),
                    updatedBy: user.id,
                  })
                  .where("id", "=", newDoc.id)
                  .returningAll()
                  .executeTakeFirst()

                if (updatedLabel) {
                  event.documents.push(updatedLabel as unknown as Label)
                  event.checkpoint = {
                    id: updatedLabel.id,
                    updatedAt: updatedLabel.updatedAt,
                  }
                }
              } else {
                // Create new label - verify required fields
                if (
                  !newDoc.projectId ||
                  !newDoc.type ||
                  !newDoc.name ||
                  !newDoc.color
                ) {
                  conflicts.push({
                    error:
                      "Missing required fields: projectId, type, name and color are required",
                    document: newDoc,
                  })
                  continue
                }

                // Verify project exists and user is a member
                const projectMember = await db
                  .selectFrom("projectMembers")
                  .select("projectId")
                  .where((eb) =>
                    eb.and([
                      eb("projectId", "=", newDoc.projectId),
                      eb("userId", "=", user.id),
                    ])
                  )
                  .executeTakeFirst()

                if (!projectMember) {
                  conflicts.push({
                    error: "Project not found or user is not a member",
                    document: newDoc,
                  })
                  continue
                }

                // Insert new label
                const insertedLabel = await db
                  .insertInto("labels")
                  .values({
                    ...newDoc,
                    createdBy: user.id,
                    updatedBy: user.id,
                    createdAt: new Date(newDoc.createdAt).toISOString(),
                    updatedAt: new Date(newDoc.updatedAt).toISOString(),
                  })
                  .returningAll()
                  .executeTakeFirst()

                if (insertedLabel) {
                  event.documents.push(insertedLabel as unknown as Label)
                  event.checkpoint = {
                    id: insertedLabel.id,
                    updatedAt: insertedLabel.updatedAt,
                  }
                }
              }
            } catch (error) {
              conflicts.push({
                error: error instanceof Error ? error.message : "Unknown error",
                document: newDoc,
              })
            }
          }
        }

        // In a real-world scenario, you might have a push stream mechanism
        // that notifies other clients about changes
        // if (event.documents.length > 0) {
        //   myPullStream$.next(event);
        // }

        // Return conflicts to the client
        return reply.code(409).send(conflicts)
      } catch (error) {
        let message = "Failed to sync labels from client"
        if (error instanceof Error) message = error.message

        return reply.code(500).send({
          message,
          success: false,
        })
      }
    }
  )
}
