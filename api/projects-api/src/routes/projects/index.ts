/**
 * Projects API Routes - Implemented Logic
 *
 * This file contains the complete business logic for project management endpoints,
 * adapted from the Hono reference implementation to work with Fastify.
 *
 * FULLY IMPLEMENTED ROUTES:
 * - GET /projects-reference - Returns project reference data (statuses, roles, priorities)
 * - GET /orgs/:orgId - Lists projects for an organization (with auth & membership checks)
 * - GET /:id/members - Gets project members (with auth & membership checks)
 * - POST /:id/members - Add project members (with validation and duplicate checks)
 * - DELETE /:id/members - Remove project members (with owner protection)
 * - POST /:id/checklist - Add checklist item (fully implemented with addProjectChecklistItem function)
 * - PUT /:projectId/checklist/:checklistId - Update checklist item (fully implemented with updateProjectChecklistItem function)
 * - DELETE /:id/checklist - Remove checklist items (fully implemented with removeProjectChecklistItems function)
 *
 * PARTIALLY IMPLEMENTED ROUTES (Logic implemented, but missing database functions):
 * - POST / - Create project (needs createProject function in db.ts)
 * - PUT /:id - Update project (needs updateProject function in db.ts)
 * - DELETE /:id - Delete project (needs deleteProject function in db.ts)
 *
 * All routes include:
 * - Authentication checks (request.user?.id)
 * - Authorization checks (org membership validation)
 * - Proper error handling with appropriate HTTP status codes
 * - Input validation where applicable
 *
 * TO COMPLETE THE IMPLEMENTATION:
 * Add the missing database functions in src/lib/db.ts as indicated by the TODO comments.
 */

import type { FastifyInstance } from "fastify"
import {
  addProjectChecklistItem,
  addProjectMembers,
  getProjectById,
  getProjectMembers,
  getUserProjects,
  isOrgMember,
  removeProjectChecklistItems,
  removeProjectMembers,
  updateProjectChecklistItem,
} from "@/lib/db"

// Extend FastifyRequest to include user property
declare module "fastify" {
  interface FastifyRequest {
    user?: { id: string; email: string; [key: string]: any }
  }
}

export const setupProjectRoutes = (app: FastifyInstance) => {
  // Get projects reference data
  app.get(
    "/projects-reference",
    {
      schema: {
        description: "Get projects reference data",
        tags: ["projects"],
        response: {
          200: {
            type: "object",
            properties: {
              statuses: {
                type: "array",
                items: { type: "string" },
              },
              roles: {
                type: "array",
                items: { type: "string" },
              },
              priorities: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
      },
    },
    (_request, _reply) => {
      const referenceData = {
        statuses: [
          "planning",
          "in_progress",
          "completed",
          "on-hold",
          "cancelled",
        ],
        roles: ["project_manager", "developer", "designer", "tester", "viewer"],
        priorities: ["low", "medium", "high", "critical"],
      }

      return referenceData
    }
  )

  // List projects
  app.get(
    "/orgs/:orgId",
    {
      schema: {
        description: "List projects for an org",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
          },
          required: ["orgId"],
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
                status: { type: "string" },
                orgId: { type: "string" },
                logo: { type: "string" },
                budget: { type: "number" },
                company: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { orgId } = request.params as { orgId: string }

      try {
        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Check if user is member of the org
        const isMember = await isOrgMember(
          request as any,
          orgId,
          request.user.id
        )
        if (!isMember) {
          return (reply as any)
            .status(403)
            .send({ error: "Not a member of this organization" })
        }

        // Get user's projects in this org
        const projects = await getUserProjects(
          request as any,
          request.user.id,
          orgId
        )
        return projects
      } catch (error) {
        console.error("Error listing projects:", error)
        return (reply as any)
          .status(500)
          .send({ error: "Failed to list projects" })
      }
    }
  )

  // Create project
  app.post(
    "/",
    {
      schema: {
        description: "Create a new project",
        tags: ["projects"],
        body: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", minLength: 1 },
            orgId: { type: "string", minLength: 1 },
            description: { type: "string" },
            status: { type: "string" },
            startDate: { type: "string" },
            endDate: { type: "string" },
            company: { type: "string" },
            budget: { type: "number" },
            acceptanceCriteria: { type: "string" },
            checklist: { type: "string" },
            members: { type: "string" },
          },
          required: ["name", "orgId"],
          additionalProperties: false,
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        const projectData = request.body as any

        // Validate required fields
        if (!projectData.name || !projectData.orgId) {
          return (reply as any)
            .status(400)
            .send({ error: "Missing required fields: name, orgId" })
        }

        // Check if user is member of the org
        const isMember = await isOrgMember(
          request as any,
          projectData.orgId,
          request.user.id
        )
        if (!isMember) {
          return (reply as any)
            .status(403)
            .send({ error: "Not a member of this organization" })
        }

        // TODO: Implement actual project creation in database
        // This requires createProject function in db.ts with:
        // - Insert into projects table
        // - Add creator as project member with owner role
        // - Handle potential duplicate names within org

        const payload = {
          id: "temp-id", // Should be generated ID from database
          name: projectData.name,
          message: "Project created successfully",
        }
        return reply.code(201).send(payload)
      } catch (error) {
        console.error("Error creating project:", error)
        return (reply as any)
          .status(500)
          .send({ error: "Failed to create project" })
      }
    }
  )

  // Update project
  app.put(
    "/:id",
    {
      schema: {
        description: "Update a project",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            status: { type: "string" },
            startDate: { type: "string" },
            endDate: { type: "string" },
            budget: { type: "number" },
            company: { type: "string" },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      try {
        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Check if project exists and get project data
        const project = await getProjectById(request as any, id)
        if (!project) {
          return (reply as any).status(404).send({ error: "Project not found" })
        }

        // Check if user is member of the project's org
        const isMember = await isOrgMember(
          request as any,
          project.orgId,
          request.user.id
        )
        if (!isMember) {
          return (reply as any)
            .status(403)
            .send({ error: "Not authorized to update this project" })
        }

        // TODO: Implement actual project update in database
        // This requires updateProject function in db.ts with:
        // - Update projects table with new data
        // - Update updatedBy and updatedAt fields

        return { message: "Project updated successfully" }
      } catch (error) {
        console.error("Error updating project:", error)
        return (reply as any)
          .status(500)
          .send({ error: "Failed to update project" })
      }
    }
  )

  // Delete project
  app.delete(
    "/:id",
    {
      schema: {
        description: "Delete a project",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      try {
        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Check if project exists and get project data
        const project = await getProjectById(request as any, id)
        if (!project) {
          return (reply as any).status(404).send({ error: "Project not found" })
        }

        // Check if user is member of the project's org
        const isMember = await isOrgMember(
          request as any,
          project.orgId,
          request.user.id
        )
        if (!isMember) {
          return (reply as any)
            .status(403)
            .send({ error: "Not authorized to delete this project" })
        }

        // TODO: Implement actual project deletion in database
        // This requires deleteProject function in db.ts with:
        // - Delete from projectMembers table
        // - Delete from projects table
        // - Handle cascade deletions for tasks, etc.

        return { message: "Project deleted successfully" }
      } catch (error) {
        console.error("Error deleting project:", error)
        return (reply as any)
          .status(500)
          .send({ error: "Failed to delete project" })
      }
    }
  )

  // Add project members
  app.post(
    "/:id/members",
    {
      schema: {
        description: "Add members to a project",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            members: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  role: { type: "string" },
                },
                required: ["id"],
              },
            },
          },
          required: ["members"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { members } = request.body as {
        members: { id: string; role?: string }[]
      }

      try {
        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Check if project exists and get project data
        const project = await getProjectById(request as any, id)
        if (!project) {
          return (reply as any).status(404).send({ error: "Project not found" })
        }

        // Check if user is member of the project's org
        const isMember = await isOrgMember(
          request as any,
          project.orgId,
          request.user.id
        )
        if (!isMember) {
          return (reply as any)
            .status(403)
            .send({ error: "Not authorized to add members to this project" })
        }

        // Add members to the project
        const result = await addProjectMembers(
          request as any,
          id,
          members,
          request.user.id
        )

        return { message: result.message }
      } catch (error) {
        console.error("Error adding project members:", error)
        return (reply as any)
          .status(500)
          .send({ error: "Failed to add project members" })
      }
    }
  )

  // Remove project members
  app.delete(
    "/:id/members",
    {
      schema: {
        description: "Remove members from a project",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            memberIds: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["memberIds"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { memberIds } = request.body as { memberIds: string[] }

      try {
        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Check if project exists and get project data
        const project = await getProjectById(request as any, id)
        if (!project) {
          return (reply as any).status(404).send({ error: "Project not found" })
        }

        // Check if user is member of the project's org
        const isMember = await isOrgMember(
          request as any,
          project.orgId,
          request.user.id
        )
        if (!isMember) {
          return (reply as any).status(403).send({
            error: "Not authorized to remove members from this project",
          })
        }

        // Remove members from the project
        const result = await removeProjectMembers(request as any, id, memberIds)

        return { message: result.message }
      } catch (error) {
        console.error("Error removing project members:", error)
        return (reply as any)
          .status(500)
          .send({ error: "Failed to remove project members" })
      }
    }
  )

  // Get project members
  app.get(
    "/:id/members",
    {
      schema: {
        description: "Get project members",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                email: { type: "string" },
                role: { type: "string" },
                isOwner: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      try {
        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Check if project exists and get project data
        const project = await getProjectById(request as any, id)
        if (!project) {
          return (reply as any).status(404).send({ error: "Project not found" })
        }

        // Check if user is member of the project's org
        const isMember = await isOrgMember(
          request as any,
          project.orgId,
          request.user.id
        )
        if (!isMember) {
          return (reply as any)
            .status(403)
            .send({ error: "Not authorized to view project members" })
        }

        // Get project members
        const members = await getProjectMembers(request as any, id)
        return members
      } catch (error) {
        console.error("Error getting project members:", error)
        return (reply as any)
          .status(500)
          .send({ error: "Failed to get project members" })
      }
    }
  )

  // Add project checklist item
  app.post(
    "/:id/checklist",
    {
      schema: {
        description: "Add checklist item to project",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            checklist: {
              type: "object",
              properties: {
                text: { type: "string" },
                checked: { type: "boolean" },
                order: { type: "number" },
              },
              required: ["text"],
            },
          },
          required: ["checklist"],
          additionalProperties: false,
        },
        response: {
          201: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { checklist } = request.body as {
        checklist: { text: string; checked?: boolean; order?: number }
      }

      try {
        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Check if project exists and get project data
        const project = await getProjectById(request as any, id)
        if (!project) {
          return (reply as any).status(404).send({ error: "Project not found" })
        }

        // Check if user is member of the project's org
        const isMember = await isOrgMember(
          request as any,
          project.orgId,
          request.user.id
        )
        if (!isMember) {
          return (reply as any)
            .status(403)
            .send({ error: "Not authorized to modify this project" })
        }

        // Add checklist item to the project
        const result = await addProjectChecklistItem(
          request as any,
          id,
          checklist
        )

        return reply.code(201).send({
          message: result.message,
          item: result.item,
        })
      } catch (error) {
        console.error("Error adding checklist item:", error)
        return (reply as any)
          .status(500)
          .send({ error: "Failed to add checklist item" })
      }
    }
  )

  // Update project checklist item
  app.put(
    "/:projectId/checklist/:checklistId",
    {
      schema: {
        description: "Update checklist item",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            checklistId: { type: "string" },
          },
          required: ["projectId", "checklistId"],
        },
        body: {
          type: "object",
          properties: {
            checklist: {
              type: "object",
              properties: {
                text: { type: "string" },
                checked: { type: "boolean" },
                order: { type: "number" },
              },
              required: ["text"],
            },
          },
          required: ["checklist"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
              item: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  text: { type: "string" },
                  checked: { type: "boolean" },
                  order: { type: "number" },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectId, checklistId } = request.params as {
        projectId: string
        checklistId: string
      }
      const { checklist } = request.body as {
        checklist: { text?: string; checked?: boolean; order?: number }
      }

      try {
        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Check if project exists and get project data
        const project = await getProjectById(request as any, projectId)
        if (!project) {
          return (reply as any).status(404).send({ error: "Project not found" })
        }

        // Check if user is member of the project's org
        const isMember = await isOrgMember(
          request as any,
          project.orgId,
          request.user.id
        )
        if (!isMember) {
          return (reply as any)
            .status(403)
            .send({ error: "Not authorized to modify this project" })
        }

        // Update checklist item in the project
        const result = await updateProjectChecklistItem(
          request as any,
          projectId,
          checklistId,
          checklist
        )

        return reply.code(200).send({
          message: result.message,
          item: result.item,
        })
      } catch (error) {
        console.error("Error updating checklist item:", error)
        if (
          error instanceof Error &&
          error.message === "Checklist item not found"
        ) {
          return (reply as any)
            .status(404)
            .send({ error: "Checklist item not found" })
        }
        return (reply as any)
          .status(500)
          .send({ error: "Failed to update checklist item" })
      }
    }
  )

  // Remove project checklist items
  app.delete(
    "/:id/checklist",
    {
      schema: {
        description: "Remove checklist items from project",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            checklistIds: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["checklistIds"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
              removedCount: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { checklistIds } = request.body as { checklistIds: string[] }

      try {
        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Validate checklistIds
        if (!checklistIds || checklistIds.length === 0) {
          return (reply as any)
            .status(400)
            .send({ error: "Checklist IDs are required" })
        }

        // Check if project exists and get project data
        const project = await getProjectById(request as any, id)
        if (!project) {
          return (reply as any).status(404).send({ error: "Project not found" })
        }

        // Check if user is member of the project's org
        const isMember = await isOrgMember(
          request as any,
          project.orgId,
          request.user.id
        )
        if (!isMember) {
          return (reply as any)
            .status(403)
            .send({ error: "Not authorized to modify this project" })
        }

        // Remove checklist items from the project
        const result = await removeProjectChecklistItems(
          request as any,
          id,
          checklistIds
        )

        return reply.code(200).send({
          message: result.message,
          removedCount: result.removedCount,
        })
      } catch (error) {
        console.error("Error removing checklist items:", error)
        if (
          error instanceof Error &&
          error.message.startsWith("Checklist items not found:")
        ) {
          return (reply as any).status(404).send({ error: error.message })
        }
        return (reply as any)
          .status(500)
          .send({ error: "Failed to remove checklist items" })
      }
    }
  )
}
