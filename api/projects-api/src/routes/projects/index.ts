import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import type { NewProjectMember } from "@incmix-api/utils/db-schema"
import {
  BadRequestError,
  ConflictError,
  processError,
  ServerError,
  UnauthorizedError,
  UnprocessableEntityError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { Checklist } from "@incmix-api/utils/zod-schema"
import {
  ChecklistItemSchema,
  ChecklistSchema,
} from "@incmix-api/utils/zod-schema"
import { env } from "hono/adapter"
import { sql } from "kysely"
import { nanoid } from "nanoid"
import {
  ERROR_CHECKLIST_CREATE_FAILED,
  ERROR_CHECKLIST_IDS_REQUIRED,
  ERROR_CHECKLIST_REMOVE_FAILED,
  ERROR_CHECKLIST_UPDATE_FAILED,
  ERROR_INVALID_FILE_TYPE,
  ERROR_ORG_NOT_FOUND,
  ERROR_PRESIGNED_URL,
  ERROR_PROJECT_CREATE_FAILED,
  ERROR_PROJECT_EXISTS,
  ERROR_PROJECT_MEMBER_ALREADY_EXISTS,
  ERROR_PROJECT_MEMBER_CREATE_FAILED,
  ERROR_PROJECT_NOT_FOUND,
  ERROR_PROJECT_UPDATE_FAILED,
} from "@/lib/constants"
import {
  findRoleByName,
  getProjectById,
  getProjectMembers as getProjectMembersFromDb,
  getUserProjects,
  isOrgMember,
} from "@/lib/db"
import { getOrganizationById } from "@/lib/services"
import type { HonoApp } from "@/types"
import {
  addProjectChecklist,
  addProjectMembers,
  createProject,
  deleteProject,
  getProjectMembers as getProjectMembersRoute,
  getProjectReference,
  listProjects,
  removeProjectChecklist,
  removeProjectMembers,
  updateProject,
  updateProjectChecklist,
} from "./openapi"
import { AddProjectMemberSchema } from "./types"

const projectRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

projectRoutes.openapi(createProject, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const {
      id,
      budget,
      description,
      logo,
      members,
      name,
      orgId,
      company,
      startDate,
      endDate,
      status,
      acceptanceCriteria,
      checklist,
    } = c.req.valid("form")

    // Parse acceptanceCriteria (default to [] if empty)
    const parsedAcceptanceCriteria = acceptanceCriteria
      ? JSON.parse(acceptanceCriteria)
      : []
    const acceptanceCriteriaResult = ChecklistItemSchema.array().safeParse(
      parsedAcceptanceCriteria
    )
    if (!acceptanceCriteriaResult.success) {
      const msg = await t.text(ERROR_PROJECT_CREATE_FAILED)
      throw new BadRequestError(msg)
    }

    const validatedAcceptanceCriteria = acceptanceCriteriaResult.data

    // Parse checklist (default to [] if empty)
    const parsedChecklist = checklist ? JSON.parse(checklist) : []
    const checklistResult = ChecklistSchema.array().safeParse(parsedChecklist)
    if (!checklistResult.success) {
      const msg = await t.text(ERROR_PROJECT_CREATE_FAILED)
      throw new BadRequestError(msg)
    }
    const validatedChecklist = checklistResult.data

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

    const createdProject = await c
      .get("db")
      .transaction()
      .execute(async (tx) => {
        let logoUrl: string | null = null
        if (logo) {
          // Validate that the uploaded file is an image type
          if (!logo.type.startsWith("image/")) {
            const msg = await t.text(ERROR_INVALID_FILE_TYPE)
            throw new BadRequestError(msg)
          }

          // Extract file extension from MIME type or filename
          let fileExtension = ".jpg" // default fallback

          // Try to get extension from MIME type first
          const mimeToExtension: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/png": ".png",
            "image/gif": ".gif",
            "image/webp": ".webp",
            "image/svg+xml": ".svg",
            "image/bmp": ".bmp",
            "image/tiff": ".tiff",
          }

          if (logo.type in mimeToExtension) {
            fileExtension = mimeToExtension[logo.type]
          } else if (logo.name) {
            // Fallback to extracting from filename
            const nameParts = logo.name.split(".")
            if (nameParts.length > 1) {
              const ext = `.${nameParts[nameParts.length - 1].toLowerCase()}`
              // Only use the extension if it's a known image extension
              if (Object.values(mimeToExtension).includes(ext)) {
                fileExtension = ext
              }
            }
          }

          const fileName = `projects/${id}${fileExtension}`
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
            id: id ?? nanoid(6),
            name,
            orgId,
            createdBy: user.id,
            updatedBy: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            logo: logoUrl,
            acceptanceCriteria: JSON.stringify(validatedAcceptanceCriteria),
            checklist: JSON.stringify(validatedChecklist),
            status,
            startDate,
            endDate,
            budget,
            description,
            company,
          })
          .returningAll()
          .executeTakeFirst()

        if (!project) {
          const msg = await t.text(ERROR_PROJECT_CREATE_FAILED)
          throw new BadRequestError(msg)
        }
        const role = await findRoleByName(c, "project_manager", org.id)
        if (!role) {
          const msg = await t.text(ERROR_PROJECT_MEMBER_CREATE_FAILED)
          throw new ServerError(msg)
        }
        const insertableMembers: NewProjectMember[] = [
          {
            projectId: project.id,
            userId: user.id,
            role: role.name,
            roleId: role.id,
            isOwner: true,
            createdBy: user.id,
            updatedBy: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]

        if (members) {
          const membersJson = JSON.parse(members)

          const parsedMembers = AddProjectMemberSchema.safeParse({
            members: membersJson,
          })
          if (!parsedMembers.success) {
            const msg = await t.text(ERROR_PROJECT_MEMBER_CREATE_FAILED)
            throw new BadRequestError(msg)
          }

          const memberData = parsedMembers.data.members.filter(
            (m) => m.id !== user.id
          )

          for (const member of memberData) {
            const orgMember = await isOrgMember(c, org.id, member.id)

            if (!orgMember) {
              const msg = await t.text(ERROR_UNAUTHORIZED)
              throw new UnauthorizedError(msg)
            }
          }

          const memberWithValues = await Promise.all(
            memberData.map(async (member) => {
              const role = await findRoleByName(c, member.role, org.id)
              if (!role) {
                const msg = await t.text(ERROR_PROJECT_MEMBER_CREATE_FAILED)
                throw new ServerError(msg)
              }
              return {
                projectId: project.id,
                userId: member.id,
                role: member.role,
                roleId: role.id,
                isOwner: member.id === user.id,
                createdBy: user.id,
                updatedBy: user.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            })
          )
          insertableMembers.push(...memberWithValues)
        }

        const insertedMembers = await tx
          .insertInto("projectMembers")
          .values(insertableMembers)
          .returningAll()
          .execute()

        if (insertedMembers.length !== insertableMembers.length) {
          const msg = await t.text(ERROR_PROJECT_MEMBER_CREATE_FAILED)
          throw new BadRequestError(msg)
        }

        return { project, insertedMembers }
      })

    const newProject = await getProjectById(c, createdProject.project.id)

    return c.json(newProject, 201)
  } catch (error) {
    return await processError<typeof createProject>(c, error, [
      "{{ default }}",
      "create-project",
    ])
  }
})

projectRoutes.openapi(addProjectMembers, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { members } = c.req.valid("json")
    const { id: projectId } = c.req.valid("param")
    const existingProject = await getProjectById(c, projectId)
    if (!existingProject) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const insertableMembers = await Promise.all(
      members.map(async (member) => {
        const existingMember = existingProject.members.find(
          (m) => m.id === member.id
        )
        if (existingMember) {
          const msg = await t.text(ERROR_PROJECT_MEMBER_ALREADY_EXISTS, {
            memberName: existingMember.name,
          })
          throw new ConflictError(msg)
        }
        const orgMember = await isOrgMember(c, existingProject.orgId, member.id)
        if (!orgMember) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        return {
          id: member.id,
          role: member.role,
          isOwner: false,
          projectId,
          roleId: 1,
          userId: member.id,
          createdBy: user.id,
          updatedBy: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      })
    )
    const insertedMembers = await c
      .get("db")
      .insertInto("projectMembers")
      .values(insertableMembers)
      .returningAll()
      .execute()

    if (insertedMembers.length !== insertableMembers.length) {
      const msg = await t.text(ERROR_PROJECT_MEMBER_CREATE_FAILED)
      throw new BadRequestError(msg)
    }
    const updatedProject = await getProjectById(c, projectId)

    return c.json(updatedProject, 200)
  } catch (error) {
    return await processError<typeof addProjectMembers>(c, error, [
      "{{ default }}",
      "add-project-members",
    ])
  }
})

projectRoutes.openapi(removeProjectMembers, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { memberIds } = c.req.valid("json")
    const { id: projectId } = c.req.valid("param")
    const existingProject = await getProjectById(c, projectId)
    if (!existingProject) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    await c
      .get("db")
      .deleteFrom("projectMembers")
      .where((eb) =>
        eb.and([eb("projectId", "=", projectId), eb("userId", "in", memberIds)])
      )
      .execute()

    const updatedProject = await getProjectById(c, projectId)

    return c.json(updatedProject, 200)
  } catch (error) {
    return await processError<typeof removeProjectMembers>(c, error, [
      "{{ default }}",
      "remove-project-members",
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
    const { name, description, status, startDate, endDate, budget, company } =
      c.req.valid("json")

    const { id } = c.req.valid("param")
    if (!id) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }
    const existingProject = await getProjectById(c, id)

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
        status,
        startDate,
        endDate,
        budget,
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

    const updatedProject = await getProjectById(c, id)
    return c.json(updatedProject, 200)
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
    const { id: projectId } = c.req.valid("param")

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

projectRoutes.openapi(listProjects, async (c) => {
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

    const projects = await getUserProjects(c, user.id, orgId)

    return c.json(projects, 200)
  } catch (error) {
    return await processError<typeof listProjects>(c, error, [
      "{{ default }}",
      "list-projects",
    ])
  }
})

projectRoutes.openapi(addProjectChecklist, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { checklist } = c.req.valid("json")
    const { id: projectId } = c.req.valid("param")
    const existingProject = await getProjectById(c, projectId)
    if (!existingProject) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const id = nanoid(6)
    const newChecklist: Checklist = {
      id,
      text: checklist.text,
      checked: checklist.checked,
      order: checklist.order,
    }

    const query = sql`
    UPDATE ${sql.table("projects")}
    SET checklist = COALESCE(checklist, '[]'::jsonb) || ${JSON.stringify(newChecklist)}::jsonb
    WHERE id = ${projectId}
  `

    const result = await query.execute(c.get("db"))
    if (!result.numAffectedRows) {
      const msg = await t.text(ERROR_CHECKLIST_CREATE_FAILED)
      throw new UnprocessableEntityError(msg)
    }

    const updatedProject = await getProjectById(c, projectId)

    return c.json(updatedProject, 201)
  } catch (error) {
    return await processError<typeof addProjectChecklist>(c, error, [
      "{{ default }}",
      "add-project-checklist",
    ])
  }
})

projectRoutes.openapi(updateProjectChecklist, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { checklist } = c.req.valid("json")
    const { projectId, checklistId } = c.req.valid("param")

    const updatedChecklist: Checklist = {
      id: checklistId,
      text: checklist.text,
      checked: checklist.checked,
      order: checklist.order,
    }

    const query = sql`
    UPDATE ${sql.table("projects")}
    SET checklist = (
      SELECT jsonb_agg(
        CASE
          WHEN item->>'id' = ${checklistId}::text
          THEN ${JSON.stringify(updatedChecklist)}::jsonb
          ELSE item
        END
      )
      FROM jsonb_array_elements(checklist) AS item
    )
    WHERE id = ${projectId}
  `

    const result = await query.execute(c.get("db"))
    if (!result.numAffectedRows) {
      const msg = await t.text(ERROR_CHECKLIST_UPDATE_FAILED)
      throw new UnprocessableEntityError(msg)
    }

    const updatedProject = await getProjectById(c, projectId)

    return c.json(updatedProject, 200)
  } catch (error) {
    return await processError<typeof updateProjectChecklist>(c, error, [
      "{{ default }}",
      "update-project-checklist",
    ])
  }
})

projectRoutes.openapi(removeProjectChecklist, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { checklistIds } = c.req.valid("json")
    const { id: projectId } = c.req.valid("param")

    if (!checklistIds || checklistIds.length === 0) {
      const msg = await t.text(ERROR_CHECKLIST_IDS_REQUIRED)
      throw new BadRequestError(msg)
    }

    const existingProject = await getProjectById(c, projectId)
    if (!existingProject) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const query = sql`
    UPDATE ${sql.table("projects")}
    SET checklist = (
      SELECT jsonb_agg(item)
      FROM jsonb_array_elements(checklist) AS item
      WHERE item->>'id' NOT IN (${sql.join(
        checklistIds.map((id) => sql`${id}`),
        sql`, `
      )})
    )
    WHERE id = ${projectId}
  `

    const result = await query.execute(c.get("db"))
    if (!result.numAffectedRows) {
      const msg = await t.text(ERROR_CHECKLIST_REMOVE_FAILED)
      throw new UnprocessableEntityError(msg)
    }
    const updatedProject = await getProjectById(c, projectId)

    return c.json(updatedProject, 200)
  } catch (error) {
    return await processError<typeof removeProjectChecklist>(c, error, [
      "{{ default }}",
      "remove-project-checklist",
    ])
  }
})

projectRoutes.openapi(getProjectMembersRoute, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { id: projectId } = c.req.valid("param")
    const existingProject = await getProjectById(c, projectId)
    if (!existingProject) {
      const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
      throw new UnprocessableEntityError(msg)
    }

    const members = await getProjectMembersFromDb(c, projectId)

    return c.json(members, 200)
  } catch (error) {
    return await processError<typeof getProjectMembersRoute>(c, error, [
      "{{ default }}",
      "get-project-members",
    ])
  }
})

projectRoutes.openapi(getProjectReference, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const referenceData = {
      statuses: [
        "planning",
        "in_progress",
        "completed",
        "on_hold",
        "cancelled",
      ],
      roles: ["project_manager", "developer", "designer", "tester", "viewer"],
      priorities: ["low", "medium", "high", "critical"],
    }

    return c.json(referenceData, 200)
  } catch (error) {
    return await processError<typeof getProjectReference>(c, error, [
      "{{ default }}",
      "get-project-reference",
    ])
  }
})

export default projectRoutes
