import {
  ERROR_COLUMN_NOT_FOUND,
  ERROR_PROJECT_NOT_FOUND,
  ERROR_TASK_DELETE_FAIL,
  ERROR_TASK_INSERT_FAIL,
  ERROR_TASK_NOT_FOUND,
  ERROR_TASK_UPDATE_FAIL,
  ERROR_TEMPLATE_NOT_FOUND,
  ERROR_USER_STORY_GENERATION_FAILED,
} from "@/lib/constants"
import { FigmaService } from "@/lib/figma"

import {
  generateUserStory as aiGenerateUserStory,
  generateUserStoryFromImage,
} from "@/lib/services"
import {
  createTask,
  deleteTask,
  generateCodeFromFigma,
  generateFromFigma,
  generateUserStory,
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

    const { columnId, content, projectId, taskOrder, status, assignedTo } =
      c.req.valid("json")

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

    const existingTask = await c
      .get("db")
      .selectFrom("tasks")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst()

    if (!existingTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      return c.json({ message: msg }, 404)
    }

    if (projectId) {
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

    const updatedTask = await c
      .get("db")
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

    const task = await c
      .get("db")
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

    const task = await c
      .get("db")
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

    const { prompt, userTier, templateId } = c.req.valid("json")

    const template = await c
      .get("db")
      .selectFrom("storyTemplates")
      .selectAll()
      .where("id", "=", templateId)
      .executeTakeFirst()

    if (!template) {
      const msg = await t.text(ERROR_TEMPLATE_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const userStory = await aiGenerateUserStory(c, prompt, template, userTier)
    return c.json({ userStory }, 200)
  } catch (error) {
    return await processError<typeof generateUserStory>(c, error, [
      "{{ default }}",
      "generate-user-story",
    ])
  }
})

tasksRoutes.openapi(generateFromFigma, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    const { url, prompt, userTier } = c.req.valid("json")
    const figmaService = new FigmaService()
    const figmaImage = await figmaService.getFigmaImage(url)

    const userStory = await generateUserStoryFromImage(
      figmaImage,
      prompt,
      userTier
    )

    return c.json({ userStory, imageUrl: figmaImage }, 200)
  } catch (error) {
    return await processError<typeof generateFromFigma>(c, error, [
      "{{ default }}",
      "genrate-from-figma",
    ])
  }
})

tasksRoutes.openapi(generateCodeFromFigma, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    const { url, userTier } = c.req.valid("json")
    const figmaService = new FigmaService()

    return streamSSE(
      c,
      await figmaService.generateReactFromFigma(url, userTier)
    )
  } catch (error) {
    return await processError<typeof generateCodeFromFigma>(c, error, [
      "{{ default }}",
      "generate-code-from-figma",
    ])
  }
})
export default tasksRoutes
