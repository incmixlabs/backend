import type { Project, Task } from "@incmix-api/utils/zod-schema"
import type { FastifyRequest } from "fastify"
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres"

type Context = FastifyRequest

export async function findRoleByName(c: Context, name: string, orgId: string) {
  if (!c.db) return null
  const role = await c.db
    .selectFrom("roles")
    .selectAll()
    .where((eb) =>
      eb.and([eb("organizationId", "=", orgId), eb("name", "=", name)])
    )
    .executeTakeFirst()

  if (!role) {
    const systemRole = await c.db
      ?.selectFrom("roles")
      .selectAll()
      .where((eb) =>
        eb.and([eb("isSystemRole", "=", true), eb("name", "=", name)])
      )
      .executeTakeFirst()

    return systemRole
  }

  return role
}

export function buildProjectQuery(c: Context) {
  return c.db
    ?.selectFrom("projects")
    .select((eb) => [
      "id",
      "name",
      "orgId",
      "createdAt",
      "updatedAt",
      "status",
      "startDate",
      "endDate",
      "budget",
      "company",
      "logo",
      "description",
      "checklist",
      jsonArrayFrom(
        eb
          .selectFrom("projectMembers")
          .innerJoin(
            "userProfiles as users",
            "projectMembers.userId",
            "users.id"
          )
          .select([
            "projectMembers.userId as id",
            "projectMembers.role",
            "projectMembers.isOwner",
            "users.fullName as name",
            "users.email",
            "users.avatar",
          ])
          .whereRef("projectId", "=", "projects.id")
      ).as("members"),
      jsonObjectFrom(
        eb
          .selectFrom("userProfiles")
          .select(["id", "fullName", "email", "avatar"])
          .whereRef("id", "in", "projects.createdBy")
      ).as("createdBy"),
      jsonObjectFrom(
        eb
          .selectFrom("userProfiles")
          .select(["id", "fullName", "email", "avatar"])
          .whereRef("id", "in", "projects.updatedBy")
      ).as("updatedBy"),
    ])
}

export async function getProjectById(
  c: Context,
  projectId: string
): Promise<Project | undefined> {
  // const query = buildProjectQuery(c)
  const project = await c.db
    ?.selectFrom("projects")
    .select((eb) => [
      "id",
      "name",
      "orgId",
      "createdAt",
      "updatedAt",
      "status",
      "startDate",
      "endDate",
      "budget",
      "company",
      "logo",
      "description",
      "checklist",
      "acceptanceCriteria",
      jsonArrayFrom(
        eb
          .selectFrom("projectMembers")
          .innerJoin(
            "userProfiles as users",
            "projectMembers.userId",
            "users.id"
          )
          .select([
            "projectMembers.userId as id",
            "projectMembers.role",
            "projectMembers.isOwner",
            "users.fullName as name",
            "users.email",
            "users.avatar",
          ])
          .whereRef("projectId", "=", "projects.id")
      ).as("members"),
      jsonObjectFrom(
        eb
          .selectFrom("userProfiles")
          .select(["id", "fullName", "email", "avatar"])
          .whereRef("id", "=", "projects.createdBy")
      ).as("createdBy"),
      jsonObjectFrom(
        eb
          .selectFrom("userProfiles")
          .select(["id", "fullName", "email", "avatar"])
          .whereRef("id", "=", "projects.updatedBy")
      ).as("updatedBy"),
    ])
    .where("projects.id", "=", projectId)
    .executeTakeFirst()

  if (!project) return

  const createdBy = project.createdBy
  if (!createdBy) return

  const updatedBy = project.updatedBy
  if (!updatedBy) return

  return {
    ...project,
    members: project.members.flatMap((member) => {
      if (!member) return []

      return {
        id: member.id,
        role: member.role ?? "member",
        isOwner: member.isOwner,
        name: member.name,
        email: member.email,
        avatar: member.avatar,
      }
    }),
    createdBy: {
      id: createdBy.id,
      name: createdBy.fullName,
      image: createdBy.avatar ?? undefined,
    },
    updatedBy: {
      id: updatedBy.id,
      name: updatedBy.fullName,
      image: updatedBy.avatar ?? undefined,
    },
    progress:
      project.checklist.length > 0
        ? (100 * project.checklist.filter((c) => c.checked).length) /
          project.checklist.length
        : 0,
    timeLeft: "0d 0h 0m",
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    startDate: project.startDate?.toISOString(),
    endDate: project.endDate?.toISOString(),
  }
}

export async function getUserProjects(
  c: Context,
  memberId: string,
  orgId: string
) {
  const projects = await c.db
    ?.selectFrom("projects")
    .select((eb) => [
      "projects.id",
      "projects.name",
      "projects.orgId",
      "projects.createdAt",
      "projects.updatedAt",
      "projects.status",
      "projects.startDate",
      "projects.endDate",
      "projects.budget",
      "projects.company",
      "projects.logo",
      "projects.description",
      "projects.checklist",
      "projects.acceptanceCriteria",
      jsonArrayFrom(
        eb
          .selectFrom("projectMembers")
          .innerJoin(
            "userProfiles as users",
            "projectMembers.userId",
            "users.id"
          )
          .select([
            "projectMembers.userId as id",
            "users.fullName as name",
            "users.email",
            "users.avatar",
          ])
          .whereRef("projectId", "=", "projects.id")
      ).as("members"),
    ])
    .innerJoin("projectMembers", "projects.id", "projectMembers.projectId")
    .where((eb) =>
      eb.and([
        eb("projectMembers.userId", "=", memberId),
        eb("projects.orgId", "=", orgId),
      ])
    )
    .execute()

  return projects?.map((project) => ({
    ...project,
    progress:
      project.checklist.length > 0
        ? (100 * project.checklist.filter((c) => c.checked).length) /
          project.checklist.length
        : 0,
    timeLeft: "0d 0h 0m",
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    startDate: project.startDate?.toISOString(),
  }))
}

export async function isOrgMember(c: Context, orgId: string, userId: string) {
  const member = await c.db
    ?.selectFrom("members")
    .selectAll()
    .where((eb) => eb.and([eb("orgId", "=", orgId), eb("userId", "=", userId)]))
    .executeTakeFirst()

  return !!member
}

export async function getProjectMembers(c: Context, projectId: string) {
  const members = await c.db
    ?.selectFrom("projectMembers")
    .innerJoin("userProfiles as users", "projectMembers.userId", "users.id")
    .select([
      "projectMembers.userId as id",
      "projectMembers.role",
      "projectMembers.isOwner",
      "users.fullName as name",
      "users.email",
      "users.avatar",
    ])
    .where("projectMembers.projectId", "=", projectId)
    .execute()

  return members?.map((member) => ({
    id: member.id,
    role: member.role ?? "member",
    isOwner: member.isOwner,
    name: member.name,
    email: member.email,
    avatar: member.avatar,
  }))
}

export async function isProjectMember(
  c: Context,
  projectId: string,
  userId: string
) {
  const member = await c.db
    ?.selectFrom("projectMembers")
    .selectAll()
    .where((eb) =>
      eb.and([eb("projectId", "=", projectId), eb("userId", "=", userId)])
    )
    .executeTakeFirst()

  return !!member
}

export async function getTaskById(c: Context, taskId: string) {
  const task = await buildTaskQuery(c)
    ?.where("tasks.id", "=", taskId)
    .executeTakeFirst()

  if (!task) return null

  const _createdBy = task.createdBy
  const _updatedBy = task.updatedBy
  const _assignedTo = task.assignedTo

  const createdBy = task.createdBy
  const updatedBy = task.updatedBy
  const assignedTo = task.assignedTo ?? []

  if (createdBy && updatedBy)
    return {
      ...task,
      createdBy: {
        id: createdBy.id,
        name: createdBy.name,
        image: createdBy.image ?? undefined,
      },
      updatedBy: {
        id: updatedBy.id,
        name: updatedBy.name,
        image: updatedBy.image ?? undefined,
      },
      assignedTo: assignedTo.map((a) => ({
        id: a.id,
        name: a.name,
        image: a.image ?? undefined,
      })),
      createdAt: task.createdAt.getTime(),
      updatedAt: task.updatedAt.getTime(),
      startDate: task.startDate?.getTime(),
      endDate: task.endDate?.getTime(),
      isSubtask: task.parentTaskId !== null,
      comments: [],
    }

  return null
}

export async function getTasks(c: Context, userId: string): Promise<Task[]> {
  const tasksQuery = buildTaskQuery(c)

  const _tasks = await buildTaskQuery(c)
    ?.where((eb) =>
      eb.exists(
        eb
          .selectFrom("taskAssignments")
          .select("taskAssignments.taskId")
          .whereRef("taskAssignments.taskId", "=", "tasks.id")
          .where("taskAssignments.userId", "=", userId)
      )
    )
    .execute()
  const tasks = (await tasksQuery?.execute()) ?? []

  return tasks.flatMap((task) => {
    const createdBy = task.createdBy
    const updatedBy = task.updatedBy
    const assignedTo = task.assignedTo ?? []

    if (createdBy && updatedBy)
      return {
        ...task,
        createdBy: {
          id: createdBy.id,
          name: createdBy.name,
          image: createdBy.image ?? undefined,
        },
        updatedBy: {
          id: updatedBy.id,
          name: updatedBy.name,
          image: updatedBy.image ?? undefined,
        },
        assignedTo: assignedTo.map((a) => ({
          id: a.id,
          name: a.name,
          image: a.image ?? undefined,
        })),
        createdAt: task.createdAt.getTime(),
        updatedAt: task.updatedAt.getTime(),
        startDate: task.startDate?.getTime(),
        endDate: task.endDate?.getTime(),
        isSubtask: task.parentTaskId !== null,
        comments: [],
      }

    return []
  })
}

function buildTaskQuery(c: Context) {
  return c.db
    ?.selectFrom("tasks")
    .select((eb) => [
      "tasks.id",
      "tasks.name",
      "tasks.description",
      "tasks.taskOrder",
      "tasks.createdAt",
      "tasks.updatedAt",
      "tasks.projectId",
      "tasks.statusId",
      "tasks.priorityId",
      "tasks.startDate",
      "tasks.endDate",
      "tasks.acceptanceCriteria",
      "tasks.checklist",
      "tasks.refUrls",
      "tasks.labelsTags",
      "tasks.attachments",
      "tasks.parentTaskId",
      "tasks.completed",
      jsonArrayFrom(
        eb
          .selectFrom("tasks as st")
          .select([
            "st.id",
            "st.taskOrder",
            "st.name",
            "st.description",
            "st.completed",
          ])
          .whereRef("tasks.id", "=", "tasks.parentTaskId")
      ).as("subTasks"),
      jsonArrayFrom(
        eb
          .selectFrom("taskAssignments")
          .innerJoin("userProfiles as up", "taskAssignments.userId", "up.id")
          .select(["up.id", "up.fullName as name", "up.avatar as image"])
          .whereRef("taskAssignments.taskId", "=", "tasks.id")
      ).as("assignedTo"),
      jsonObjectFrom(
        eb
          .selectFrom("userProfiles as up2")
          .select(["up2.id", "up2.fullName as name", "up2.avatar as image"])
          .whereRef("up2.id", "=", "tasks.createdBy")
      ).as("createdBy"),
      jsonObjectFrom(
        eb
          .selectFrom("userProfiles as up3")
          .select(["up3.id", "up3.fullName as name", "up3.avatar as image"])
          .whereRef("up3.id", "=", "tasks.updatedBy")
      ).as("updatedBy"),
    ])
}
