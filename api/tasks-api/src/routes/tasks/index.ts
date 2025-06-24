import {
  ERROR_CHECKLIST_CREATE_FAILED,
  ERROR_CHECKLIST_NOT_FOUND,
  ERROR_CHECKLIST_UPDATE_FAILED,
  ERROR_COLUMN_NOT_FOUND,
  ERROR_COMMENT_CREATE_FAILED,
  ERROR_COMMENT_NOT_FOUND,
  ERROR_COMMENT_UPDATE_FAILED,
  ERROR_PROJECT_NOT_FOUND,
  ERROR_TASK_DELETE_FAIL,
  ERROR_TASK_INSERT_FAIL,
  ERROR_TASK_NOT_FOUND,
  ERROR_TASK_UPDATE_FAIL,
  ERROR_TEMPLATE_NOT_FOUND,
} from "@/lib/constants"
import { getTaskWithChecklists } from "@/lib/db"
import { FigmaService } from "@/lib/figma"

import {
  generateUserStory as aiGenerateUserStory,
  generateUserStoryFromImage,
} from "@/lib/services"
import {
  addTaskChecklist,
  addTaskComment,
  createTask,
  deleteTask,
  getTaskComments,
  listTasks,
  removeTaskChecklist,
  removeTaskComment,
  taskById,
  updateTask,
  updateTaskChecklist,
  updateTaskComment,
} from "@/routes/tasks/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableEntityError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { TaskStatus } from "@incmix/utils/types"
import { streamSSE } from "hono/streaming"
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

    const tasks = await c
      .get("db")
      .selectFrom("tasks")
      .selectAll()
      .where("assignedTo", "=", user.id)
      .execute()

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
      columnId,
      content,
      projectId,
      taskOrder,
      assignedTo,
      title,
      startDate,
      endDate,
    } = c.req.valid("json")

    let status: TaskStatus = "backlog"

    if (columnId) {
      status = "active"
    }

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

    if (columnId) {
      const column = await c
        .get("db")
        .selectFrom("columns")
        .selectAll()
        .where("id", "=", columnId)
        .executeTakeFirst()

      if (!column) {
        const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }
    }

    const taskId = nanoid(7)

    const newTask = await c
      .get("db")
      .insertInto("tasks")
      .values({
        id: taskId,
        content,
        status,
        taskOrder,
        projectId,
        columnId,
        assignedTo,
        title,
        currentTimelineStartDate: new Date(startDate).toISOString(),
        currentTimelineEndDate: new Date(endDate).toISOString(),
        actualTimelineStartDate: new Date(startDate).toISOString(),
        actualTimelineEndDate: new Date(endDate).toISOString(),
        createdBy: user.id,
        updatedBy: user.id,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirst()

    if (!newTask) {
      const msg = await t.text(ERROR_TASK_INSERT_FAIL)
      return c.json({ message: msg }, 400)
    }

    return c.json({ ...newTask, checklists: [], comments: [] }, 201)
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
      id,
      assignedTo,
      content,
      status,
      taskOrder,
      columnId,
      startDate,
      endDate,
    } = c.req.valid("json")

    if (columnId) {
      const column = await c
        .get("db")
        .selectFrom("columns")
        .selectAll()
        .where("id", "=", columnId)
        .executeTakeFirst()

      if (!column) {
        const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }
    }

    const updatedTask = await c
      .get("db")
      .updateTable("tasks")
      .set({
        assignedTo,
        content,
        status,
        taskOrder,
        columnId,
        currentTimelineStartDate: startDate
          ? new Date(startDate).toISOString()
          : undefined,
        currentTimelineEndDate: endDate
          ? new Date(endDate).toISOString()
          : undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst()

    if (!updatedTask) {
      const msg = await t.text(ERROR_TASK_UPDATE_FAIL)
      return c.json({ message: msg }, 400)
    }

    const task = await getTaskWithChecklists(c, id)

    return c.json(task, 200)
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

    return c.json(task, 200)
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

    const existingTask = await getTaskWithChecklists(c, taskId)
    if (!existingTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const id = nanoid(6)
    const newChecklist = {
      id,
      taskId,
      title: checklist.title,
      status: "todo" as const,
      createdBy: user.id,
      updatedBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const createdChecklist = await c
      .get("db")
      .insertInto("taskChecklists")
      .values(newChecklist)
      .returningAll()
      .executeTakeFirst()

    if (!createdChecklist) {
      const msg = await t.text(ERROR_CHECKLIST_CREATE_FAILED)
      throw new BadRequestError(msg)
    }

    const updatedTask = await getTaskWithChecklists(c, taskId)

    return c.json(updatedTask, 201)
  } catch (error) {
    return await processError<typeof addTaskChecklist>(c, error, [
      "{{ default }}",
      "add-task-checklist",
    ])
  }
})

tasksRoutes.openapi(updateTaskChecklist, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { checklist } = c.req.valid("json")
    const { checklistId } = c.req.valid("param")

    const existingChecklist = await c
      .get("db")
      .selectFrom("taskChecklists")
      .selectAll()
      .where("id", "=", checklistId)
      .executeTakeFirst()

    if (!existingChecklist) {
      const msg = await t.text(ERROR_CHECKLIST_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const updates: {
      updatedBy: string
      updatedAt: string
      title?: string
      status?: "todo" | "in_progress" | "done"
    } = {
      updatedBy: user.id,
      updatedAt: new Date().toISOString(),
    }

    if (checklist.title !== undefined) {
      updates.title = checklist.title
    }
    if (checklist.status !== undefined) {
      updates.status = checklist.status
    }

    const updatedChecklist = await c
      .get("db")
      .updateTable("taskChecklists")
      .set(updates)
      .where("id", "=", existingChecklist.id)
      .returningAll()
      .executeTakeFirst()

    if (!updatedChecklist) {
      const msg = await t.text(ERROR_CHECKLIST_UPDATE_FAILED)
      throw new BadRequestError(msg)
    }

    const updatedTask = await getTaskWithChecklists(c, existingChecklist.taskId)

    return c.json(updatedTask, 200)
  } catch (error) {
    return await processError<typeof updateTaskChecklist>(c, error, [
      "{{ default }}",
      "update-task-checklist",
    ])
  }
})

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

    const existingTask = await getTaskWithChecklists(c, taskId)
    if (!existingTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    await c
      .get("db")
      .deleteFrom("taskChecklists")
      .where((eb) =>
        eb.and([eb("taskId", "=", taskId), eb("id", "in", checklistIds)])
      )
      .execute()

    const updatedTask = await getTaskWithChecklists(c, taskId)

    return c.json(updatedTask, 200)
  } catch (error) {
    return await processError<typeof removeTaskChecklist>(c, error, [
      "{{ default }}",
      "remove-task-checklist",
    ])
  }
})

tasksRoutes.openapi(addTaskComment, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { comment } = c.req.valid("json")
    const { taskId } = c.req.valid("param")

    const existingTask = await getTaskWithChecklists(c, taskId)
    if (!existingTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const updatedTask = await c
      .get("db")
      .transaction()
      .execute(async (tx) => {
        const id = nanoid(7)
        const newComment = {
          id,
          content: comment.content,
          userId: user.id,
          createdBy: user.id,
          updatedBy: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const createdComment = await tx
          .insertInto("comments")
          .values(newComment)
          .returningAll()
          .executeTakeFirst()

        if (!createdComment) {
          const msg = await t.text(ERROR_COMMENT_CREATE_FAILED)
          throw new BadRequestError(msg)
        }

        const newTaskComment = {
          taskId,
          commentId: id,
        }

        await tx.insertInto("taskComments").values(newTaskComment).execute()

        return await getTaskWithChecklists(c, taskId)
      })

    return c.json(updatedTask, 201)
  } catch (error) {
    return await processError<typeof addTaskComment>(c, error, [
      "{{ default }}",
      "add-task-comment",
    ])
  }
})

tasksRoutes.openapi(updateTaskComment, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { comment } = c.req.valid("json")
    const { commentId } = c.req.valid("param")

    const updatedTask = await c
      .get("db")
      .transaction()
      .execute(async (tx) => {
        const existingComment = await tx
          .selectFrom("comments")
          .selectAll()
          .where("id", "=", commentId)
          .executeTakeFirst()

        if (!existingComment) {
          const msg = await t.text(ERROR_COMMENT_NOT_FOUND)
          throw new UnprocessableEntityError(msg)
        }

        if (
          existingComment.userId !== user.id &&
          user.userType !== "super_admin"
        ) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const updates: {
          updatedBy: string
          updatedAt: string
          content?: string
        } = {
          updatedBy: user.id,
          updatedAt: new Date().toISOString(),
        }

        if (comment.content !== undefined) {
          updates.content = comment.content
        }

        const updatedComment = await tx
          .updateTable("comments")
          .set(updates)
          .where("id", "=", existingComment.id)
          .returningAll()
          .executeTakeFirst()

        if (!updatedComment) {
          const msg = await t.text(ERROR_COMMENT_UPDATE_FAILED)
          throw new BadRequestError(msg)
        }

        const taskComment = await tx
          .selectFrom("taskComments")
          .selectAll()
          .where("commentId", "=", existingComment.id)
          .executeTakeFirst()

        if (!taskComment) {
          const msg = await t.text(ERROR_TASK_NOT_FOUND)
          throw new UnprocessableEntityError(msg)
        }

        return await getTaskWithChecklists(c, taskComment.taskId)
      })

    return c.json(updatedTask, 200)
  } catch (error) {
    return await processError<typeof updateTaskComment>(c, error, [
      "{{ default }}",
      "update-task-comment",
    ])
  }
})

tasksRoutes.openapi(removeTaskComment, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { taskId, commentId } = c.req.valid("param")
    const existingTask = await getTaskWithChecklists(c, taskId)
    if (!existingTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    // Authorization: Only comment author or super_admin can delete
    const existingComment = await c
      .get("db")
      .selectFrom("comments")
      .selectAll()
      .where("id", "=", commentId)
      .executeTakeFirst()

    if (!existingComment) {
      const msg = await t.text(ERROR_COMMENT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    if (existingComment.userId !== user.id && user.userType !== "super_admin") {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const updatedTask = await c
      .get("db")
      .transaction()
      .execute(async (tx) => {
        // Delete from taskComments table
        await tx
          .deleteFrom("taskComments")
          .where((eb) =>
            eb.and([eb("taskId", "=", taskId), eb("commentId", "=", commentId)])
          )
          .execute()

        // Delete from comments table
        await tx.deleteFrom("comments").where("id", "=", commentId).execute()

        return await getTaskWithChecklists(c, taskId)
      })

    return c.json(updatedTask, 200)
  } catch (error) {
    return await processError<typeof removeTaskComment>(c, error, [
      "{{ default }}",
      "remove-task-comment",
    ])
  }
})

tasksRoutes.openapi(getTaskComments, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { taskId } = c.req.valid("param")

    // Check if task exists
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

    // Get all comments for the task with user information
    const comments = await c
      .get("db")
      .selectFrom("taskComments")
      .innerJoin("comments", "taskComments.commentId", "comments.id")
      .innerJoin("userProfiles as users", "comments.userId", "users.id")
      .select([
        "comments.id",
        "comments.content",
        "comments.userId",
        "comments.createdAt",
        "comments.updatedAt",
        "users.fullName as userName",
        "users.email as userEmail",
        "users.avatar as userAvatar",
      ])
      .where("taskComments.taskId", "=", taskId)
      .orderBy("comments.createdAt desc")
      .execute()

    return c.json(comments, 200)
  } catch (error) {
    return await processError<typeof getTaskComments>(c, error, [
      "{{ default }}",
      "get-task-comments",
    ])
  }
})

export default tasksRoutes
