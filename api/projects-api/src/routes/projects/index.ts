import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import type { NewProjectMember } from "@incmix-api/utils/db-schema"
import {
  BadRequestError,
  ConflictError,
  processError,
  ServerError,
  UnauthorizedError,
  UnprocessableEntityError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { ChecklistItem } from "@incmix-api/utils/zod-schema"
import { ChecklistItemSchema } from "@incmix-api/utils/zod-schema"
import type { FastifyInstance, FastifyPlugin } from "fastify"
import fp from "fastify-plugin"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { nanoid } from "nanoid"
import {
  ERROR_CHECKLIST_CREATE_FAILED,
  ERROR_CHECKLIST_IDS_REQUIRED,
  ERROR_CHECKLIST_REMOVE_FAILED,
  ERROR_CHECKLIST_UPDATE_FAILED,
  ERROR_ORG_NOT_FOUND,
  ERROR_PROJECT_CREATE_FAILED,
  ERROR_PROJECT_EXISTS,
  ERROR_PROJECT_MEMBER_ALREADY_EXISTS,
  ERROR_PROJECT_NOT_FOUND,
  ERROR_PROJECT_UPDATE_FAILED,
} from "@/lib/constants"
import {
  findRoleByName,
  getProjectById,
  getProjectMembers as getProjectMembersFromDb,
  getUserProjects,
} from "@/lib/db"
import { getOrganizationById } from "@/lib/services"
import {
  addProjectChecklistSchema,
  addProjectMembersSchema,
  createProjectSchema,
  deleteProjectSchema,
  getProjectMembersSchema,
  getProjectReferenceSchema,
  listProjectsSchema,
  removeProjectChecklistSchema,
  removeProjectMembersSchema,
  updateProjectChecklistSchema,
  updateProjectSchema,
} from "./openapi"

const projectRoutes: FastifyPlugin = (
  fastify: FastifyInstance,
  _options: any
) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  // Create Project
  app.post("/", { schema: createProjectSchema }, async (request, reply) => {
    try {
      const user = request.user
      const t = await useTranslation(request)
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
      } = request.body

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
      const checklistResult =
        ChecklistItemSchema.array().safeParse(parsedChecklist)
      if (!checklistResult.success) {
        const msg = await t.text(ERROR_PROJECT_CREATE_FAILED)
        throw new BadRequestError(msg)
      }
      const validatedChecklist = checklistResult.data

      const org = await getOrganizationById(request, orgId)
      if (!org) {
        const msg = await t.text(ERROR_ORG_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }

      const existingProject = await request.db
        ?.selectFrom("projects")
        .selectAll()
        .where((eb) =>
          eb.and([eb("name", "=", name), eb("orgId", "=", org.id)])
        )
        .executeTakeFirst()

      if (existingProject) {
        const msg = await t.text(ERROR_PROJECT_EXISTS)
        throw new ConflictError(msg)
      }

      const createdProject = await request.db
        ?.transaction()
        .execute(async (tx) => {
          let logoUrl: string | null = null
          if (logo) {
            // Handle file upload logic here
            // For now, we'll skip the S3 upload logic
            logoUrl = null
          }

          // Create the project
          const project = await tx
            .insertInto("projects")
            .values({
              id: id ?? nanoid(),
              name,
              orgId: org.id,
              description: description ?? null,
              logo: logoUrl,
              company: company ?? null,
              budget: budget ?? null,
              startDate: startDate ? new Date(startDate).toISOString() : null,
              endDate: endDate ? new Date(endDate).toISOString() : null,
              status: status ?? "pending",
              checklist: JSON.stringify(validatedChecklist),
              acceptanceCriteria: JSON.stringify(validatedAcceptanceCriteria),
              createdBy: user.id,
              updatedBy: user.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .returningAll()
            .executeTakeFirst()

          if (!project) {
            const msg = await t.text(ERROR_PROJECT_CREATE_FAILED)
            throw new ServerError(msg)
          }

          // Add project members
          const projectMembers: NewProjectMember[] = []

          // Add the creator as owner
          projectMembers.push({
            projectId: project.id,
            userId: user.id,
            role: "owner",
            roleId: 1,
            isOwner: true,
            createdBy: user.id,
            updatedBy: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })

          // Add additional members if provided
          if (members && Array.isArray(members) && members.length > 0) {
            for (const member of members) {
              const role = await findRoleByName(
                request,
                (member as any).role,
                org.id
              )
              if (role) {
                projectMembers.push({
                  projectId: project.id,
                  userId: (member as any).userId,
                  roleId: role.id,
                  role: role.name,
                  isOwner: false,
                  createdBy: user.id,
                  updatedBy: user.id,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })
              }
            }
          }

          await tx.insertInto("projectMembers").values(projectMembers).execute()

          return project
        })

      if (!createdProject) {
        const msg = await t.text(ERROR_PROJECT_CREATE_FAILED)
        throw new ServerError(msg)
      }

      const projectWithDetails = await getProjectById(
        request,
        createdProject.id
      )
      return reply.code(201).send(projectWithDetails)
    } catch (error) {
      return processError(request, reply, error)
    }
  })

  // List Projects
  app.get("/:orgId", { schema: listProjectsSchema }, async (request, reply) => {
    try {
      const user = request.user
      const t = await useTranslation(request)
      if (!user) {
        const msg = await t.text(ERROR_UNAUTHORIZED)
        throw new UnauthorizedError(msg)
      }

      const { orgId } = request.params

      const org = await getOrganizationById(request, orgId)
      if (!org) {
        const msg = await t.text(ERROR_ORG_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }

      const projects = await getUserProjects(request, user.id, org.id)
      return reply.send(projects)
    } catch (error) {
      return processError(request, reply, error)
    }
  })

  // Get Project Members
  app.get(
    "/:id/members",
    { schema: getProjectMembersSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { id } = request.params

        const project = await getProjectById(request, id)
        if (!project) {
          const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
          throw new UnprocessableEntityError(msg)
        }

        const members = await getProjectMembersFromDb(request, id)
        return reply.send(members)
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Add Project Members
  app.post(
    "/:id/members",
    { schema: addProjectMembersSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { id } = request.params
        const { members } = request.body

        const project = await getProjectById(request, id)
        if (!project) {
          const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
          throw new UnprocessableEntityError(msg)
        }

        // Check if members already exist
        for (const member of members) {
          const existingMember = await request.db
            ?.selectFrom("projectMembers")
            .selectAll()
            .where((eb) =>
              eb.and([eb("projectId", "=", id), eb("userId", "=", member.id)])
            )
            .executeTakeFirst()

          if (existingMember) {
            const msg = await t.text(ERROR_PROJECT_MEMBER_ALREADY_EXISTS)
            throw new ConflictError(msg)
          }
        }

        // Add members
        const projectMembers: NewProjectMember[] = []
        for (const member of members) {
          const role = await findRoleByName(request, member.role, project.orgId)
          if (role) {
            projectMembers.push({
              projectId: id,
              userId: member.id,
              roleId: role.id,
              role: role.name,
              isOwner: false,
              createdBy: user.id,
              updatedBy: user.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }
        }

        await request.db
          ?.insertInto("projectMembers")
          .values(projectMembers)
          .execute()

        const updatedProject = await getProjectById(request, id)
        return reply.send(updatedProject)
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Remove Project Members
  app.delete(
    "/:id/members",
    { schema: removeProjectMembersSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { id } = request.params
        const { memberIds } = request.body

        const project = await getProjectById(request, id)
        if (!project) {
          const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
          throw new UnprocessableEntityError(msg)
        }

        await request.db
          ?.deleteFrom("projectMembers")
          .where((eb) =>
            eb.and([eb("projectId", "=", id), eb("userId", "in", memberIds)])
          )
          .execute()

        const updatedProject = await getProjectById(request, id)
        return reply.send(updatedProject)
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Update Project
  app.put("/:id", { schema: updateProjectSchema }, async (request, reply) => {
    try {
      const user = request.user
      const t = await useTranslation(request)
      if (!user) {
        const msg = await t.text(ERROR_UNAUTHORIZED)
        throw new UnauthorizedError(msg)
      }

      const { id } = request.params
      const updateData = request.body

      const project = await getProjectById(request, id)
      if (!project) {
        const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
        throw new UnprocessableEntityError(msg)
      }

      const updatedProject = await request.db
        ?.updateTable("projects")
        .set({
          ...updateData,
          updatedBy: user.id,
          updatedAt: new Date().toISOString(),
        })
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirst()

      if (!updatedProject) {
        const msg = await t.text(ERROR_PROJECT_UPDATE_FAILED)
        throw new ServerError(msg)
      }

      const projectWithDetails = await getProjectById(request, id)
      return reply.send(projectWithDetails)
    } catch (error) {
      return processError(request, reply, error)
    }
  })

  // Delete Project
  app.delete(
    "/:id",
    { schema: deleteProjectSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { id } = request.params

        const project = await getProjectById(request, id)
        if (!project) {
          const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
          throw new UnprocessableEntityError(msg)
        }

        await request.db?.transaction().execute(async (tx) => {
          // Delete project members
          await tx
            .deleteFrom("projectMembers")
            .where("projectId", "=", id)
            .execute()

          // Delete project
          await tx.deleteFrom("projects").where("id", "=", id).execute()
        })

        return reply.send({ message: "Project deleted successfully" })
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Add Project Checklist
  app.post(
    "/:id/checklists",
    { schema: addProjectChecklistSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { id } = request.params
        const { checklist } = request.body

        const project = await getProjectById(request, id)
        if (!project) {
          const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
          throw new UnprocessableEntityError(msg)
        }

        const newChecklist: ChecklistItem[] = [
          ...project.checklist,
          ...(Array.isArray(checklist) ? checklist : [checklist]),
        ]

        const updatedProject = await request.db
          ?.updateTable("projects")
          .set({
            checklist: JSON.stringify(newChecklist),
            updatedBy: user.id,
            updatedAt: new Date().toISOString(),
          })
          .where("id", "=", id)
          .returningAll()
          .executeTakeFirst()

        if (!updatedProject) {
          const msg = await t.text(ERROR_CHECKLIST_CREATE_FAILED)
          throw new ServerError(msg)
        }

        const projectWithDetails = await getProjectById(request, id)
        return reply.code(201).send(projectWithDetails)
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Update Project Checklist
  app.put(
    "/:projectId/checklists/:checklistId",
    { schema: updateProjectChecklistSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { projectId, checklistId } = request.params
        const updateData = request.body

        const project = await getProjectById(request, projectId)
        if (!project) {
          const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
          throw new UnprocessableEntityError(msg)
        }

        const updatedChecklist = project.checklist.map((item) => {
          if (item.id === checklistId) {
            return { ...item, ...updateData }
          }
          return item
        })

        const updatedProject = await request.db
          ?.updateTable("projects")
          .set({
            checklist: JSON.stringify(updatedChecklist),
            updatedBy: user.id,
            updatedAt: new Date().toISOString(),
          })
          .where("id", "=", projectId)
          .returningAll()
          .executeTakeFirst()

        if (!updatedProject) {
          const msg = await t.text(ERROR_CHECKLIST_UPDATE_FAILED)
          throw new ServerError(msg)
        }

        const projectWithDetails = await getProjectById(request, projectId)
        return reply.send(projectWithDetails)
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Remove Project Checklist
  app.delete(
    "/:id/checklists",
    { schema: removeProjectChecklistSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { id } = request.params
        const { checklistIds } = request.body

        if (!checklistIds || checklistIds.length === 0) {
          const msg = await t.text(ERROR_CHECKLIST_IDS_REQUIRED)
          throw new BadRequestError(msg)
        }

        const project = await getProjectById(request, id)
        if (!project) {
          const msg = await t.text(ERROR_PROJECT_NOT_FOUND)
          throw new UnprocessableEntityError(msg)
        }

        const updatedChecklist = project.checklist.filter(
          (item) => !checklistIds.includes(item.id)
        )

        const updatedProject = await request.db
          ?.updateTable("projects")
          .set({
            checklist: JSON.stringify(updatedChecklist),
            updatedBy: user.id,
            updatedAt: new Date().toISOString(),
          })
          .where("id", "=", id)
          .returningAll()
          .executeTakeFirst()

        if (!updatedProject) {
          const msg = await t.text(ERROR_CHECKLIST_REMOVE_FAILED)
          throw new ServerError(msg)
        }

        const projectWithDetails = await getProjectById(request, id)
        return reply.send(projectWithDetails)
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Get Project Reference
  app.get(
    "/reference",
    { schema: getProjectReferenceSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        return reply.send({
          statuses: ["pending", "in_progress", "completed", "cancelled"],
          roles: ["owner", "admin", "member", "viewer"],
          priorities: ["low", "medium", "high", "critical"],
        })
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )
}

export default fp(projectRoutes)
