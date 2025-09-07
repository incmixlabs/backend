import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import type {
  AppAbility,
  Permission,
  SubjectTuple,
  AuthUser as User,
} from "@incmix/utils/types"
import type {
  KyselyDb,
  PermissionAction,
  RoleScope,
} from "@incmix-api/utils/db-schema"
import { UnauthorizedError } from "@incmix-api/utils/errors"
import type { FastifyRequest } from "fastify"

export type MemberPermissions = {
  orgPermissions: {
    role: { name: string; id: number }
    description?: string
    permissions: Permission[]
    orgId: string
    orgName: string
  }[]
  projectPermissions: {
    role: { name: string; id: number }
    description?: string
    permissions: Permission[]
    projectId: string
    projectName: string
  }[]
}

export class PermissionService {
  private db: KyselyDb
  private user: User
  private memberPermissions: Promise<MemberPermissions>

  constructor(request: FastifyRequest) {
    const user = request.user
    if (!user) {
      throw new UnauthorizedError()
    }
    const db = request.db
    if (!db) {
      throw new Error("Database connection not available")
    }
    this.db = db
    this.user = user
    this.memberPermissions = this.getUserPermissionsFromDb()
  }

  async getAllPermissions(orgId?: string) {
    const query = this.db
      .selectFrom("rolePermissions")
      .innerJoin("roles", "rolePermissions.roleId", "roles.id")
      .innerJoin(
        "permissions",
        "rolePermissions.permissionId",
        "permissions.id"
      )
      .select([
        "roles.name as roleName",
        "permissions.action",
        "permissions.resourceType",
        "permissions.name as permissionName",
        "permissions.description as permissionDescription",
        "roles.scope",
        "roles.id as roleId",
        "roles.isSystemRole as isSystemRole",
        "roles.description as roleDescription",
      ])

    if (orgId) {
      query.where("roles.organizationId", "=", orgId)
    }

    const permissionData = await query.execute()

    const permissions = permissionData.map((curr) => {
      const {
        roleName,
        roleDescription,
        scope,
        roleId,
        isSystemRole,
        action,
        resourceType,
        permissionName,
      } = curr

      return {
        role: { name: roleName, id: roleId, isSystemRole, scope },
        description: roleDescription ?? undefined,
        action,
        subject: resourceType,
        name: permissionName,
      }
    })

    return permissions
  }

  private async getUserPermissionsFromDb() {
    const permissionData = await this.db
      .selectFrom("rolePermissions")
      .innerJoin("roles", "roles.id", "rolePermissions.roleId")
      .innerJoin(
        "permissions",
        "permissions.id",
        "rolePermissions.permissionId"
      )
      .innerJoin("members", "members.roleId", "roles.id")
      .innerJoin("organisations", "organisations.id", "members.orgId")
      .leftJoin("projectMembers", "projectMembers.roleId", "roles.id")
      .leftJoin("projects", "projects.id", "projectMembers.projectId")
      .select([
        "roles.name as roleName",
        "permissions.action",
        "permissions.resourceType",
        "permissions.name as permissionName",
        "permissions.description as permissionDescription",
        "roles.scope",
        "roles.id as roleId",
        "roles.description as roleDescription",
        "organisations.id as orgId",
        "organisations.name as orgName",
        "projects.id as projectId",
        "projects.name as projectName",
      ])
      .where("members.userId", "=", this.user.id)
      .execute()

    const memberPermissions = permissionData.reduce<MemberPermissions>(
      (acc, curr) => {
        const {
          roleName,
          roleDescription,
          scope,
          orgId,
          roleId,
          orgName,
          projectId,
          projectName,
          ...permission
        } = curr

        const permissions: Permission = {
          action: permission.action,
          subject: permission.resourceType,
        }

        if (scope === "organization" || scope === "both") {
          if (!acc.orgPermissions.find((o) => o.orgId === orgId)) {
            acc.orgPermissions.push({
              role: { name: roleName, id: roleId },
              description: roleDescription ?? undefined,
              orgId,
              orgName,
              permissions: [permissions],
            })
          } else {
            acc.orgPermissions
              .find((o) => o.orgId === orgId)
              ?.permissions.push(permissions)
          }
        }
        if (scope === "project" || scope === "both") {
          if (!acc.projectPermissions.find((p) => p.projectId === projectId)) {
            acc.projectPermissions.push({
              role: { name: roleName, id: roleId },
              description: roleDescription ?? undefined,
              permissions: [permissions],
              projectId: projectId ?? "",
              projectName: projectName ?? "",
            })
          } else {
            acc.projectPermissions
              .find((p) => p.projectId === projectId)
              ?.permissions.push(permissions)
          }
        }

        return acc
      },
      {
        orgPermissions: [],
        projectPermissions: [],
      }
    )

    return memberPermissions
  }

  async getOrgPermissions(orgId: string) {
    const memberPermissions = await this.memberPermissions
    return memberPermissions.orgPermissions.find((o) => o.orgId === orgId)
  }

  async getProjectPermissions(projectId: string) {
    const memberPermissions = await this.memberPermissions
    return memberPermissions.projectPermissions.find(
      (p) => p.projectId === projectId
    )
  }

  private async buildAbility(scope: RoleScope, id: string) {
    const memberPermissions = await this.memberPermissions

    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

    if (this.user.isSuperAdmin) {
      can("manage", "all")
      return build()
    }

    if (scope === "organization") {
      const permissions =
        memberPermissions.orgPermissions
          .find((o) => o.orgId === id)
          ?.permissions.map((p) => ({
            action: p.action,
            subject: p.subject,
            conditions: p.conditions,
          })) ?? []

      for (const permission of permissions) {
        can(permission.action, permission.subject, permission.conditions)
      }

      return build()
    }
    if (scope === "project") {
      const permissions =
        memberPermissions.projectPermissions
          .find((p) => p.projectId === id)
          ?.permissions.map((p) => ({
            action: p.action,
            subject: p.subject,
            conditions: p.conditions,
          })) ?? []

      for (const permission of permissions) {
        can(permission.action, permission.subject, permission.conditions)
      }

      return build()
    }
  }

  async isOrgMember(orgId: string): Promise<boolean> {
    const member = await this.db
      .selectFrom("members")
      .select("userId")
      .where((eb) =>
        eb.and([
          eb("members.orgId", "=", orgId),
          eb("members.userId", "=", this.user.id),
        ])
      )
      .executeTakeFirst()

    return !!member
  }

  async isProjectMember(projectId: string): Promise<boolean> {
    const member = await this.db
      .selectFrom("projectMembers")
      .select("userId")
      .where((eb) =>
        eb.and([
          eb("projectMembers.projectId", "=", projectId),
          eb("projectMembers.userId", "=", this.user.id),
        ])
      )
      .executeTakeFirst()

    return !!member
  }

  async hasOrgPermission(
    action: PermissionAction,
    subject: SubjectTuple,
    id?: string
  ) {
    if (this.user.isSuperAdmin) return true

    if (!id) return false

    const isMember = await this.isOrgMember(id)
    if (!isMember) return false

    const ability = await this.buildAbility("organization", id)
    if (!ability) return false

    return ability.can(action, subject)
  }

  async hasProjectPermission(
    action: PermissionAction,
    subject: SubjectTuple,
    id?: string
  ) {
    if (this.user.isSuperAdmin) return true

    if (!id) return false
    const isMember = await this.isProjectMember(id)
    if (!isMember) return false
    const ability = await this.buildAbility("project", id)
    if (!ability) return false

    return ability.can(action, subject)
  }
}
