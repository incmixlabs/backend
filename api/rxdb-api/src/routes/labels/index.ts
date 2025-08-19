import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { zValidator } from "@hono/zod-validator"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import type { Label } from "@incmix-api/utils/db-schema"
import {
  BadRequestError,
  ServerError,
  UnauthorizedError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { getUserProjectIds } from "../lib/db"
import {
  LabelSchemaWithTimeStamps,
  type LabelWithTimeStamps,
  PullLabelsSchema,
  PushLabelsSchema,
} from "./types"

const labelsRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

labelsRoutes.post("/pull", zValidator("query", PullLabelsSchema), async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)

    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new Error(msg)
    }

    // Get lastPulledAt timestamp to pull only new/updated labels
    const { lastPulledAt } = c.req.valid("query")
    // Convert lastPulledAt string to a valid date if it exists
    const lastPulledAtDate = lastPulledAt
      ? new Date(Number(lastPulledAt))
      : new Date(0)

    const projectIds = await getUserProjectIds(c, user.id)

    // Guard against empty projectIds array to avoid "IN ()" SQL predicate
    if (!projectIds || projectIds.length === 0) {
      // Return empty result without executing DB query or advancing checkpoint
      return c.json(
        {
          documents: [],
          checkpoint: {
            updatedAt: new Date().getTime(),
          },
        },
        200
      )
    }

    // Query builder to get user's labels from projects they're members of
    const query = c
      .get("db")
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
            ...label,
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
    return c.json(
      {
        documents: results.data,
        checkpoint: {
          updatedAt: new Date().getTime(),
        },
      },
      200
    )
  } catch (error) {
    let message = "Failed to sync labels"
    if (error instanceof Error) message = error.message

    return c.json(
      {
        message,
        success: false,
      },
      500
    )
  }
})

labelsRoutes.post("/push", zValidator("json", PushLabelsSchema), async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)

    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    // Get change rows from the client
    const { changeRows } = c.req.valid("json")

    // Validate incoming data
    if (!Array.isArray(changeRows)) {
      throw new BadRequestError(
        "Invalid request format: expected an array of changed rows"
      )
    }

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
      const realMasterState = await c
        .get("db")
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
        .where("labels.id", "=", newDoc.id)
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
          realMasterState.updatedAt >
            new Date(changeRow.assumedMasterState.updatedAt))
      ) {
        // We have a conflict - return the current server state
        conflicts.push(realMasterState)
      } else {
        try {
          if (realMasterState) {
            // Update existing label
            const updatedLabel = await c
              .get("db")
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
            const projectMember = await c
              .get("db")
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
            const insertedLabel = await c
              .get("db")
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
    return c.json(conflicts, 200)
  } catch (error) {
    let message = "Failed to sync labels from client"
    if (error instanceof Error) message = error.message

    return c.json(
      {
        message,
        success: false,
      },
      500
    )
  }
})

export default labelsRoutes
