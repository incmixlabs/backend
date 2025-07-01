// @ts-nocheck FIX type errors
import type { Context } from "@/types"
import type { Board, NestedColumns } from "@incmix/utils/types"

import { jsonArrayFrom } from "kysely/helpers/postgres"

export function getProjectById(c: Context, projectId: string) {
  return c
    .get("db")
    .selectFrom("projects")
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
          .selectFrom("columns")
          .select([
            "id",
            "columnOrder",
            "createdAt",
            "updatedAt",
            "createdBy",
            "updatedBy",
            "parentId",
            "projectId",
            "label",
          ])
          .whereRef("projectId", "=", "projects.id")
      ).as("columns"),
      jsonArrayFrom(
        eb
          .selectFrom("tasks")
          .select([
            "id",
            "taskOrder",
            "createdAt",
            "updatedAt",
            "createdBy",
            "updatedBy",
            "columnId",
            "content",
            "assignedTo",
            "projectId",
            "status",
          ])
          .whereRef("projectId", "=", "projects.id")
      ).as("tasks"),
    ])
    .where("projects.id", "=", projectId)
    .executeTakeFirst()
}

export async function generateBoard(
  c: Context,
  projectId: string
): Promise<Board | undefined> {
  const data = await getProjectById(c, projectId)
  if (!data) return

  const columnMap: Record<string, NestedColumns> = {}

  data.columns.forEach((column) => {
    columnMap[column.id] = {
      ...column,
      children: [],
      tasks: data.tasks.filter((task) => task.columnId === column.id),
    }
  })

  const nestedColumns: NestedColumns[] = []

  data.columns.forEach((column) => {
    if (column.parentId) {
      const child = columnMap[column.id]
      // If the category has a parent, add it to the parent's children
      if (child) columnMap[column.parentId]?.children?.push(child)
    } else {
      // If the category has no parent, it's a root category
      const child = columnMap[column.id]
      if (child) nestedColumns.push(child)
    }
  })

  return {
    columns: nestedColumns,
    tasks: data.tasks,
    project: {
      id: data.id,
      name: data.name,
      orgId: data.orgId,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
  }
}

export function getProjectWithMembers(c: Context, projectId: string) {
  return c
    .get("db")
    .selectFrom("projects")
    .select((eb) => [
      "projects.id",
      "projects.name",
      "projects.orgId",
      "projects.createdBy",
      "projects.updatedBy",
      "projects.createdAt",
      "projects.updatedAt",
      "projects.currentTimelineStartDate",
      "projects.currentTimelineEndDate",
      "projects.actualTimelineStartDate",
      "projects.actualTimelineEndDate",
      "projects.budgetEstimate",
      "projects.budgetActual",
      "projects.description",
      "projects.company",
      "projects.status",
      "projects.logo",
      jsonArrayFrom(
        eb
          .selectFrom("projectChecklists")
          .select(["id", "status", "title"])
          .whereRef("projectId", "=", "projects.id")
      ).as("checklists"),
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
          .whereRef("projectMembers.projectId", "=", "projects.id")
      ).as("members"),
      jsonArrayFrom(
        eb
          .selectFrom("projectComments")
          .innerJoin("comments", "projectComments.commentId", "comments.id")
          .innerJoin("userProfiles as users", "comments.userId", "users.id")
          .select([
            "comments.id",
            "comments.content",
            "comments.userId",
            "comments.createdAt",
            "comments.updatedAt",
            "users.fullName as userName",
            "users.email as userEmail",
            "users.avatar as userAvatar",
          ])
          .whereRef("projectComments.projectId", "=", "projects.id")
      ).as("comments"),
    ])
    .where("projects.id", "=", projectId)
    .executeTakeFirst()
}

export async function isOrgMember(c: Context, orgId: string, userId: string) {
  const member = await c
    .get("db")
    .selectFrom("members")
    .selectAll()
    .where((eb) => eb.and([eb("orgId", "=", orgId), eb("userId", "=", userId)]))
    .executeTakeFirst()

  return !!member
}
