import {
  ERROR_CHECKLIST_CREATE_FAILED,
  ERROR_CHECKLIST_NOT_FOUND,
  ERROR_CHECKLIST_UPDATE_FAILED,
  ERROR_COLUMN_NOT_FOUND,
  ERROR_PROJECT_NOT_FOUND,
  ERROR_TASK_DELETE_FAIL,
  ERROR_TASK_INSERT_FAIL,
  ERROR_TASK_NOT_FOUND,
  ERROR_TASK_UPDATE_FAIL,
} from "@/lib/constants"
import { getTaskById, getTasks } from "@/lib/db"

import {
  addTaskChecklist,
  bulkAiGenTask,
  createTask,
  deleteTask,
  listTasks,
  removeTaskChecklist,
  taskById,
  updateTask,
  updateTaskChecklist,
} from "@/routes/tasks/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  NotFoundError,
  ServerError,
  UnauthorizedError,
  UnprocessableEntityError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import {
  addUserStoryToQueue,
  setupUserStoryQueue,
} from "@incmix-api/utils/queue"
import { env } from "hono/adapter"
import { nanoid } from "nanoid"
const tasksRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

tasksRoutes.openapi(listTasks, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    const tasks = await getTasks(c, user.id)

    return c.json(tasks, 200)
  } catch (error) {
    return await processError<typeof listTasks>(c, error, [
      "{{ default }}",
      "list-tasks",
    ])
  }
})

tasksRoutes.openapi(createTask, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    const {
      projectId,
      order,
      assignedTo,
      startDate,
      endDate,
      name,
      description,
      parentTaskId,
      statusId,
      priorityId,
      labelsTags,
      refUrls,
      attachments,
      acceptanceCriteria,
      checklist,
    } = c.req.valid("json")

    const project = await c
      .get("db")
      .selectFrom("projects")
      .selectAll()
      .where("id", "=", projectId)
      .executeTakeFirst()

    if (!project) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    if (statusId) {
      const column = await c
        .get("db")
        .selectFrom("labels")
        .selectAll()
        .where("id", "=", statusId)
        .executeTakeFirst()

      if (!column) {
        const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }
    }

    if (priorityId) {
      const priority = await c
        .get("db")
        .selectFrom("labels")
        .selectAll()
        .where("id", "=", priorityId)
        .executeTakeFirst()

      if (!priority) {
        const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }
    }

    const taskId = nanoid(7)

    const task = await c
      .get("db")
      .transaction()
      .execute(async (tx) => {
        const newTask = await tx
          .insertInto("tasks")
          .values({
            id: taskId,
            name,
            description,
            taskOrder: order,
            projectId,
            statusId,
            priorityId,
            parentTaskId,
            labelsTags: JSON.stringify(labelsTags),
            refUrls: JSON.stringify(refUrls),
            attachments: JSON.stringify(attachments),
            acceptanceCriteria: JSON.stringify(acceptanceCriteria),
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            createdBy: user.id,
            updatedBy: user.id,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            completed: false,
            checklist: JSON.stringify(checklist),
          })
          .returningAll()
          .executeTakeFirst()

        if (!newTask) {
          const msg = await t.text(ERROR_TASK_INSERT_FAIL)
          throw new ServerError(msg)
        }

        if (assignedTo?.length)
          await tx
            .insertInto("taskAssignments")
            .values(
              assignedTo.map((a) => ({
                taskId: newTask.id,
                userId: a,
              }))
            )
            .execute()

        return newTask
      })

    const newTask = await getTaskById(c, task.id)
    if (!newTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    return c.json(newTask, 201)
  } catch (error) {
    return await processError<typeof createTask>(c, error, [
      "{{ default }}",
      "create-task",
    ])
  }
})

tasksRoutes.openapi(updateTask, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }
    const {
      assignedTo,
      order,
      statusId,
      priorityId,
      name,
      description,
      parentTaskId,
      labelsTags,
      refUrls,
      attachments,
      acceptanceCriteria,
      startDate,
      endDate,
    } = c.req.valid("json")

    const { taskId } = c.req.valid("param")

    const existingTask = await c
      .get("db")
      .selectFrom("tasks")
      .selectAll()
      .where("id", "=", taskId)
      .executeTakeFirst()

    if (!existingTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    if (statusId && existingTask.statusId !== statusId) {
      const status = await c
        .get("db")
        .selectFrom("labels")
        .selectAll()
        .where("id", "=", statusId)
        .executeTakeFirst()

      if (!status) {
        const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }
    }

    if (priorityId && existingTask.priorityId !== priorityId) {
      const priority = await c
        .get("db")
        .selectFrom("labels")
        .selectAll()
        .where("id", "=", priorityId)
        .executeTakeFirst()

      if (!priority) {
        const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }
    }

    const updatedTask = await c
      .get("db")
      .updateTable("tasks")
      .set({
        name,
        description,
        taskOrder: order,
        statusId,
        priorityId,
        parentTaskId,
        labelsTags: JSON.stringify(labelsTags),
        refUrls: JSON.stringify(refUrls),
        attachments: JSON.stringify(attachments),
        acceptanceCriteria: JSON.stringify(acceptanceCriteria),
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
      })
      .where("id", "=", taskId)
      .returningAll()
      .executeTakeFirst()

    if (!updatedTask) {
      const msg = await t.text(ERROR_TASK_UPDATE_FAIL)
      return c.json({ message: msg }, 400)
    }

    if (assignedTo?.length) {
      await c
        .get("db")
        .deleteFrom("taskAssignments")
        .where("taskId", "=", taskId)
        .execute()
      await c
        .get("db")
        .insertInto("taskAssignments")
        .values(
          assignedTo.map((a) => ({
            taskId: taskId,
            userId: a,
          }))
        )
        .execute()
    }

    const task = await getTaskById(c, taskId)
    if (!task) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    return c.json({ ...task, comments: [] }, 200)
  } catch (error) {
    return await processError<typeof updateTask>(c, error, [
      "{{ default }}",
      "update-task",
    ])
  }
})

tasksRoutes.openapi(taskById, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { taskId } = c.req.valid("param")

    const task = await getTaskById(c, taskId)

    if (!task) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    return c.json({ ...task, comments: [] }, 200)
  } catch (error) {
    return await processError<typeof taskById>(c, error, [
      "{{ default }}",
      "task-by-id",
    ])
  }
})

tasksRoutes.openapi(deleteTask, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { taskId } = c.req.valid("param")

    const task = await c
      .get("db")
      .deleteFrom("tasks")
      .where("id", "=", taskId)
      .returningAll()
      .executeTakeFirst()

    if (!task) {
      const msg = await t.text(ERROR_TASK_DELETE_FAIL)
      throw new UnprocessableEntityError(msg)
    }

    return c.json({ message: "Task deleted successfully" }, 200)
  } catch (error) {
    return await processError<typeof deleteTask>(c, error, [
      "{{ default }}",
      "delete-task",
    ])
  }
})

tasksRoutes.openapi(addTaskChecklist, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { checklist } = c.req.valid("json")
    const { taskId } = c.req.valid("param")

    // Get the task
    const existingTask = await c
      .get("db")
      .selectFrom("tasks")
      .selectAll()
      .where("id", "=", taskId)
      .executeTakeFirst()

    if (!existingTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    // Generate a unique id for the checklist item
    const id = nanoid(6)
    const newChecklist = {
      id,
      title: checklist.title,
      checked: checklist.checked,
      order: checklist.order,
    }

    // Use SQL to append the new checklist item to the checklist array
    const { sql } = await import("kysely")
    const query = sql`
      UPDATE ${sql.table("tasks")}
      SET checklist = COALESCE(checklist, '[]'::jsonb) || ${JSON.stringify(newChecklist)}::jsonb
      WHERE id = ${taskId}
    `
    const result = await query.execute(c.get("db"))
    if (!result.numAffectedRows) {
      const msg = await t.text(ERROR_CHECKLIST_CREATE_FAILED)
      throw new UnprocessableEntityError(msg)
    }

    const updatedTask = await getTaskById(c, taskId)
    if (!updatedTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    return c.json(updatedTask, 201)
  } catch (error) {
    return await processError<typeof addTaskChecklist>(c, error, [
      "{{ default }}",
      "add-task-checklist",
    ])
  }
})

// Update Task Checklist

tasksRoutes.openapi(updateTaskChecklist, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { checklist } = c.req.valid("json")
    const { taskId, checklistId } = c.req.valid("param")

    // Use SQL to update the checklist item in the checklist array
    const { sql } = await import("kysely")
    // Build the updated checklist item
    const updatedChecklist = {
      id: checklistId,
      ...(checklist.title !== undefined ? { title: checklist.title } : {}),
      ...(checklist.checked !== undefined
        ? { checked: checklist.checked }
        : {}),
      ...(checklist.order !== undefined ? { order: checklist.order } : {}),
    }
    const query = sql`
      UPDATE ${sql.table("tasks")}
      SET checklist = (
        SELECT jsonb_agg(
          CASE
            WHEN item->>'id' = ${checklistId}::text
            THEN item || ${JSON.stringify(updatedChecklist)}::jsonb
            ELSE item
          END
        )
        FROM jsonb_array_elements(checklist) AS item
      )
      WHERE id = ${taskId}
    `
    const result = await query.execute(c.get("db"))
    if (!result.numAffectedRows) {
      const msg = await t.text(ERROR_CHECKLIST_UPDATE_FAILED)
      throw new UnprocessableEntityError(msg)
    }

    const updatedTask = await getTaskById(c, taskId)
    if (!updatedTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    return c.json(updatedTask, 200)
  } catch (error) {
    return await processError<typeof updateTaskChecklist>(c, error, [
      "{{ default }}",
      "update-task-checklist",
    ])
  }
})

// Remove Task Checklist

tasksRoutes.openapi(removeTaskChecklist, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { checklistIds } = c.req.valid("json")
    const { taskId } = c.req.valid("param")

    // Use SQL to remove checklist items by id from the checklist array
    const { sql } = await import("kysely")
    const query = sql`
      UPDATE ${sql.table("tasks")}
      SET checklist = (
        SELECT jsonb_agg(item)
        FROM jsonb_array_elements(checklist) AS item
        WHERE item->>'id' NOT IN (${sql.join(
          checklistIds.map((id) => sql`${id}`),
          sql`, `
        )})
      )
      WHERE id = ${taskId}
    `
    const result = await query.execute(c.get("db"))
    if (!result.numAffectedRows) {
      const msg = await t.text(ERROR_CHECKLIST_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const updatedTask = await getTaskById(c, taskId)
    if (!updatedTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    return c.json(updatedTask, 200)
  } catch (error) {
    return await processError<typeof removeTaskChecklist>(c, error, [
      "{{ default }}",
      "remove-task-checklist",
    ])
  }
})

tasksRoutes.openapi(bulkAiGenTask, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { taskIds } = c.req.valid("json")

    const tasks = await c
      .get("db")
      .selectFrom("tasks")
      .select(["id", "name", "description"])
      .where(
        "id",
        "in",
        taskIds.map((t) => t.id)
      )
      .execute()

    const queue = setupUserStoryQueue(env(c))

    for (const task of tasks) {
      await addUserStoryToQueue(queue, {
        taskId: task.id,
        title: task.name,
      })
    }

    return c.json(
      { message: `${tasks.length} Tasks queued for AI generation` },
      200
    )
  } catch (error) {
    return await processError<typeof bulkAiGenTask>(c, error, [
      "{{ default }}",
      "bulk-ai-gen-task",
    ])
  }
})

export default tasksRoutes
