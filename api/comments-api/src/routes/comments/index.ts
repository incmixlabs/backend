import {
  ERROR_COMMENT_CREATE_FAILED,
  ERROR_COMMENT_DELETE_FAILED,
  ERROR_COMMENT_NOT_FOUND,
  ERROR_COMMENT_UPDATE_FAILED,
  ERROR_PROJECT_NOT_FOUND,
  ERROR_TASK_NOT_FOUND,
} from "@/lib/constants"
import {
  getCommentById,
  getProjectById,
  getTaskById,
  listProjectComments,
  listTaskComments,
} from "@/lib/db"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import type {
  NewComment,
  NewProjectComment,
  NewTaskComment,
  UpdatedComment,
} from "@incmix-api/utils/db-schema"
import {
  BadRequestError,
  UnauthorizedError,
  UnprocessableEntityError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { nanoid } from "nanoid"
import {
  addComment,
  getProjectComments,
  getTaskComments,
  removeComment,
  updateComment,
} from "./openapi"

const commentsRoute = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

commentsRoute.openapi(addComment, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { comment, type } = c.req.valid("json")
    const { id } = c.req.valid("param")
    const newComment = await c
      .get("db")
      .transaction()
      .execute(async (tx) => {
        const commentId = nanoid(6)
        const newComment: NewComment = {
          id: commentId,
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

        if (type === "project") {
          const existingProject = await getProjectById(c, id)
          if (!existingProject) {
            const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
            throw new UnprocessableEntityError(msg)
          }

          const newProjectComment: NewProjectComment = {
            projectId: id,
            commentId: commentId,
          }

          await tx
            .insertInto("projectComments")
            .values(newProjectComment)
            .execute()
        }

        if (type === "task") {
          const existingTask = await getTaskById(c, id)
          if (!existingTask) {
            const msg = await t.text(ERROR_TASK_NOT_FOUND)
            throw new UnprocessableEntityError(msg)
          }

          const newTaskComment: NewTaskComment = {
            taskId: id,
            commentId: commentId,
          }

          await tx.insertInto("taskComments").values(newTaskComment).execute()
        }

        return createdComment
      })

    return c.json(await getCommentById(c, newComment.id), 201)
  } catch (error) {
    return await processError<typeof addComment>(c, error, [
      "{{ default }}",
      "add-comment",
    ])
  }
})

commentsRoute.openapi(updateComment, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { comment } = c.req.valid("json")
    const { commentId } = c.req.valid("param")

    const updatedComment = await c
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

        const updates: UpdatedComment = {
          updatedBy: user.id,
          updatedAt: new Date().toISOString(),
        }

        if (comment.content !== undefined) {
          updates.content = comment.content
        }

        if (existingComment.userId !== user.id && !user.isSuperAdmin) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
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

        return await getCommentById(c, commentId)
      })

    return c.json(updatedComment, 200)
  } catch (error) {
    return await processError<typeof updateComment>(c, error, [
      "{{ default }}",
      "update-comment",
    ])
  }
})

commentsRoute.openapi(removeComment, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { commentId } = c.req.valid("param")

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

    if (existingComment.userId !== user.id && !user.isSuperAdmin) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const updatedComment = await c
      .get("db")
      .transaction()
      .execute(async (tx) => {
        await tx
          .deleteFrom("projectComments")
          .where("commentId", "=", commentId)
          .execute()

        await tx
          .deleteFrom("taskComments")
          .where("commentId", "=", commentId)
          .execute()

        return await tx
          .deleteFrom("comments")
          .where("id", "=", commentId)
          .execute()
      })

    if (!updatedComment) {
      const msg = await t.text(ERROR_COMMENT_DELETE_FAILED)
      throw new BadRequestError(msg)
    }

    return c.json({ message: "Comment deleted successfully" }, 200)
  } catch (error) {
    return await processError<typeof removeComment>(c, error, [
      "{{ default }}",
      "remove-comment",
    ])
  }
})

commentsRoute.openapi(getProjectComments, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { projectId } = c.req.valid("param")

    const existingProject = await getProjectById(c, projectId)

    if (!existingProject) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const comments = await listProjectComments(c, projectId)
    return c.json(comments, 200)
  } catch (error) {
    return await processError<typeof getProjectComments>(c, error, [
      "{{ default }}",
      "get-project-comments",
    ])
  }
})
commentsRoute.openapi(getTaskComments, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { taskId } = c.req.valid("param")

    const existingTask = await getTaskById(c, taskId)

    if (!existingTask) {
      const msg = await t.text(ERROR_TASK_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const comments = await listTaskComments(c, taskId)
    return c.json(comments, 200)
  } catch (error) {
    return await processError<typeof getTaskComments>(c, error, [
      "{{ default }}",
      "get-task-comments",
    ])
  }
})

export default commentsRoute
