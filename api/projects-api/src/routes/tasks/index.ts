import {
  ERROR_CHECKLIST_CREATE_FAILED,
  ERROR_CHECKLIST_NOT_FOUND,
  ERROR_CHECKLIST_UPDATE_FAILED,
  ERROR_COLUMN_NOT_FOUND,
  ERROR_INVALID_JOB_TYPE,
  ERROR_PROJECT_NOT_FOUND,
  ERROR_TASK_DELETE_FAIL,
  ERROR_TASK_INSERT_FAIL,
  ERROR_TASK_NOT_FOUND,
  ERROR_TASK_UPDATE_FAIL,
} from "@/lib/constants"
import { getTaskById, getTasks, isProjectMember } from "@/lib/db"

import { getJobState } from "@/lib/utils"
import {
  addTaskChecklist,
  bulkAiGenTask,
  createTask,
  deleteTask,
  getJobStatus,
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
  addToCodegenQueue,
  addUserStoryToQueue,
  setupCodegenQueue,
  setupUserStoryQueue,
} from "@incmix-api/utils/queue"
import { apiReference } from "@scalar/hono-api-reference"
import { env } from "hono/adapter"
import { nanoid } from "nanoid"
import type { JobSchema } from "./types"
const tasksRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

// Setup OpenAPI documentation for tasks (must be before parameterized routes)
// These endpoints should be publicly accessible for documentation
tasksRoutes.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Tasks API",
    description:
      "Endpoints for task management. Auth via cookieAuth (session).",
  },
  tags: [
    {
      name: "Tasks",
      description: "Task management operations",
    },
  ],
})

tasksRoutes.get(
  "/reference",
  apiReference({
    spec: {
      url: "/api/projects/tasks/openapi.json",
    },
  })
)

// Note: /openapi.json is automatically created by tasksRoutes.doc() above

tasksRoutes.openAPIRegistry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "session",
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
      taskOrder,
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
            taskOrder,
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
      taskOrder,
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
        taskOrder,
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
    console.log("taskById", c.req.valid("param"))
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
      title: checklist.text,
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
      ...(checklist.text !== undefined ? { text: checklist.text } : {}),
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

    const { type, taskIds } = c.req.valid("json")

    // Fetch tasks with project information for authorization
    const tasks = await c
      .get("db")
      .selectFrom("tasks")
      .select(["id", "name", "description", "refUrls", "projectId"])
      .where(
        "id",
        "in",
        taskIds.map((id) => id)
      )
      .execute()

    if (tasks.length === 0) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    // Authorization check: ensure user has access to all tasks' projects
    for (const task of tasks) {
      const hasAccess = await isProjectMember(c, task.projectId, user.id)
      if (!hasAccess) {
        const msg = await t.text(ERROR_UNAUTHORIZED)
        throw new UnauthorizedError(msg)
      }
    }

    if (type === "user-story") {
      const queue = setupUserStoryQueue(env(c))

      try {
        for (const task of tasks) {
          await addUserStoryToQueue(queue, {
            taskId: task.id,
            title: task.name,
            createdBy: user.id,
          })
        }

        return c.json(
          { message: `${tasks.length} Tasks queued for AI generation` },
          200
        )
      } finally {
        await queue.close()
      }
    } else if (type === "codegen") {
      const queue = setupCodegenQueue(env(c))

      try {
        for (const task of tasks) {
          const figmaUrl = task.refUrls.find((url) => url.type === "figma")
          if (!figmaUrl) {
            continue
          }
          await addToCodegenQueue(queue, {
            taskId: task.id,
            title: task.name,
            createdBy: user.id,
            figmaUrl: figmaUrl.url,
          })
        }

        return c.json(
          { message: `${tasks.length} Tasks queued for AI generation` },
          200
        )
      } finally {
        await queue.close()
      }
    }

    const msg = await t.text(ERROR_INVALID_JOB_TYPE)
    throw new UnprocessableEntityError(msg)
  } catch (error) {
    return await processError<typeof bulkAiGenTask>(c, error, [
      "{{ default }}",
      "bulk-ai-gen-task",
    ])
  }
})

tasksRoutes.openapi(getJobStatus, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    // Get the job status from the BullMQ queue
    // Since this is for AI generation jobs, we'll check the queue status
    const userStoryQueue = setupUserStoryQueue(env(c))
    const codegenQueue = setupCodegenQueue(env(c))
    try {
      const jobs = (await userStoryQueue.getJobs()).filter(
        (job) => job.data.createdBy === user.id
      )
      const codegenJobs = (await codegenQueue.getJobs()).filter(
        (job) => job.data.createdBy === user.id
      )

      const result: {
        userStory: JobSchema[]
        codegen: JobSchema[]
      } = {
        userStory: [],
        codegen: [],
      }
      for (const job of jobs) {
        const jobState = await getJobState(job)

        result.userStory.push({
          taskId: job.data.taskId,
          jobTitle: job.data.title,
          status: jobState,
          jobId: job.id,
        })
      }
      for (const job of codegenJobs) {
        const jobState = await getJobState(job)

        result.codegen.push({
          taskId: job.data.taskId,
          jobTitle: job.data.title,
          status: jobState,
          jobId: job.id,
        })
      }
      return c.json(result, 200)
    } finally {
      await userStoryQueue.close()
      await codegenQueue.close()
    }
  } catch (error) {
    return await processError<typeof getJobStatus>(c, error, [
      "{{ default }}",
      "get-job-status",
    ])
  }
})

export default tasksRoutes
