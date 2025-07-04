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
import { getTaskWithChecklists, getTasks } from "@/lib/db"

import {
  addTaskChecklist,
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
  BadRequestError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  UnprocessableEntityError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { TaskStatus } from "@incmix/utils/types"
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
      checklist,
      acceptanceCriteria,
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

    const newTask = await getTaskWithChecklists(c, task.id)
    if (!newTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    return c.json({ ...newTask, comments: [] }, 201)
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

    const task = await getTaskWithChecklists(c, taskId)
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

    const task = await getTaskWithChecklists(c, taskId)

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

    const allChecklists = { ...existingTask.checklist, checklist }

    await c
      .get("db")
      .updateTable("tasks")
      .set({
        checklist: JSON.stringify(allChecklists),
      })
      .where("id", "=", taskId)
      .execute()

    const updatedTask = await getTaskWithChecklists(c, taskId)
    if (!updatedTask) {
      const msg = await t.text(ERROR_TASK_UPDATE_FAIL)
      throw new UnprocessableEntityError(msg)
    }

    return c.json({ ...updatedTask, comments: [] }, 201)
  } catch (error) {
    return await processError<typeof addTaskChecklist>(c, error, [
      "{{ default }}",
      "add-task-checklist",
    ])
  }
})

// tasksRoutes.openapi(updateTaskChecklist, async (c) => {
//   try {
//     const user = c.get("user")
//     const t = await useTranslation(c)
//     if (!user) {
//       const msg = await t.text(ERROR_UNAUTHORIZED)
//       throw new UnauthorizedError(msg)
//     }

//     const { checklist } = c.req.valid("json")
//     const { checklistId } = c.req.valid("param")

//     const existingChecklist = await c
//       .get("db")
//       .selectFrom("taskChecklists")
//       .selectAll()
//       .where("id", "=", checklistId)
//       .executeTakeFirst()

//     if (!existingChecklist) {
//       const msg = await t.text(ERROR_CHECKLIST_NOT_FOUND)
//       throw new UnprocessableEntityError(msg)
//     }

//     const updates: {
//       updatedBy: string
//       updatedAt: string
//       title?: string
//       status?: "todo" | "in_progress" | "done"
//     } = {
//       updatedBy: user.id,
//       updatedAt: new Date().toISOString(),
//     }

//     if (checklist.title !== undefined) {
//       updates.title = checklist.title
//     }
//     if (checklist.status !== undefined) {
//       updates.status = checklist.status
//     }

//     const updatedChecklist = await c
//       .get("db")
//       .updateTable("taskChecklists")
//       .set(updates)
//       .where("id", "=", existingChecklist.id)
//       .returningAll()
//       .executeTakeFirst()

//     if (!updatedChecklist) {
//       const msg = await t.text(ERROR_CHECKLIST_UPDATE_FAILED)
//       throw new BadRequestError(msg)
//     }

//     const updatedTask = await getTaskWithChecklists(c, existingChecklist.taskId)

//     return c.json(updatedTask, 200)
//   } catch (error) {
//     return await processError<typeof updateTaskChecklist>(c, error, [
//       "{{ default }}",
//       "update-task-checklist",
//     ])
//   }
// })

// tasksRoutes.openapi(removeTaskChecklist, async (c) => {
//   try {
//     const user = c.get("user")
//     const t = await useTranslation(c)
//     if (!user) {
//       const msg = await t.text(ERROR_UNAUTHORIZED)
//       throw new UnauthorizedError(msg)
//     }

//     const { checklistIds } = c.req.valid("json")
//     const { taskId } = c.req.valid("param")

//     const existingTask = await getTaskWithChecklists(c, taskId)
//     if (!existingTask) {
//       const msg = await t.text(ERROR_TASK_NOT_FOUND)
//       throw new UnprocessableEntityError(msg)
//     }

//     await c
//       .get("db")
//       .deleteFrom("taskChecklists")
//       .where((eb) =>
//         eb.and([eb("taskId", "=", taskId), eb("id", "in", checklistIds)])
//       )
//       .execute()

//     const updatedTask = await getTaskWithChecklists(c, taskId)

//     return c.json(updatedTask, 200)
//   } catch (error) {
//     return await processError<typeof removeTaskChecklist>(c, error, [
//       "{{ default }}",
//       "remove-task-checklist",
//     ])
//   }
// })

export default tasksRoutes
