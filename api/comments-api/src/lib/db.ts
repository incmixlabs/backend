import type { Comment } from "@incmix-api/utils/zod-schema"
import type { ExpressionBuilder } from "kysely"
import { jsonObjectFrom } from "kysely/helpers/postgres"
import type { Context } from "@/types"

export function getProjectById(c: Context, projectId: string) {
  return c.db
    ?.selectFrom("projects")
    .selectAll()
    .where("projects.id", "=", projectId)
    .executeTakeFirst()
}

export function getTaskById(c: Context, taskId: string) {
  return c.db
    ?.selectFrom("tasks")
    .selectAll()
    .where("tasks.id", "=", taskId)
    .executeTakeFirst()
}

export async function isOrgMember(c: Context, orgId: string, userId: string) {
  const member = await c.db
    ?.selectFrom("members")
    .selectAll()
    .where((eb: ExpressionBuilder<any, any>) =>
      eb.and([eb("orgId", "=", orgId), eb("userId", "=", userId)])
    )
    .executeTakeFirst()

  return !!member
}

export async function getCommentById(
  c: Context,
  commentId: string
): Promise<Comment | undefined> {
  const query = buildCommentQuery(c)
  if (!query) return

  const comment = await query
    .where("comments.id", "=", commentId)
    .executeTakeFirst()

  if (!comment) return

  const createdBy = comment.createdBy as any
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
  const query = buildCommentQuery(c)
  if (!query) return []

  const comments = await query
    .innerJoin("taskComments", "comments.id", "taskComments.commentId")
    .where("taskComments.taskId", "=", taskId)
    .orderBy("comments.createdAt desc")
    .execute()

  return comments.flatMap((comment: any) => {
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
  const query = buildCommentQuery(c)
  if (!query) return []

  const comments = await query
    .innerJoin("projectComments", "comments.id", "projectComments.commentId")
    .where("projectComments.projectId", "=", projectId)
    .orderBy("comments.createdAt desc")
    .execute()

  return comments.flatMap((comment: any) => {
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
  return c.db
    ?.selectFrom("comments")
    .select([
      "comments.id",
      "comments.content",
      "comments.createdAt",
      (eb: ExpressionBuilder<any, any>) =>
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
