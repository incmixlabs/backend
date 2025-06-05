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
      jsonArrayFrom(
        eb
          .selectFrom("columns")
          .select([
            "id",
            "columnOrder",
            "createdAt",
            "updatedAt",
            "parentId",
            "projectId",
            "label",
            "updatedBy",
            "createdBy",
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
            "columnId",
            "content",
            "updatedBy",
            "createdBy",
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
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      name: data.name,
      orgId: data.orgId,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    },
  }
}
