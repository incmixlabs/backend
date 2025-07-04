import type { Context } from "@/types"
import type { Task } from "@incmix/utils/types"

import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres"

export function getProjectById(c: Context, projectId: string) {
  return c
    .get("db")
    .selectFrom("projects")
    .selectAll()
    .where("id", "=", projectId)
    .executeTakeFirst()
}

export function getProjectWithColumnsAndTasks(c: Context, projectId: string) {
  return c
    .get("db")
    .selectFrom("projects")
    .selectAll()
    .select((eb) => [
      "id",
      "name",
      "orgId",
      "createdBy",
      "updatedBy",
      "createdAt",
      "updatedAt",
      "createdBy",
      "updatedBy",
      jsonArrayFrom(
        eb
          .selectFrom("labels")
          .select([
            "id",
            "order",
            "createdAt",
            "updatedAt",
            "createdBy",
            "updatedBy",
            "projectId",
            "type",
            "name",
            "color",
            "description",
          ])
          .whereRef("projectId", "=", "projects.id")
      ).as("labels"),
      jsonArrayFrom(
        eb
          .selectFrom("tasks")
          .select([
            "id",
            "projectId",
            "name",
            "statusId",
            "priorityId",
            "taskOrder",
            "startDate",
            "endDate",
            "createdAt",
            "updatedAt",
            "createdBy",
            "updatedBy",
            "projectId",
            "name",
            "description",
            "acceptanceCriteria",
            "checklist",
            "refUrls",
            "labelsTags",
            "attachments",
            "parentTaskId",
            "completed",
          ])
          .whereRef("projectId", "=", "projects.id")
      ).as("tasks"),
    ])
    .where("projects.id", "=", projectId)
    .executeTakeFirst()
}

export async function getTaskWithChecklists(c: Context, taskId: string) {
  const tasksQuery = buildTaskQuery(c)

  tasksQuery.where("tasks.id", "=", taskId)

  const task = await tasksQuery.executeTakeFirst()

  if (!task) return null

  const createdBy = task.createdBy
  const updatedBy = task.updatedBy
  const assignedTo = task.assignedTo

  if (createdBy && updatedBy && assignedTo)
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
    }

  return null
}

export async function isProjectMember(
  c: Context,
  projectId: string,
  userId: string
) {
  const member = await c
    .get("db")
    .selectFrom("projectMembers")
    .selectAll()
    .where((eb) =>
      eb.and([eb("projectId", "=", projectId), eb("userId", "=", userId)])
    )
    .executeTakeFirst()

  return !!member
}

export async function getTasks(
  c: Context,
  userId: string
): Promise<Omit<Task, "subTasks" | "comments">[]> {
  const tasksQuery = buildTaskQuery(c)

  tasksQuery.where("taskAssignments.userId", "=", userId)

  const tasks = await tasksQuery.execute()

  return tasks.flatMap((task) => {
    const createdBy = task.createdBy
    const updatedBy = task.updatedBy
    const assignedTo = task.assignedTo

    if (createdBy && updatedBy && assignedTo)
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
      }

    return []
  })
}

function buildTaskQuery(c: Context) {
  return c
    .get("db")
    .selectFrom("tasks")
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
            "st.taskOrder as order",
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
    .innerJoin("taskAssignments", "tasks.id", "taskAssignments.taskId")
}
