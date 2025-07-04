import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { zValidator } from "@hono/zod-validator"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  BadRequestError,
  UnauthorizedError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { Task } from "@incmix/utils/types"
import { jsonArrayFrom } from "kysely/helpers/postgres"
import { PullTasksSchema, PushTasksSchema } from "./types"

const tasksRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

tasksRoutes.post("/pull", zValidator("query", PullTasksSchema), async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)

    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new Error(msg)
    }

    // Get lastPulledAt timestamp to pull only new/updated tasks
    const { lastPulledAt } = c.req.valid("query")
    // Convert lastPulledAt string to a valid date if it exists
    const lastPulledAtDate = lastPulledAt
      ? new Date(Number(lastPulledAt))
      : new Date(0)

    // Query builder to get user's tasks
    let query = c
      .get("db")
      .selectFrom("tasks")
      .innerJoin("taskAssignments", "tasks.id", "taskAssignments.taskId")
      .selectAll()
      .where("taskAssignments.userId", "=", user.id)

    // If lastPulledAt is provided, only get tasks updated since then
    if (lastPulledAt) {
      query = query.where("updatedAt", ">=", lastPulledAtDate)
    }

    // Execute the query
    const tasks = await query.execute()

    // Format for RxDB sync protocol
    // RxDB expects a specific format with documents and an optional checkpoint
    return c.json(
      {
        documents: tasks,
        checkpoint: {
          updatedAt: new Date().getTime(),
        },
      },
      200
    )
  } catch (error) {
    let message = "Failed to sync tasks"
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

tasksRoutes.post("/push", zValidator("json", PushTasksSchema), async (c) => {
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
      documents: [] as Task[],
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
        .selectFrom("tasks")
        .select((eb) => [
          "tasks.id",
          "tasks.name",
          "tasks.description",
          "tasks.completed",
          "tasks.createdAt",
          "tasks.createdBy",
          "tasks.projectId",
          "tasks.updatedAt",
          "tasks.updatedBy",
          "tasks.statusId",
          "tasks.priorityId",
          "tasks.taskOrder",
          "tasks.startDate",
          "tasks.endDate",
          "tasks.acceptanceCriteria",
          "tasks.labelsTags",
          "tasks.refUrls",
          "tasks.attachments",
          "tasks.checklist",
          jsonArrayFrom(
            eb
              .selectFrom("taskAssignments")
              .innerJoin(
                "userProfiles as up",
                "taskAssignments.userId",
                "up.id"
              )
              .select(["up.id", "up.fullName as name", "up.avatar as image"])
              .whereRef("taskAssignments.taskId", "=", "tasks.id")
          ).as("assignedTo"),
        ])
        .where("id", "=", newDoc.id)
        .executeTakeFirst()

      // Check if the user has permission to modify this task
      if (
        realMasterState?.assignedTo.some((a) => a.id !== user.id) &&
        realMasterState.createdBy !== user.id
      ) {
        conflicts.push({
          error: "Unauthorized to modify this task",
          document: realMasterState,
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
            // Update existing task
            const updatedTask = await c
              .get("db")
              .updateTable("tasks")
              .set({
                name: newDoc.name,
                description: newDoc.description,
                completed: newDoc.completed,
                taskOrder: newDoc.taskOrder,
                projectId: newDoc.projectId,
                statusId: newDoc.statusId,
                priorityId: newDoc.priorityId,
                startDate: newDoc.startDate
                  ? new Date(newDoc.startDate).toISOString()
                  : null,
                endDate: newDoc.endDate
                  ? new Date(newDoc.endDate).toISOString()
                  : null,
                acceptanceCriteria: JSON.stringify(newDoc.acceptanceCriteria),
                labelsTags: JSON.stringify(newDoc.labelsTags),
                refUrls: JSON.stringify(newDoc.refUrls),
                attachments: JSON.stringify(newDoc.attachments),
                checklist: JSON.stringify(newDoc.checklist),
                updatedAt: new Date().toISOString(),
                updatedBy: user.id,
              })
              .where("id", "=", newDoc.id)
              .returningAll()
              .executeTakeFirst()

            if (updatedTask) {
              event.documents.push(updatedTask as unknown as Task)
              event.checkpoint = {
                id: updatedTask.id,
                updatedAt: updatedTask.updatedAt,
              }
            }
          } else {
            // Create new task - verify required fields
            if (!newDoc.statusId || !newDoc.priorityId || !newDoc.projectId) {
              conflicts.push({
                error:
                  "Missing required fields: statusId, priorityId and projectId are required",
                document: newDoc,
              })
              continue
            }

            // Verify project and column exist
            const project = await c
              .get("db")
              .selectFrom("projects")
              .select("id")
              .where("id", "=", newDoc.projectId)
              .executeTakeFirst()

            if (!project) {
              conflicts.push({
                error: "Project not found",
                document: newDoc,
              })
              continue
            }

            const status = await c
              .get("db")
              .selectFrom("labels")
              .select("id")
              .where("id", "=", newDoc.statusId)
              .executeTakeFirst()

            if (!status) {
              conflicts.push({
                error: "Status not found",
                document: newDoc,
              })
              continue
            }

            // Insert new task
            const insertedTask = await c
              .get("db")
              .insertInto("tasks")
              .values({
                ...newDoc,
                createdBy: user.id,
                updatedBy: user.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                acceptanceCriteria: JSON.stringify(newDoc.acceptanceCriteria),
                labelsTags: JSON.stringify(newDoc.labelsTags),
                refUrls: JSON.stringify(newDoc.refUrls),
                attachments: JSON.stringify(newDoc.attachments),
                checklist: JSON.stringify(newDoc.checklist),
                startDate: newDoc.startDate
                  ? new Date(newDoc.startDate).toISOString()
                  : null,
                endDate: newDoc.endDate
                  ? new Date(newDoc.endDate).toISOString()
                  : null,
              })
              .returningAll()
              .executeTakeFirst()

            if (insertedTask) {
              event.documents.push(insertedTask as unknown as Task)
              event.checkpoint = {
                id: insertedTask.id,
                updatedAt: insertedTask.updatedAt,
              }
              if (newDoc.assignedTo) {
                await c
                  .get("db")
                  .insertInto("taskAssignments")
                  .values(
                    newDoc.assignedTo.map((a) => ({
                      taskId: insertedTask.id,
                      userId: a.id,
                    }))
                  )
                  .execute()
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
    let message = "Failed to sync tasks from client"
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

export default tasksRoutes
