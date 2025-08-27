import type { Comment } from "@incmix-api/utils/zod-schema"
import { jsonObjectFrom } from "kysely/helpers/postgres"
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

export async function getCommentById(
  c: Context,
  commentId: string
): Promise<Comment | undefined> {
  const comment = await buildCommentQuery(c)
    .where("comments.id", "=", commentId)
    .executeTakeFirst()

  if (!comment) return

  const createdBy = comment.createdBy
  if (!createdBy) return

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.getTime(),
    createdBy: {
      id: createdBy.id,
      name: createdBy.name,
      image: createdBy.image ?? undefined,
    },
  }
}

export async function listTaskComments(c: Context, taskId: string) {
  const comments = await buildCommentQuery(c)
    .innerJoin("taskComments", "comments.id", "taskComments.commentId")
    .where("taskComments.taskId", "=", taskId)
    .orderBy("comments.createdAt desc")
    .execute()

  return comments.flatMap((comment) => {
    const createdBy = comment.createdBy
    if (!createdBy) return []

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.getTime(),
      createdBy: {
        id: createdBy.id,
        name: createdBy.name,
        image: createdBy.image ?? undefined,
      },
    }
  })
}

export async function listProjectComments(c: Context, projectId: string) {
  const comments = await buildCommentQuery(c)
    .innerJoin("projectComments", "comments.id", "projectComments.commentId")
    .where("projectComments.projectId", "=", projectId)
    .orderBy("comments.createdAt desc")
    .execute()

  return comments.flatMap((comment) => {
    const createdBy = comment.createdBy
    if (!createdBy) return []

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.getTime(),
      createdBy: {
        id: createdBy.id,
        name: createdBy.name,
        image: createdBy.image ?? undefined,
      },
    }
  })
}

function buildCommentQuery(c: Context) {
  return c
    .get("db")
    .selectFrom("comments")
    .select((eb) => [
      "comments.id",
      "comments.content",
      "comments.createdAt",
      jsonObjectFrom(
        eb
          .selectFrom("userProfiles")
          .select([
            "userProfiles.id",
            "userProfiles.fullName as name",
            "userProfiles.avatar as image",
          ])
          .where("userProfiles.id", "=", "comments.createdBy")
      ).as("createdBy"),
    ])
}
