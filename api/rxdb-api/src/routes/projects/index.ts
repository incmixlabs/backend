import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { zValidator } from "@hono/zod-validator"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import type { Project } from "@incmix-api/utils/db-schema"
import {
  BadRequestError,
  ServerError,
  UnauthorizedError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { jsonArrayFrom } from "kysely/helpers/postgres"
import { getUserProjectIds } from "../lib/db"
import {
  ProjectSchemaWithTimeStamps,
  type ProjectWithTimeStamps,
  PullProjectsSchema,
  PushProjectsSchema,
} from "./types"

const projectsRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

projectsRoutes.post(
  "/pull",
  zValidator("query", PullProjectsSchema),
  async (c) => {
    try {
      const user = c.get("user")
      const t = await useTranslation(c)

      if (!user) {
        const msg = await t.text(ERROR_UNAUTHORIZED)
        throw new Error(msg)
      }

      // Get lastPulledAt timestamp to pull only new/updated projects
      const { lastPulledAt } = c.req.valid("query")
      // Convert lastPulledAt string to a valid date if it exists
      const lastPulledAtDate = lastPulledAt
        ? new Date(Number(lastPulledAt))
        : new Date(0)

      const projectIds = await getUserProjectIds(c, user.id)

      // Query builder to get user's projects from organizations they're members of
      const query = c
        .get("db")
        .selectFrom("projects")
        .innerJoin("userProfiles as up", "projects.createdBy", "up.id")
        .innerJoin("userProfiles as up2", "projects.updatedBy", "up2.id")
        .select((eb) => [
          "projects.id",
          "projects.name",
          "projects.orgId",
          "projects.status",
          "projects.startDate",
          "projects.endDate",
          "projects.budget",
          "projects.description",
          "projects.company",
          "projects.logo",
          "projects.checklist",
          "projects.createdAt",
          "projects.updatedAt",
          "projects.createdBy",
          "projects.updatedBy",
          "projects.acceptanceCriteria",
          "up.fullName as createdByName",
          "up.avatar as createdByImage",
          "up2.fullName as updatedByName",
          "up2.avatar as updatedByImage",
          jsonArrayFrom(
            eb
              .selectFrom("projectMembers")
              .innerJoin("userProfiles as up", "projectMembers.userId", "up.id")
              .select([
                "projectMembers.userId as id",
                "projectMembers.role",
                "projectMembers.isOwner",
                "up.fullName as name",
                "up.email",
                "up.avatar as image",
              ])
              .whereRef("projectMembers.projectId", "=", "projects.id")
          ).as("members"),
        ])
        .where((eb) => {
          const ands = [eb("projects.id", "in", projectIds)]
          if (lastPulledAt) {
            ands.push(eb("projects.updatedAt", ">=", lastPulledAtDate))
          }
          return eb.and(ands)
        })

      // Execute the query
      const projects = await query.execute()

      const results = ProjectSchemaWithTimeStamps.array().safeParse(
        projects.map(
          (project) =>
            ({
              ...project,
              startDate: project.startDate
                ? new Date(project.startDate).getTime()
                : null,
              endDate: project.endDate
                ? new Date(project.endDate).getTime()
                : null,
              createdAt: new Date(project.createdAt).getTime(),
              updatedAt: new Date(project.updatedAt).getTime(),
              progress: 0,
              timeLeft: "0",
              members: project.members.map((m) => ({
                id: m.id,
                name: m.name,
                email: m.email,
                image: m.image ?? undefined,
                role: m.role,
                isOwner: m.isOwner,
              })),
              createdBy: {
                id: project.createdBy,
                name: project.createdByName,
                image: project.createdByImage ?? undefined,
              },
              updatedBy: {
                id: project.updatedBy,
                name: project.updatedByName,
                image: project.updatedByImage ?? undefined,
              },
            }) satisfies ProjectWithTimeStamps
        )
      )

      if (!results.success) {
        throw new ServerError("Invalid projects")
      }

      // Format for RxDB sync protocol
      // RxDB expects a specific format with documents and an optional checkpoint
      return c.json(
        {
          documents: results.data,
          checkpoint: {
            updatedAt: new Date().getTime(),
          },
        },
        200
      )
    } catch (error) {
      let message = "Failed to sync projects"
      if (error instanceof Error) message = error.message

      return c.json(
        {
          message,
          success: false,
        },
        500
      )
    }
  }
)

projectsRoutes.post(
  "/push",
  zValidator("json", PushProjectsSchema),
  async (c) => {
    try {
      const user = c.get("user")
      const t = await useTranslation(c)

      if (!user) {
        const msg = await t.text(ERROR_UNAUTHORIZED)
        throw new UnauthorizedError(msg)
      }

      // Get change rows from the client
      const { changeRows } = c.req.valid("json")

      // Validate incoming data
      if (!Array.isArray(changeRows)) {
        throw new BadRequestError(
          "Invalid request format: expected an array of changed rows"
        )
      }

      const conflicts = []
      const event = {
        documents: [] as Project[],
        checkpoint: null as { id: string; updatedAt: Date } | null,
      }

      // Process each change row
      for (const changeRow of changeRows) {
        // Ensure the document belongs to the user or is assigned to them
        const newDoc = changeRow.newDocumentState

        if (!newDoc || !newDoc.id) {
          conflicts.push({
            error: "Invalid document format: missing id",
            document: newDoc,
          })
          continue
        }

        // Get the real current state from the database
        const realMasterState = await c
          .get("db")
          .selectFrom("projects")
          .innerJoin(
            "projectMembers",
            "projects.id",
            "projectMembers.projectId"
          )
          .select([
            "projects.id",
            "projects.name",
            "projects.orgId",
            "projects.status",
            "projects.startDate",
            "projects.endDate",
            "projects.budget",
            "projects.description",
            "projects.acceptanceCriteria",
            "projects.checklist",
            "projects.company",
            "projects.logo",
            "projects.createdAt",
            "projects.updatedAt",
            "projects.createdBy",
            "projects.updatedBy",
          ])
          .where("projects.id", "=", newDoc.id)
          .where("projectMembers.userId", "=", user.id)
          .executeTakeFirst()

        // Check if the user has permission to modify this project
        if (realMasterState && realMasterState.createdBy !== user.id) {
          conflicts.push({
            error: "Unauthorized to modify this project",
            document: newDoc,
          })
          continue
        }

        // Detect conflicts by comparing the assumed master state with the real master state
        if (
          (realMasterState && !changeRow.assumedMasterState) ||
          (realMasterState &&
            changeRow.assumedMasterState &&
            realMasterState.updatedAt >
              new Date(changeRow.assumedMasterState.updatedAt))
        ) {
          // We have a conflict - return the current server state
          conflicts.push(realMasterState)
        } else {
          try {
            if (realMasterState) {
              // Update existing project
              const updatedProject = await c
                .get("db")
                .updateTable("projects")
                .set({
                  name: newDoc.name,
                  description: newDoc.description,
                  status: newDoc.status,
                  startDate: newDoc.startDate
                    ? new Date(newDoc.startDate).toISOString()
                    : null,
                  endDate: newDoc.endDate
                    ? new Date(newDoc.endDate).toISOString()
                    : null,
                  budget: newDoc.budget,
                  company: newDoc.company,
                  logo: newDoc.logo,
                  checklist: JSON.stringify(newDoc.checklist),
                  acceptanceCriteria: JSON.stringify(newDoc.acceptanceCriteria),
                  updatedAt: new Date(newDoc.updatedAt).toISOString(),
                  updatedBy: user.id,
                })
                .where("id", "=", newDoc.id)
                .returningAll()
                .executeTakeFirst()

              if (updatedProject) {
                event.documents.push(updatedProject as unknown as Project)
                event.checkpoint = {
                  id: updatedProject.id,
                  updatedAt: updatedProject.updatedAt,
                }
              }
            } else {
              // Create new project - verify required fields
              if (!newDoc.name || !newDoc.orgId) {
                conflicts.push({
                  error: "Missing required fields: name and orgId are required",
                  document: newDoc,
                })
                continue
              }

              // Verify organization exists and user is a member
              const orgMember = await c
                .get("db")
                .selectFrom("members")
                .select("orgId")
                .where((eb) =>
                  eb.and([
                    eb("orgId", "=", newDoc.orgId),
                    eb("userId", "=", user.id),
                  ])
                )
                .executeTakeFirst()

              if (!orgMember) {
                conflicts.push({
                  error: "Organization not found or user is not a member",
                  document: newDoc,
                })
                continue
              }

              // Insert new project
              const insertedProject = await c
                .get("db")
                .insertInto("projects")
                .values({
                  ...newDoc,
                  createdBy: user.id,
                  updatedBy: user.id,
                  createdAt: new Date(newDoc.createdAt).toISOString(),
                  updatedAt: new Date(newDoc.updatedAt).toISOString(),
                  startDate: newDoc.startDate
                    ? new Date(newDoc.startDate).toISOString()
                    : null,
                  endDate: newDoc.endDate
                    ? new Date(newDoc.endDate).toISOString()
                    : null,
                  checklist: JSON.stringify(newDoc.checklist || []),
                  acceptanceCriteria: JSON.stringify(
                    newDoc.acceptanceCriteria || []
                  ),
                })
                .returningAll()
                .executeTakeFirst()

              if (insertedProject) {
                event.documents.push(insertedProject as unknown as Project)
                event.checkpoint = {
                  id: insertedProject.id,
                  updatedAt: insertedProject.updatedAt,
                }

                const insertableMembers = newDoc.members.map((m) => ({
                  projectId: insertedProject.id,
                  userId: m.id,
                  isOwner: m.isOwner,
                  createdBy: user.id,
                  updatedBy: user.id,
                  role: m.role,
                  roleId: 1,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }))

                // Add user as project member with owner role
                await c
                  .get("db")
                  .insertInto("projectMembers")
                  .values(insertableMembers)
                  .execute()
              }
            }
          } catch (error) {
            conflicts.push({
              error: error instanceof Error ? error.message : "Unknown error",
              document: newDoc,
            })
          }
        }
      }

      // In a real-world scenario, you might have a push stream mechanism
      // that notifies other clients about changes
      // if (event.documents.length > 0) {
      //   myPullStream$.next(event);
      // }

      // Return conflicts to the client
      return c.json(conflicts, 200)
    } catch (error) {
      let message = "Failed to sync projects from client"
      if (error instanceof Error) message = error.message

      return c.json(
        {
          message,
          success: false,
        },
        500
      )
    }
  }
)

export default projectsRoutes
