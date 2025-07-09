import type { Context } from "@/types"
import type { Project } from "@incmix-api/utils/zod-schema"

import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres"

export function buildProjectQuery(c: Context) {
  return c
    .get("db")
    .selectFrom("projects")
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
  const project = await c
    .get("db")
    .selectFrom("projects")
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
    progress: 0,
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
  const projects = await c
    .get("db")
    .selectFrom("projects")
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

  return projects.map((project) => ({
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
  const member = await c
    .get("db")
    .selectFrom("members")
    .selectAll()
    .where((eb) => eb.and([eb("orgId", "=", orgId), eb("userId", "=", userId)]))
    .executeTakeFirst()

  return !!member
}
