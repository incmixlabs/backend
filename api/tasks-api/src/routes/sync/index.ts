import type { Task } from "@/dbSchema"
import { db } from "@/lib/db"
import type { HonoApp } from "@/types"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import { useTranslation } from "@incmix-api/utils/middleware"
import { Hono } from "hono"

const syncRoutes = new Hono<HonoApp>()

syncRoutes.post("/pull", async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)

    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    // Get lastPulledAt timestamp to pull only new/updated tasks
    const { lastPulledAt } = c.req.query()
    // Convert lastPulledAt string to a valid date if it exists
    const lastPulledAtDate = lastPulledAt
      ? new Date(Number(lastPulledAt))
      : new Date(0)

    // Query builder to get user's tasks
    let query = db
      .selectFrom("tasks")
      .selectAll()
      .where("assignedTo", "=", user.id)

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

syncRoutes.post("/push", async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)

    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    // Get change rows from the client
    const changeRows =
      await c.req.json<
        Array<{
          newDocumentState: Task & { _deleted: boolean }
          assumedMasterState: Task & { _deleted: boolean }
        }>
      >()

    // Validate incoming data
    if (!Array.isArray(changeRows)) {
      return c.json(
        {
          message: "Invalid request format: expected an array of change rows",
          success: false,
        },
        400
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
      const realMasterState = await db
        .selectFrom("tasks")
        .selectAll()
        .where("id", "=", newDoc.id)
        .executeTakeFirst()

      // Check if the user has permission to modify this task
      if (
        realMasterState &&
        realMasterState.assignedTo !== user.id &&
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
          console.log("updating")
          if (realMasterState) {
            // Update existing task
            const updatedTask = await db
              .updateTable("tasks")
              .set({
                content: newDoc.content,
                status: newDoc.status,
                taskOrder: newDoc.taskOrder,
                projectId: newDoc.projectId,
                columnId: newDoc.columnId,
                assignedTo: newDoc.assignedTo,
                updatedAt: new Date().toISOString(),
                updatedBy: user.id,
              })
              .where("id", "=", newDoc.id)
              .returningAll()
              .executeTakeFirst()

            if (updatedTask) {
              event.documents.push(updatedTask)
              event.checkpoint = {
                id: updatedTask.id,
                updatedAt: updatedTask.updatedAt,
              }
            }
          } else {
            // Create new task - verify required fields
            if (!newDoc.columnId || !newDoc.projectId) {
              conflicts.push({
                error:
                  "Missing required fields: columnId and projectId are required",
                document: newDoc,
              })
              continue
            }

            // Verify project and column exist
            const project = await db
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

            const column = await db
              .selectFrom("columns")
              .select("id")
              .where("id", "=", newDoc.columnId)
              .executeTakeFirst()

            if (!column) {
              conflicts.push({
                error: "Column not found",
                document: newDoc,
              })
              continue
            }

            // Insert new task
            const insertedTask = await db
              .insertInto("tasks")
              .values({
                ...newDoc,
                assignedTo: newDoc.assignedTo || user.id,
                createdBy: user.id,
                updatedBy: user.id,
                createdAt:
                  newDoc.createdAt.toISOString() || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
              .returningAll()
              .executeTakeFirst()

            if (insertedTask) {
              event.documents.push(insertedTask)
              event.checkpoint = {
                id: insertedTask.id,
                updatedAt: insertedTask.updatedAt,
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

export default syncRoutes
