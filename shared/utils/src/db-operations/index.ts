import { type Kysely, sql } from "kysely"
import { jsonArrayFrom } from "kysely/helpers/postgres"

export interface FindUserOptions {
  includeProfile?: boolean
  includeOrganizations?: boolean
  includeProjects?: boolean
}

export class CommonDbOperations {
  constructor(private db: Kysely<any>) {}

  async findUserByEmail(email: string, options: FindUserOptions = {}) {
    let query = this.db
      .selectFrom("users")
      .where("users.email", "=", email)
      .selectAll("users")

    if (options.includeProfile) {
      query = query
        .leftJoin("userProfiles", "users.id", "userProfiles.userId")
        .select([
          "userProfiles.firstName",
          "userProfiles.lastName",
          "userProfiles.avatar",
          "userProfiles.bio",
        ])
    }

    if (options.includeOrganizations) {
      query = query.select((eb) =>
        jsonArrayFrom(
          eb
            .selectFrom("userOrganizations")
            .leftJoin(
              "organizations",
              "userOrganizations.organizationId",
              "organizations.id"
            )
            .select([
              "organizations.id",
              "organizations.name",
              "organizations.slug",
              "userOrganizations.role",
            ])
            .whereRef("userOrganizations.userId", "=", "users.id")
        ).as("organizations")
      )
    }

    if (options.includeProjects) {
      query = query.select((eb) =>
        jsonArrayFrom(
          eb
            .selectFrom("projectMembers")
            .leftJoin("projects", "projectMembers.projectId", "projects.id")
            .select([
              "projects.id",
              "projects.name",
              "projects.slug",
              "projectMembers.role",
            ])
            .whereRef("projectMembers.userId", "=", "users.id")
        ).as("projects")
      )
    }

    return await query.executeTakeFirst()
  }

  async findUserById(id: string, options: FindUserOptions = {}) {
    let query = this.db
      .selectFrom("users")
      .where("users.id", "=", id)
      .selectAll("users")

    if (options.includeProfile) {
      query = query
        .leftJoin("userProfiles", "users.id", "userProfiles.userId")
        .select([
          "userProfiles.firstName",
          "userProfiles.lastName",
          "userProfiles.avatar",
          "userProfiles.bio",
        ])
    }

    if (options.includeOrganizations) {
      query = query.select((eb) =>
        jsonArrayFrom(
          eb
            .selectFrom("userOrganizations")
            .leftJoin(
              "organizations",
              "userOrganizations.organizationId",
              "organizations.id"
            )
            .select([
              "organizations.id",
              "organizations.name",
              "organizations.slug",
              "userOrganizations.role",
            ])
            .whereRef("userOrganizations.userId", "=", "users.id")
        ).as("organizations")
      )
    }

    if (options.includeProjects) {
      query = query.select((eb) =>
        jsonArrayFrom(
          eb
            .selectFrom("projectMembers")
            .leftJoin("projects", "projectMembers.projectId", "projects.id")
            .select([
              "projects.id",
              "projects.name",
              "projects.slug",
              "projectMembers.role",
            ])
            .whereRef("projectMembers.userId", "=", "users.id")
        ).as("projects")
      )
    }

    return await query.executeTakeFirst()
  }

  async checkProjectMembership(userId: string, projectId: string) {
    const member = await this.db
      .selectFrom("projectMembers")
      .where("userId", "=", userId)
      .where("projectId", "=", projectId)
      .select(["role", "createdAt"])
      .executeTakeFirst()

    return member
  }

  async checkOrganizationMembership(userId: string, organizationId: string) {
    const member = await this.db
      .selectFrom("userOrganizations")
      .where("userId", "=", userId)
      .where("organizationId", "=", organizationId)
      .select(["role", "createdAt"])
      .executeTakeFirst()

    return member
  }

  async getProjectWithMembers(projectId: string) {
    const project = await this.db
      .selectFrom("projects")
      .where("projects.id", "=", projectId)
      .selectAll("projects")
      .select((eb) =>
        jsonArrayFrom(
          eb
            .selectFrom("projectMembers")
            .leftJoin("users", "projectMembers.userId", "users.id")
            .leftJoin("userProfiles", "users.id", "userProfiles.userId")
            .select([
              "users.id",
              "users.email",
              "userProfiles.firstName",
              "userProfiles.lastName",
              "userProfiles.avatar",
              "projectMembers.role",
            ])
            .whereRef("projectMembers.projectId", "=", "projects.id")
        ).as("members")
      )
      .executeTakeFirst()

    return project
  }

  async getOrganizationWithMembers(organizationId: string) {
    const organization = await this.db
      .selectFrom("organizations")
      .where("organizations.id", "=", organizationId)
      .selectAll("organizations")
      .select((eb) =>
        jsonArrayFrom(
          eb
            .selectFrom("userOrganizations")
            .leftJoin("users", "userOrganizations.userId", "users.id")
            .leftJoin("userProfiles", "users.id", "userProfiles.userId")
            .select([
              "users.id",
              "users.email",
              "userProfiles.firstName",
              "userProfiles.lastName",
              "userProfiles.avatar",
              "userOrganizations.role",
            ])
            .whereRef(
              "userOrganizations.organizationId",
              "=",
              "organizations.id"
            )
        ).as("members")
      )
      .executeTakeFirst()

    return organization
  }

  async paginatedQuery<_T>(
    baseQuery: any,
    page = 1,
    limit = 10,
    orderBy?: { column: string; direction: "asc" | "desc" }
  ) {
    const offset = (page - 1) * limit
    let query = baseQuery

    // Add ordering if specified
    if (orderBy) {
      query = query.orderBy(orderBy.column, orderBy.direction)
    }

    // Get total count
    const countQuery = query
      .clearSelect()
      .select(sql`count(*)::int`.as("count"))
    const countResult = await countQuery.executeTakeFirst()
    const totalCount = countResult?.count || 0

    // Get paginated results
    const results = await query.limit(limit).offset(offset).execute()

    return {
      data: results,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1,
      },
    }
  }

  async softDelete(table: string, id: string) {
    return await this.db
      .updateTable(table)
      .set({
        deletedAt: new Date(),
        isDeleted: true,
      })
      .where("id", "=", id)
      .execute()
  }

  async restore(table: string, id: string) {
    return await this.db
      .updateTable(table)
      .set({
        deletedAt: null,
        isDeleted: false,
      })
      .where("id", "=", id)
      .execute()
  }
}
