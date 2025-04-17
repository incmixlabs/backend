import {
  ERROR_COLUMN_NOT_FOUND,
  ERROR_PROJECT_NOT_FOUND,
  ERROR_TASK_DELETE_FAIL,
  ERROR_TASK_INSERT_FAIL,
  ERROR_TASK_NOT_FOUND,
  ERROR_TASK_UPDATE_FAIL,
  ERROR_USER_STORY_GENERATION_FAILED,
} from "@/lib/constants"
import { db } from "@/lib/db"
import {
  generateUserStory as aiGenerateUserStory,
  generateUserStoryFromImage,
  getFigmaFile,
} from "@/lib/services"
import {
  createTask,
  deleteTask,
  generateUserStory,
  genrateFromFigma,
  listTasks,
  taskById,
  updateTask,
} from "@/routes/tasks/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  UnprocessableEntityError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
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

    const tasks = await db
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

    const { columnId, content, projectId, taskOrder, status, assignedTo } =
      c.req.valid("json")

    const project = await db
      .selectFrom("projects")
      .selectAll()
      .where("id", "=", projectId)
      .executeTakeFirst()

    if (!project) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const column = await db
      .selectFrom("columns")
      .selectAll()
      .where("id", "=", columnId)
      .executeTakeFirst()

    if (!column) {
      const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const taskId = nanoid(7)

    const newTask = await db
      .insertInto("tasks")
      .values({
        id: taskId,
        content,
        status,
        taskOrder,
        projectId,
        columnId,
        assignedTo,
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
    const { assignedTo, content, status, taskOrder, projectId, columnId } =
      c.req.valid("json")

    const { id } = c.req.valid("param")

    const existingTask = await db
      .selectFrom("tasks")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst()

    if (!existingTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      return c.json({ message: msg }, 404)
    }

    if (projectId) {
      const project = await db
        .selectFrom("projects")
        .selectAll()
        .where("id", "=", projectId)
        .executeTakeFirst()

      if (!project) {
        const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }
    }

    if (columnId) {
      const column = await db
        .selectFrom("columns")
        .selectAll()
        .where("id", "=", columnId)
        .executeTakeFirst()

      if (!column) {
        const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }
    }

    const updatedTask = await db
      .updateTable("tasks")
      .set({
        assignedTo,
        content,
        status,
        taskOrder,
        projectId,
        columnId,
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

    return c.json(updatedTask, 200)
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
      return c.json({ message: msg }, 401)
    }

    const { id } = c.req.valid("param")

    const task = await db
      .selectFrom("tasks")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst()

    if (!task) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      return c.json({ message: msg }, 404)
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
      return c.json({ message: msg }, 401)
    }

    const { id } = c.req.valid("param")

    const task = await db
      .deleteFrom("tasks")
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst()

    if (!task) {
      const msg = await t.text(ERROR_TASK_DELETE_FAIL)
      return c.json({ message: msg }, 400)
    }

    return c.json(task, 200)
  } catch (error) {
    return await processError<typeof deleteTask>(c, error, [
      "{{ default }}",
      "delete-task",
    ])
  }
})

tasksRoutes.openapi(generateUserStory, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    const { prompt, userTier } = c.req.valid("json")

    try {
      const userStory = await aiGenerateUserStory(c, prompt, userTier)
      return c.json({ userStory }, 200)
    } catch (error) {
      console.error("User story generation failed:", error)
      const msg = await t.text(ERROR_USER_STORY_GENERATION_FAILED)
      return c.json({ message: msg }, 400)
    }
  } catch (error) {
    return await processError<typeof generateUserStory>(c, error, [
      "{{ default }}",
      "generate-user-story",
    ])
  }
})

tasksRoutes.openapi(genrateFromFigma, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    const { url, layerName, prompt, userTier } = c.req.valid("json")

    const figmaFile = await getFigmaFile(url, layerName)

    const userStory = await generateUserStoryFromImage(
      prompt,
      figmaFile,
      userTier
    )

    return c.json({ userStory, imageUrl: figmaFile }, 200)
  } catch (error) {
    return await processError<typeof genrateFromFigma>(c, error, [
      "{{ default }}",
      "genrate-from-figma",
    ])
  }
})
export default tasksRoutes
