import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { zValidator } from "@hono/zod-validator"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  BadRequestError,
  ServerError,
  UnauthorizedError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { Task } from "@incmix-api/utils/zod-schema"
import { jsonArrayFrom } from "kysely/helpers/postgres"
import { getUserProjectIds } from "../lib/db"
import {
  PullTasksSchema,
  PushTasksSchema,
  TaskSchemaWithTimeStamps,
  type TaskWithTimeStamps,
} from "./types"

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

    // Query builder to get user's tasks
    const query = c
      .get("db")
      .selectFrom("tasks")
      .innerJoin("userProfiles as up", "tasks.createdBy", "up.id")
      .innerJoin("userProfiles as up2", "tasks.updatedBy", "up2.id")
      .select((eb) => [
        "tasks.id",
        "tasks.name",
        "tasks.description",
        "tasks.completed",
        "tasks.createdAt",
        "tasks.createdBy",
        "tasks.updatedBy",
        "up.fullName as createdByName",
        "up.avatar as createdByImage",
        "tasks.projectId",
        "tasks.updatedAt",
        "up2.fullName as updatedByName",
        "up2.avatar as updatedByImage",
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
        "tasks.parentTaskId",
        jsonArrayFrom(
          eb
            .selectFrom("taskAssignments")
            .innerJoin("userProfiles as up", "taskAssignments.userId", "up.id")
            .select(["up.id", "up.fullName as name", "up.avatar as image"])
            .whereRef("taskAssignments.taskId", "=", "tasks.id")
        ).as("assignedTo"),
      ])
      .where((eb) => {
        const ands = [eb("tasks.projectId", "in", projectIds)]
        if (lastPulledAt) {
          ands.push(eb("tasks.updatedAt", ">=", lastPulledAtDate))
        }
        return eb.and(ands)
      })

    // Execute the query
    const tasks = await query.execute()

    const results = TaskSchemaWithTimeStamps.array().safeParse(
      tasks.map(
        (task) =>
          ({
            id: task.id,
            name: task.name,
            description: task.description,
            completed: task.completed,
            projectId: task.projectId,
            statusId: task.statusId,
            priorityId: task.priorityId,
            taskOrder: task.taskOrder,
            startDate: task.startDate
              ? new Date(task.startDate).getTime()
              : null,
            endDate: task.endDate ? new Date(task.endDate).getTime() : null,
            acceptanceCriteria: task.acceptanceCriteria,
            labelsTags: task.labelsTags,
            refUrls: task.refUrls,
            attachments: task.attachments,
            checklist: task.checklist,
            parentTaskId: task.parentTaskId,
            createdAt: new Date(task.createdAt).getTime(),
            updatedAt: new Date(task.updatedAt).getTime(),
            isSubtask: task.parentTaskId !== null,
            assignedTo: task.assignedTo.map((a) => ({
              id: a.id,
              name: a.name,
              image: a.image ?? undefined,
            })),
            createdBy: {
              id: task.createdBy,
              name: task.createdByName,
              image: task.createdByImage ?? undefined,
            },
            updatedBy: {
              id: task.updatedBy,
              name: task.updatedByName,
              image: task.updatedByImage ?? undefined,
            },
            comments: [],
          }) satisfies TaskWithTimeStamps
      )
    )

    if (!results.success) {
      throw new ServerError("Invalid tasks")
    }
    const parsedTasks = results.data
    // Format for RxDB sync protocol
    // RxDB expects a specific format with documents and an optional checkpoint
    return c.json(
      {
        documents: parsedTasks,
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
        realMasterState &&
        (realMasterState?.assignedTo.some((a) => a.id !== user.id) ||
          realMasterState.createdBy !== user.id)
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
                updatedAt: new Date(newDoc.updatedAt).toISOString(),
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

            // Insert new task - reorder columns alphabetically to match CamelCasePlugin
            const insertedTask = await c
              .get("db")
              .insertInto("tasks")
              .values({
                acceptanceCriteria: JSON.stringify(newDoc.acceptanceCriteria),
                attachments: JSON.stringify(newDoc.attachments),
                checklist: JSON.stringify(newDoc.checklist),
                completed: newDoc.completed,
                createdAt: new Date(newDoc.createdAt).toISOString(),
                createdBy: user.id,
                description: newDoc.description,
                endDate: newDoc.endDate
                  ? new Date(newDoc.endDate).toISOString()
                  : null,
                id: newDoc.id,
                labelsTags: JSON.stringify(newDoc.labelsTags),
                name: newDoc.name,
                parentTaskId: null,
                priorityId: newDoc.priorityId,
                projectId: newDoc.projectId,
                refUrls: JSON.stringify(newDoc.refUrls),
                startDate: newDoc.startDate
                  ? new Date(newDoc.startDate).toISOString()
                  : null,
                statusId: newDoc.statusId,
                taskOrder: newDoc.taskOrder,
                updatedAt: new Date(newDoc.updatedAt).toISOString(),
                updatedBy: user.id,
              })
              .returningAll()
              .executeTakeFirst()

            if (insertedTask) {
              event.documents.push(insertedTask as unknown as Task)
              event.checkpoint = {
                id: insertedTask.id,
                updatedAt: insertedTask.updatedAt,
              }
              if (newDoc.assignedTo.length > 0) {
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
