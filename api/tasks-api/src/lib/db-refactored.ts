import type { Context } from "@/types"
import { CommonDbOperations } from "@incmix-api/utils/db-operations"
import type { Task } from "@incmix-api/utils/zod-schema"
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres"

export function getDbOperations(c: Context) {
  return new CommonDbOperations(c.get("db"))
}

export function getProjectById(c: Context, projectId: string) {
  return c
    .get("db")
    .selectFrom("projects")
    .selectAll()
    .where("id", "=", projectId)
    .executeTakeFirst()
}

export async function getTaskById(c: Context, taskId: string) {
  const tasksQuery = buildTaskQuery(c)
  tasksQuery.where("tasks.id", "=", taskId)

  const task = await tasksQuery.executeTakeFirst()
  if (!task) return null

  return formatTask(task)
}

export async function isProjectMember(
  c: Context,
  projectId: string,
  userId: string
) {
  const dbOps = getDbOperations(c)
  const membership = await dbOps.checkProjectMembership(userId, projectId)
  return !!membership
}

export async function getTasks(c: Context, userId: string): Promise<Task[]> {
  const tasksQuery = buildTaskQuery(c)
  tasksQuery.where((eb) =>
    eb.exists(
      eb
        .selectFrom("taskAssignments")
        .select("taskAssignments.taskId")
        .whereRef("taskAssignments.taskId", "=", "tasks.id")
        .where("taskAssignments.userId", "=", userId)
    )
  )

  const tasks = await tasksQuery.execute()
  return tasks.flatMap((task) => {
    const formatted = formatTask(task)
    return formatted ? [formatted] : []
  })
}

export async function getTasksPaginated(
  c: Context,
  projectId: string,
  page = 1,
  limit = 10,
  orderBy?: { column: string; direction: "asc" | "desc" }
) {
  const dbOps = getDbOperations(c)
  const baseQuery = buildTaskQuery(c).where("tasks.projectId", "=", projectId)

  const result = await dbOps.paginatedQuery(baseQuery, page, limit, orderBy)

  return {
    ...result,
    data: result.data.flatMap((task: any) => {
      const formatted = formatTask(task)
      return formatted ? [formatted] : []
    }),
  }
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

function formatTask(task: any): Task | null {
  const createdBy = task.createdBy
  const updatedBy = task.updatedBy
  const assignedTo = task.assignedTo

  if (!createdBy || !updatedBy || !assignedTo) return null

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
    assignedTo: assignedTo.map((a: any) => ({
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
}
