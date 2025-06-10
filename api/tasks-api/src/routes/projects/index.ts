import {
  ERROR_COLUMN_CREATE_FAILED,
  ERROR_COLUMN_EXISTS,
  ERROR_COLUMN_NOT_FOUND,
  ERROR_COLUMN_UPDATE_FAILED,
  ERROR_ORG_NOT_FOUND,
  ERROR_PARENT_NOT_FOUND,
  ERROR_PRESIGNED_URL,
  ERROR_PROJECT_CREATE_FAILED,
  ERROR_PROJECT_EXISTS,
  ERROR_PROJECT_MEMBER_CREATE_FAILED,
  ERROR_PROJECT_NOT_FOUND,
  ERROR_PROJECT_UPDATE_FAILED,
} from "@/lib/constants"
import { generateBoard, getProjectWithMembers } from "@/lib/db"
import { getOrganizationById } from "@/lib/services"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import type {
  NewProjectMember,
  UpdatedColumn,
} from "@incmix-api/utils/db-schema"
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  UnprocessableEntityError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { env } from "hono/adapter"
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
    const {
      name,
      orgId,
      description,
      logo,
      budgetEstimate,
      startDate,
      endDate,
      company,
    } = c.req.valid("form")

    const org = await getOrganizationById(c, orgId)
    if (!org) {
      const msg = await t.text(ERROR_ORG_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const existingProject = await c
      .get("db")
      .selectFrom("projects")
      .selectAll()
      .where((eb) => eb.and([eb("name", "=", name), eb("orgId", "=", org.id)]))
      .executeTakeFirst()
    if (existingProject) {
      const msg = await t.text(ERROR_PROJECT_EXISTS)
      throw new ConflictError(msg)
    }
    const id = nanoid(6)
    const createdProject = await c
      .get("db")
      .transaction()
      .execute(async (tx) => {
        let logoUrl: string | null = null
        if (logo) {
          const fileName = `projects/${id}.jpg`
          const presignedUrlResponse = await fetch(
            `${env(c).FILES_API_URL}/presigned-upload?fileName=${encodeURIComponent(
              fileName
            )}`,
            {
              method: "GET",
              headers: c.req.raw.headers,
            }
          )

          if (!presignedUrlResponse.ok) {
            const msg = await t.text(ERROR_PRESIGNED_URL)
            throw new UnprocessableEntityError(msg)
          }

          const presignedUrl = (await presignedUrlResponse.json()) as {
            url: string
          }

          await fetch(presignedUrl.url, {
            method: "PUT",
            body: logo,
            headers: {
              "Content-Type": logo.type,
            },
          })

          const [url] = presignedUrl.url.split("?")
          logoUrl = url
        }
        const project = await tx
          .insertInto("projects")
          .values({
            id,
            name,
            orgId,
            createdBy: user.id,
            updatedBy: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            currentTimelineStartDate: startDate,
            currentTimelineEndDate: endDate,
            actualTimelineStartDate: startDate,
            actualTimelineEndDate: endDate,
            budgetEstimate,
            budgetActual: budgetEstimate,
            description,
            company,
            status: "todo",
            checklists: [],
            logo: logoUrl,
          })
          .returningAll()
          .executeTakeFirst()

        if (!project) {
          const msg = await t.text(ERROR_PROJECT_CREATE_FAILED)
          throw new BadRequestError(msg)
        }

        // const insertableMembers = members
        //   .map<NewProjectMember>((member) => ({
        //     projectId: id,
        //     userId: member.id,
        //     role: member.role,
        //     isOwner: false,
        //     createdBy: user.id,
        //     updatedBy: user.id,
        //     createdAt: new Date().toISOString(),
        //     updatedAt: new Date().toISOString(),
        //   }))
        //   .concat([
        //     {
        //       projectId: id,
        //       userId: user.id,
        //       role: "owner",
        //       isOwner: true,
        //       createdBy: user.id,
        //       updatedBy: user.id,
        //       createdAt: new Date().toISOString(),
        //       updatedAt: new Date().toISOString(),
        //     },
        //   ])

        // const insertedMembers = await tx
        //   .insertInto("projectMembers")
        //   .values(insertableMembers)
        //   .returningAll()
        //   .execute()

        // if (insertedMembers.length !== insertableMembers.length) {
        //   const msg = await t.text(ERROR_PROJECT_MEMBER_CREATE_FAILED)
        //   throw new BadRequestError(msg)
        // }

        return {
          ...project,
          members: [],
        }
      })

    return c.json(createdProject, 201)
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
    const {
      id,
      name,
      description,
      budgetEstimate,
      company,
      currentTimelineEndDate,
      currentTimelineStartDate,
    } = c.req.valid("json")
    if (!id) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    const existingProject = await getProjectWithMembers(c, id)

    if (!existingProject) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    const project = await c
      .get("db")
      .updateTable("projects")
      .set({
        name,
        description,
        budgetEstimate,
        currentTimelineStartDate,
        currentTimelineEndDate,
        company,
        updatedBy: user.id,
        updatedAt: new Date().toISOString(),
      })
      .where("id", "=", existingProject.id)
      .returningAll()
      .executeTakeFirst()

    if (!project) {
      const msg = await t.text(ERROR_PROJECT_UPDATE_FAILED)
      throw new BadRequestError(msg)
    }
    return c.json({ ...project, members: existingProject.members }, 200)
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

    const deletedProject = await c
      .get("db")
      .deleteFrom("projects")
      .where("id", "=", projectId)
      .execute()

    if (!deletedProject) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

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

    const existingProject = await c
      .get("db")
      .selectFrom("projects")
      .selectAll()
      .where("id", "=", projectId)
      .executeTakeFirst()
    if (!existingProject) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    if (parentId) {
      const existingParent = await c
        .get("db")
        .selectFrom("columns")
        .selectAll()
        .where("id", "=", parentId)
        .executeTakeFirst()
      if (!existingParent) {
        const msg = await t.text(ERROR_PARENT_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }
    }
    const existingColumn = await c
      .get("db")
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
    const column = await c
      .get("db")
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

    await c
      .get("db")
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

    const existingColumn = await c
      .get("db")
      .selectFrom("columns")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirstOrThrow()
    if (!existingColumn) {
      const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const column = await c
      .get("db")
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
    const existingColumn = await c
      .get("db")
      .selectFrom("columns")
      .selectAll()
      .where("id", "=", columnId)
      .executeTakeFirst()
    if (!existingColumn) {
      const msg = await t.text(ERROR_COLUMN_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    await c
      .get("db")
      .deleteFrom("columns")
      .where("id", "=", columnId)
      .executeTakeFirst()
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

    const projects = await c
      .get("db")
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

    const project = await c
      .get("db")
      .selectFrom("projects")
      .selectAll()
      .where("projects.id", "=", projectId)
      .executeTakeFirst()
    if (!project) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const { columnId } = c.req.valid("query")
    const columns = await c
      .get("db")
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

    const board = await generateBoard(c, projectId)
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
