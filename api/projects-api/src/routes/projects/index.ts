import {
  ERROR_CHECKLIST_CREATE_FAILED,
  ERROR_CHECKLIST_NOT_FOUND,
  ERROR_CHECKLIST_UPDATE_FAILED,
  ERROR_COLUMN_CREATE_FAILED,
  ERROR_COLUMN_EXISTS,
  ERROR_COLUMN_NOT_FOUND,
  ERROR_COLUMN_UPDATE_FAILED,
  ERROR_COMMENT_CREATE_FAILED,
  ERROR_COMMENT_NOT_FOUND,
  ERROR_COMMENT_UPDATE_FAILED,
  ERROR_ORG_NOT_FOUND,
  ERROR_PARENT_NOT_FOUND,
  ERROR_PRESIGNED_URL,
  ERROR_PROJECT_CREATE_FAILED,
  ERROR_PROJECT_EXISTS,
  ERROR_PROJECT_MEMBER_ALREADY_EXISTS,
  ERROR_PROJECT_MEMBER_CREATE_FAILED,
  ERROR_PROJECT_MEMBER_REMOVE_FAILED,
  ERROR_PROJECT_NOT_FOUND,
  ERROR_PROJECT_UPDATE_FAILED,
} from "@/lib/constants"
import { generateBoard, getProjectWithMembers, isOrgMember } from "@/lib/db"
import { getOrganizationById } from "@/lib/services"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import type {
  NewComment,
  NewProjectComment,
  NewProjectMember,
  UpdatedComment,
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
  addProjectChecklist,
  addProjectMembers,
  createProject,
  deleteProject,
  listProjects,
  removeProjectChecklist,
  removeProjectMembers,
  updateProject,
  updateProjectChecklist,
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
      throw new UnauthorizedError(msg)
    }
    const { name, orgId } = c.req.valid("form")

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
        // let logoUrl: string | null = null
        // if (logo) {
        //   const fileName = `projects/${id}.jpg`
        //   const presignedUrlResponse = await fetch(
        //     `${env(c).FILES_API_URL}/presigned-upload?fileName=${encodeURIComponent(
        //       fileName
        //     )}`,
        //     {
        //       method: "GET",
        //       headers: c.req.raw.headers,
        //     }
        //   )

        //   if (!presignedUrlResponse.ok) {
        //     const msg = await t.text(ERROR_PRESIGNED_URL)
        //     throw new UnprocessableEntityError(msg)
        //   }

        //   const presignedUrl = (await presignedUrlResponse.json()) as {
        //     url: string
        //   }

        //   await fetch(presignedUrl.url, {
        //     method: "PUT",
        //     body: logo,
        //     headers: {
        //       "Content-Type": logo.type,
        //     },
        //   })

        //   const [url] = presignedUrl.url.split("?")
        //   logoUrl = url
        // }
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
          })
          .returningAll()
          .executeTakeFirst()

        if (!project) {
          const msg = await t.text(ERROR_PROJECT_CREATE_FAILED)
          throw new BadRequestError(msg)
        }

        const insertableMembers = [
          {
            projectId: id,
            userId: user.id,
            role: "owner",
            isOwner: true,
            createdBy: user.id,
            updatedBy: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]

        const insertedMembers = await tx
          .insertInto("projectMembers")
          .values(insertableMembers)
          .returningAll()
          .execute()

        if (insertedMembers.length !== insertableMembers.length) {
          const msg = await t.text(ERROR_PROJECT_MEMBER_CREATE_FAILED)
          throw new BadRequestError(msg)
        }

        const newProject = await getProjectWithMembers(c, id)

        return newProject
      })

    return c.json(createdProject, 201)
  } catch (error) {
    return await processError<typeof createProject>(c, error, [
      "{{ default }}",
      "create-project",
    ])
  }
})

// projectRoutes.openapi(addProjectMembers, async (c) => {
//   try {
//     const user = c.get("user")
//     const t = await useTranslation(c)
//     if (!user) {
//       const msg = await t.text(ERROR_UNAUTHORIZED)
//       throw new UnauthorizedError(msg)
//     }
//     const { members } = c.req.valid("json")
//     const { id: projectId } = c.req.valid("param")
//     const existingProject = await getProjectWithMembers(c, projectId)
//     if (!existingProject) {
//       const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
//       throw new UnprocessableEntityError(msg)
//     }

//     const insertableMembers = await Promise.all(
//       members.map<Promise<NewProjectMember>>(async (member) => {
//         const existingMember = existingProject.members.find(
//           (m) => m.id === member.id
//         )
//         if (existingMember) {
//           const msg = await t.text(ERROR_PROJECT_MEMBER_ALREADY_EXISTS, {
//             memberName: existingMember.name,
//           })
//           throw new ConflictError(msg)
//         }

//         if (!isOrgMember(c, existingProject.orgId, member.id)) {
//           const msg = await t.text(ERROR_UNAUTHORIZED)
//           throw new UnauthorizedError(msg)
//         }

//         return {
//           id: member.id,
//           role: member.role,
//           isOwner: false,
//           projectId,
//           userId: member.id,
//           createdBy: user.id,
//           updatedBy: user.id,
//           createdAt: new Date().toISOString(),
//           updatedAt: new Date().toISOString(),
//         }
//       })
//     )
//     const insertedMembers = await c
//       .get("db")
//       .insertInto("projectMembers")
//       .values(insertableMembers)
//       .returningAll()
//       .execute()

//     if (insertedMembers.length !== insertableMembers.length) {
//       const msg = await t.text(ERROR_PROJECT_MEMBER_CREATE_FAILED)
//       throw new BadRequestError(msg)
//     }
//     const updatedProject = await getProjectWithMembers(c, projectId)

//     return c.json(updatedProject, 200)
//   } catch (error) {
//     return await processError<typeof addProjectMembers>(c, error, [
//       "{{ default }}",
//       "add-project-members",
//     ])
//   }
// })

// projectRoutes.openapi(removeProjectMembers, async (c) => {
//   try {
//     const user = c.get("user")
//     const t = await useTranslation(c)
//     if (!user) {
//       const msg = await t.text(ERROR_UNAUTHORIZED)
//       throw new UnauthorizedError(msg)
//     }
//     const { memberIds } = c.req.valid("json")
//     const { id: projectId } = c.req.valid("param")
//     const existingProject = await getProjectWithMembers(c, projectId)
//     if (!existingProject) {
//       const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
//       throw new UnprocessableEntityError(msg)
//     }

//     const removedMembers = await c
//       .get("db")
//       .deleteFrom("projectMembers")
//       .where((eb) =>
//         eb.and([eb("projectId", "=", projectId), eb("userId", "in", memberIds)])
//       )
//       .execute()

//     if (removedMembers.length !== memberIds.length) {
//       const msg = await t.text(ERROR_PROJECT_MEMBER_REMOVE_FAILED)
//       throw new BadRequestError(msg)
//     }
//     const updatedProject = await getProjectWithMembers(c, projectId)

//     return c.json(updatedProject, 200)
//   } catch (error) {
//     return await processError<typeof removeProjectMembers>(c, error, [
//       "{{ default }}",
//       "remove-project-members",
//     ])
//   }
// })

projectRoutes.openapi(updateProject, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { id, name } = c.req.valid("json")
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

    const updatedProject = await getProjectWithMembers(c, id)
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

    const projects = await c
      .get("db")
      .selectFrom("projects")
      .select([
        "id",
        "name",
        "createdBy",
        "updatedBy",
        "createdAt",
        "updatedAt",
        "orgId",
      ])
      // .innerJoin("projectMembers", "projects.id", "projectMembers.projectId")
      // .where("projectMembers.userId", "=", user.id)
      .execute()

    return c.json(projects, 200)
  } catch (error) {
    return await processError<typeof listProjects>(c, error, [
      "{{ default }}",
      "list-projects",
    ])
  }
})

// projectRoutes.openapi(addProjectChecklist, async (c) => {
//   try {
//     const user = c.get("user")
//     const t = await useTranslation(c)
//     if (!user) {
//       const msg = await t.text(ERROR_UNAUTHORIZED)
//       throw new UnauthorizedError(msg)
//     }

//     const { checklist } = c.req.valid("json")
//     const { id: projectId } = c.req.valid("param")
//     const existingProject = await getProjectWithMembers(c, projectId)
//     if (!existingProject) {
//       const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
//       throw new UnprocessableEntityError(msg)
//     }

//     const id = nanoid(6)
//     const newChecklist: NewProjectChecklist = {
//       id,
//       projectId,
//       title: checklist.title,
//       status: "todo",
//       createdBy: user.id,
//       updatedBy: user.id,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     }

//     const createdChecklist = await c
//       .get("db")
//       .insertInto("projectChecklists")
//       .values(newChecklist)
//       .returningAll()
//       .executeTakeFirst()

//     if (!createdChecklist) {
//       const msg = await t.text(ERROR_CHECKLIST_CREATE_FAILED)
//       throw new BadRequestError(msg)
//     }

//     const updatedProject = await getProjectWithMembers(c, projectId)

//     return c.json(updatedProject, 201)
//   } catch (error) {
//     return await processError<typeof addProjectChecklist>(c, error, [
//       "{{ default }}",
//       "add-project-checklist",
//     ])
//   }
// })

// projectRoutes.openapi(updateProjectChecklist, async (c) => {
//   try {
//     const user = c.get("user")
//     const t = await useTranslation(c)
//     if (!user) {
//       const msg = await t.text(ERROR_UNAUTHORIZED)
//       throw new UnauthorizedError(msg)
//     }

//     const { checklist } = c.req.valid("json")
//     const { id } = c.req.valid("param")

//     const existingChecklist = await c
//       .get("db")
//       .selectFrom("projectChecklists")
//       .selectAll()
//       .where("id", "=", id)
//       .executeTakeFirst()

//     if (!existingChecklist) {
//       const msg = await t.text(ERROR_CHECKLIST_NOT_FOUND)
//       throw new UnprocessableEntityError(msg)
//     }

//     const updates: UpdatedProjectChecklist = {
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
//       .updateTable("projectChecklists")
//       .set(updates)
//       .where("id", "=", existingChecklist.id)
//       .returningAll()
//       .executeTakeFirst()

//     if (!updatedChecklist) {
//       const msg = await t.text(ERROR_CHECKLIST_UPDATE_FAILED)
//       throw new BadRequestError(msg)
//     }

//     const updatedProject = await getProjectWithMembers(
//       c,
//       existingChecklist.projectId
//     )

//     return c.json(updatedProject, 200)
//   } catch (error) {
//     return await processError<typeof updateProjectChecklist>(c, error, [
//       "{{ default }}",
//       "update-project-checklist",
//     ])
//   }
// })

// projectRoutes.openapi(removeProjectChecklist, async (c) => {
//   try {
//     const user = c.get("user")
//     const t = await useTranslation(c)
//     if (!user) {
//       const msg = await t.text(ERROR_UNAUTHORIZED)
//       throw new UnauthorizedError(msg)
//     }

//     const { checklistIds } = c.req.valid("json")
//     const { id: projectId } = c.req.valid("param")
//     const existingProject = await getProjectWithMembers(c, projectId)
//     if (!existingProject) {
//       const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
//       throw new UnprocessableEntityError(msg)
//     }

//     await c
//       .get("db")
//       .deleteFrom("projectChecklists")
//       .where((eb) =>
//         eb.and([eb("projectId", "=", projectId), eb("id", "in", checklistIds)])
//       )
//       .execute()

//     const updatedProject = await getProjectWithMembers(c, projectId)

//     return c.json(updatedProject, 200)
//   } catch (error) {
//     return await processError<typeof removeProjectChecklist>(c, error, [
//       "{{ default }}",
//       "remove-project-checklist",
//     ])
//   }
// })

export default projectRoutes
