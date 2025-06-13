import type { Context } from "@/types"

import { jsonArrayFrom } from "kysely/helpers/postgres"

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

export function getTaskWithChecklists(c: Context, taskId: string) {
  return c
    .get("db")
    .selectFrom("tasks")
    .select((eb) => [
      "tasks.id",
      "tasks.content",
      "tasks.status",
      "tasks.assignedTo",
      "tasks.createdAt",
      "tasks.updatedAt",
      "tasks.currentTimelineStartDate",
      "tasks.currentTimelineEndDate",
      "tasks.actualTimelineStartDate",
      "tasks.actualTimelineEndDate",
      "tasks.title",
      "tasks.taskOrder",
      "tasks.columnId",
      "tasks.projectId",
      "tasks.createdBy",
      "tasks.updatedBy",
      jsonArrayFrom(
        eb
          .selectFrom("taskChecklists")
          .select([
            "taskChecklists.id as id",
            "taskChecklists.status as status",
            "taskChecklists.title as title",
          ])
          .whereRef("taskId", "=", "tasks.id")
      ).as("checklists"),
      jsonArrayFrom(
        eb
          .selectFrom("taskComments")
          .innerJoin("comments", "taskComments.commentId", "comments.id")
          .select([
            "comments.id as id",
            "comments.content as content",
            "comments.createdAt as createdAt",
            "comments.updatedAt as updatedAt",
            "comments.createdBy as createdBy",
            "comments.updatedBy as updatedBy",
            "comments.userId as userId",
          ])
          .whereRef("taskId", "=", "tasks.id")
      ).as("comments"),
    ])
    .where("tasks.id", "=", taskId)
    .executeTakeFirst()
}

export function isProjectMember(c: Context, projectId: string, userId: string) {
  const member = c
    .get("db")
    .selectFrom("projectMembers")
    .selectAll()
    .where((eb) =>
      eb.and([eb("projectId", "=", projectId), eb("userId", "=", userId)])
    )
    .executeTakeFirst()

  return !!member
}
