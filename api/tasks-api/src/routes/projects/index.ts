import {
  ERROR_COLUMN_CREATE_FAILED,
  ERROR_COLUMN_EXISTS,
  ERROR_COLUMN_NOT_FOUND,
  ERROR_COLUMN_UPDATE_FAILED,
  ERROR_ORG_NOT_FOUND,
  ERROR_PARENT_NOT_FOUND,
  ERROR_PROJECT_CREATE_FAILED,
  ERROR_PROJECT_EXISTS,
  ERROR_PROJECT_NOT_FOUND,
  ERROR_PROJECT_UPDATE_FAILED,
} from "@/lib/constants"
import { db, generateBoard } from "@/lib/db"
import { getOrganizationById } from "@/lib/services"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  UnprocessableEntityError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { nanoid } from "nanoid"
import {
  createColumn,
  createProject,
  deleteColumn,
  deleteProject,
  getBoard,
  getColumns,
  getProjects,
  updateColumn,
  updateProject,
} from "./openapi"
import type { UpdatedColumn } from "@/dbSchema"

const projectRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

projectRoutes.openapi(createProject, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }
    const { name, orgId } = c.req.valid("json")

    const org = await getOrganizationById(c, orgId)
    if (!org) {
      const msg = await t.text(ERROR_ORG_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const existingProject = await db
      .selectFrom("projects")
      .selectAll()
      .where((eb) => eb.and([eb("name", "=", name), eb("orgId", "=", org.id)]))
      .executeTakeFirst()
    if (existingProject) {
      const msg = await t.text(ERROR_PROJECT_EXISTS)
      throw new ConflictError(msg)
    }
    const id = nanoid(6)
    const project = await db
      .insertInto("projects")
      .values({
        id,
        name,
        orgId,
        createdBy: user.id,
        updatedBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirst()
    if (!project) {
      const msg = await t.text(ERROR_PROJECT_CREATE_FAILED)
      throw new BadRequestError(msg)
    }
    return c.json(project, 201)
  } catch (error) {
    return await processError<typeof createProject>(c, error, [
      "{{ default }}",
      "create-project",
    ])
  }
})

projectRoutes.openapi(updateProject, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { id, name } = c.req.valid("json")
    const existingProject = await db
      .selectFrom("projects")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst()
    if (!existingProject) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    const project = await db
      .updateTable("projects")
      .set({ name, updatedBy: user.id, updatedAt: new Date().toISOString() })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst()
    if (!project) {
      const msg = await t.text(ERROR_PROJECT_UPDATE_FAILED)
      throw new BadRequestError(msg)
    }
    return c.json(project, 200)
  } catch (error) {
    return await processError<typeof updateProject>(c, error, [
      "{{ default }}",
      "update-project",
    ])
  }
})

projectRoutes.openapi(deleteProject, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { projectId } = c.req.valid("param")
    const existingProject = await db
      .selectFrom("projects")
      .selectAll()
      .where("id", "=", projectId)
      .executeTakeFirst()
    if (!existingProject) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    await db
      .deleteFrom("projects")
      .where("id", "=", projectId)
      .executeTakeFirst()
    return c.json({ message: "Project deleted" }, 200)
  } catch (error) {
    return await processError<typeof deleteProject>(c, error, [
      "{{ default }}",
      "delete-project",
    ])
  }
})

projectRoutes.openapi(createColumn, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }

    const { label, projectId, parentId, columnOrder } = c.req.valid("json")

    const existingProject = await db
      .selectFrom("projects")
      .selectAll()
      .where("id", "=", projectId)
      .executeTakeFirst()
    if (!existingProject) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    if (parentId) {
      const existingParent = await db
        .selectFrom("columns")
        .selectAll()
        .where("id", "=", parentId)
        .executeTakeFirst()
      if (!existingParent) {
        const msg = await t.text(ERROR_PARENT_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }
    }
    const existingColumn = await db
      .selectFrom("columns")
      .selectAll()
      .where((eb) =>
        eb.and([
          eb("label", "=", label),
          eb("projectId", "=", existingProject.id),
        ])
      )
      .executeTakeFirst()
    if (existingColumn) {
      const msg = await t.text(ERROR_COLUMN_EXISTS)
      throw new ConflictError(msg)
    }
    const id = nanoid(6)
    const column = await db
      .insertInto("columns")
      .values({
        id,
        label,
        projectId,
        columnOrder,
        parentId,
        createdBy: user.id,
        updatedBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returningAll()
      .executeTakeFirst()
    if (!column) {
      const msg = await t.text(ERROR_COLUMN_CREATE_FAILED)
      throw new BadRequestError(msg)
    }

    await db
      .updateTable("columns")
      .set((eb) => ({ columnOrder: eb("columnOrder", "+", 1) }))
      .where((eb) =>
        eb.and([
          eb("columnOrder", ">=", columnOrder),
          eb("id", "!=", column.id),
          eb("projectId", "=", column.projectId),
        ])
      )
      .execute()
    return c.json(column, 201)
  } catch (error) {
    return await processError<typeof createColumn>(c, error, [
      "{{ default }}",
      "create-column",
    ])
  }
})

projectRoutes.openapi(updateColumn, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { id, label, order, parentId } = c.req.valid("json")

    const existingColumn = await db
      .selectFrom("columns")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst()
    if (!existingColumn) {
      const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const column = await db
      .updateTable("columns")
      .set(() => {
        const updates: UpdatedColumn = {
          updatedBy: user.id,
          updatedAt: new Date().toISOString(),
        }
        if (label !== undefined) {
          updates.label = label
        }
        if (order !== undefined) {
          updates.columnOrder = order
        }
        if (parentId !== undefined) {
          updates.parentId = parentId
        }
        return updates
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst()
    if (!column) {
      const msg = await t.text(ERROR_COLUMN_UPDATE_FAILED)
      throw new BadRequestError(msg)
    }
    return c.json(column, 200)
  } catch (error) {
    return await processError<typeof updateColumn>(c, error, [
      "{{ default }}",
      "update-column",
    ])
  }
})

projectRoutes.openapi(deleteColumn, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { columnId } = c.req.valid("param")
    if (!columnId) {
      const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    const existingColumn = await db
      .selectFrom("columns")
      .selectAll()
      .where("id", "=", columnId)
      .executeTakeFirst()
    if (!existingColumn) {
      const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    await db.deleteFrom("columns").where("id", "=", columnId).executeTakeFirst()
    return c.json({ message: "Column deleted" }, 200)
  } catch (error) {
    return await processError<typeof deleteColumn>(c, error, [
      "{{ default }}",
      "delete-column",
    ])
  }
})

projectRoutes.openapi(getProjects, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }
    const { orgId } = c.req.valid("param")
    const org = await getOrganizationById(c, orgId)
    if (!org) {
      const msg = await t.text(ERROR_ORG_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const projects = await db
      .selectFrom("projects")
      .selectAll()
      .where("orgId", "=", orgId)
      .execute()

    return c.json(projects, 200)
  } catch (error) {
    return await processError<typeof getProjects>(c, error, [
      "{{ default }}",
      "get-projects",
    ])
  }
})

projectRoutes.openapi(getColumns, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }
    const { projectId } = c.req.valid("param")

    const project = await db
      .selectFrom("projects")
      .selectAll()
      .where("projects.id", "=", projectId)
      .executeTakeFirst()
    if (!project) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const { columnId } = c.req.valid("query")
    const columns = await db
      .selectFrom("columns")
      .selectAll()
      .where((eb) => {
        if (columnId?.length)
          return eb.and([
            eb("projectId", "=", project.id),
            eb("parentId", "=", columnId),
          ])
        return eb("projectId", "=", project.id)
      })
      .orderBy("columnOrder asc")
      .execute()

    return c.json(columns, 200)
  } catch (error) {
    return await processError<typeof getColumns>(c, error, [
      "{{ default }}",
      "get-columns",
    ])
  }
})

projectRoutes.openapi(getBoard, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      return c.json({ message: msg }, 401)
    }
    const { projectId } = c.req.valid("param")

    const board = await generateBoard(projectId)
    if (!board) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    return c.json(board, 200)
  } catch (error) {
    return await processError<typeof getBoard>(c, error, [
      "{{ default }}",
      "get-board",
    ])
  }
})

export default projectRoutes
