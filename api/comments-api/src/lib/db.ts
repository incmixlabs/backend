import type { Context } from "@/types"

export function getProjectById(c: Context, projectId: string) {
  return c
    .get("db")
    .selectFrom("projects")
    .selectAll()
    .where("projects.id", "=", projectId)
    .executeTakeFirst()
}

export function getTaskById(c: Context, taskId: string) {
  return c
    .get("db")
    .selectFrom("tasks")
    .selectAll()
    .where("tasks.id", "=", taskId)
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

export function getCommentById(c: Context, commentId: string) {
  return c
    .get("db")
    .selectFrom("comments")
    .innerJoin("userProfiles", "comments.userId", "userProfiles.id")
    .select([
      "comments.id",
      "comments.content",
      "comments.createdAt",
      "comments.updatedAt",
      "userProfiles.fullName as userName",
      "userProfiles.email as userEmail",
      "userProfiles.avatar as userAvatar",
    ])
    .where("comments.id", "=", commentId)
    .executeTakeFirst()
}
