import type { Database } from "@incmix-api/utils/db-schema"
import { getDb } from "@incmix-api/utils/fastify-bootstrap"
import type { FastifyRequest } from "fastify"

export async function checkHandleAvailability(
  request: FastifyRequest,
  handle: string
): Promise<{ available: boolean }> {
  const db = getDb<Database>(request)

  // Check if an organization with this handle already exists
  const existingOrg = await db
    .selectFrom("organisations")
    .select("id")
    .where("handle", "=", handle)
    .executeTakeFirst()

  // Handle is available if no organization with this handle exists
  return { available: !existingOrg }
}

export async function doesOrgExist(
  request: FastifyRequest,
  name: string
): Promise<boolean> {
  const db = getDb<Database>(request)

  const existingOrg = await db
    .selectFrom("organisations")
    .select("id")
    .where("name", "=", name)
    .executeTakeFirst()

  return !!existingOrg
}

export async function ensureAtLeastOneOwner(
  request: FastifyRequest,
  orgId: string,
  userId: string,
  _userEmail: string
): Promise<boolean> {
  const db = getDb<Database>(request)

  // First, get the owner role ID
  const ownerRole = await db
    .selectFrom("roles")
    .select("id")
    .where("name", "=", "owner")
    .where("isSystemRole", "=", true)
    .executeTakeFirst()

  if (!ownerRole) {
    throw new Error("Owner role not found in database")
  }

  // Count current owners in the organization
  const ownerCount = await db
    .selectFrom("members")
    .select((eb) => eb.fn.count("userId").as("count"))
    .where("orgId", "=", orgId)
    .where("roleId", "=", ownerRole.id)
    .executeTakeFirst()

  const currentOwnerCount = Number(ownerCount?.count ?? 0)

  // Check if the user being affected is an owner
  const userMembership = await db
    .selectFrom("members")
    .select("roleId")
    .where("orgId", "=", orgId)
    .where("userId", "=", userId)
    .executeTakeFirst()

  const isUserOwner = userMembership?.roleId === ownerRole.id

  // If we're removing/changing an owner and they're the last one, we need to ensure another owner exists
  if (isUserOwner && currentOwnerCount <= 1) {
    // This would leave the organization without owners
    throw new Error(
      "Cannot remove the last owner from organization. Assign another owner first."
    )
  }

  return true
}

export async function findAllRoles(request: FastifyRequest) {
  const db = getDb<Database>(request)

  const roles = await db.selectFrom("roles").selectAll().execute()

  return roles
}

export async function findOrgByHandle(request: FastifyRequest, handle: string) {
  const db = getDb<Database>(request)

  const org = await db
    .selectFrom("organisations")
    .selectAll()
    .where("handle", "=", handle)
    .executeTakeFirst()

  if (!org) {
    throw new Error("Organization not found")
  }

  const members = await db
    .selectFrom("members")
    .innerJoin("roles", "members.roleId", "roles.id")
    .innerJoin("users", "members.userId", "users.id")
    .select(["members.userId", "roles.name as roleName", "users.email"])
    .where("members.orgId", "=", org.id)
    .execute()

  return {
    ...org,
    members: members.map((m) => ({
      userId: m.userId,
      role: m.roleName,
      email: m.email,
    })),
  }
}

export async function findOrgById(request: FastifyRequest, id: string) {
  const db = getDb<Database>(request)

  const org = await db
    .selectFrom("organisations")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()

  if (!org) {
    throw new Error("Organization not found")
  }

  const members = await db
    .selectFrom("members")
    .innerJoin("roles", "members.roleId", "roles.id")
    .innerJoin("users", "members.userId", "users.id")
    .select(["members.userId", "roles.name as roleName", "users.email"])
    .where("members.orgId", "=", org.id)
    .execute()

  return {
    ...org,
    members: members.map((m) => ({
      userId: m.userId,
      role: m.roleName,
      email: m.email,
    })),
  }
}

export async function findOrgByUserId(request: FastifyRequest, userId: string) {
  const db = getDb<Database>(request)

  const orgs = await db
    .selectFrom("members")
    .innerJoin("organisations", "members.orgId", "organisations.id")
    .innerJoin("roles", "members.roleId", "roles.id")
    .select([
      "organisations.id",
      "organisations.name",
      "organisations.handle",
      "organisations.createdAt",
      "organisations.updatedAt",
      "roles.name as roleName",
    ])
    .where("members.userId", "=", userId)
    .execute()

  return orgs.map((org) => ({
    id: org.id,
    name: org.name,
    handle: org.handle,
    role: org.roleName,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
  }))
}

export async function findOrgMemberById(
  request: FastifyRequest,
  userId: string,
  orgId: string
) {
  const db = getDb<Database>(request)

  const member = await db
    .selectFrom("members")
    .innerJoin("roles", "members.roleId", "roles.id")
    .select(["members.userId", "roles.id as roleId", "roles.name as roleName"])
    .where("members.userId", "=", userId)
    .where("members.orgId", "=", orgId)
    .executeTakeFirst()

  if (!member) {
    throw new Error("Member not found")
  }

  return {
    userId: member.userId,
    role: {
      id: member.roleId,
      name: member.roleName,
    },
  }
}

export async function findOrgMembers(request: FastifyRequest, orgId: string) {
  const db = getDb<Database>(request)

  const members = await db
    .selectFrom("members")
    .innerJoin("users", "members.userId", "users.id")
    .innerJoin("roles", "members.roleId", "roles.id")
    .leftJoin("userProfiles", "users.id", "userProfiles.id")
    .select([
      "members.userId",
      "users.email",
      "roles.name as role",
      "userProfiles.fullName",
      "userProfiles.profileImage",
    ])
    .where("members.orgId", "=", orgId)
    .execute()

  return members.map((m) => ({
    userId: m.userId,
    email: m.email,
    role: m.role,
    fullName: m.fullName,
    profileImage: m.profileImage,
  }))
}

export async function findRoleByName(request: FastifyRequest, name: string) {
  const db = getDb<Database>(request)

  const role = await db
    .selectFrom("roles")
    .selectAll()
    .where("name", "=", name)
    .where("isSystemRole", "=", true)
    .executeTakeFirst()

  if (!role) {
    return null
  }

  return role
}

export async function getUserByEmail(request: FastifyRequest, email: string) {
  const db = getDb<Database>(request)

  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst()

  return user
}

export async function insertMembers(
  request: FastifyRequest,
  members: Array<{
    userId: string
    orgId: string
    roleId: number
  }>
) {
  const db = getDb<Database>(request)

  const insertedMembers = await db
    .insertInto("members")
    .values(members)
    .returningAll()
    .execute()

  return insertedMembers
}

export async function insertOrg(
  request: FastifyRequest,
  org: {
    id: string
    name: string
    handle: string
    createdAt: string
    updatedAt: string
  }
) {
  const db = getDb<Database>(request)

  const newOrg = await db
    .insertInto("organisations")
    .values(org)
    .returningAll()
    .executeTakeFirst()

  return newOrg
}

export async function isValidUser(request: FastifyRequest, userId: string) {
  const db = getDb<Database>(request)

  const user = await db
    .selectFrom("users")
    .select("id")
    .where("id", "=", userId)
    .executeTakeFirst()

  return !!user
}

export async function addPermissionToRole(
  request: FastifyRequest,
  roleId: number,
  permissionId: number
) {
  const db = getDb<Database>(request)

  const rolePermission = await db
    .insertInto("rolePermissions")
    .values({
      roleId,
      permissionId,
      conditions: null,
      createdAt: new Date().toISOString(),
    })
    .returningAll()
    .executeTakeFirst()

  return rolePermission
}

export async function createRoleWithPermissions(
  request: FastifyRequest,
  name: string,
  description: string,
  permissions: number[],
  organizationId?: string
) {
  const db = getDb<Database>(request)

  const newRole = await db
    .insertInto("roles")
    .values({
      name,
      description,
      orgId: organizationId || null,
      isSystemRole: false,
      scope: "organization",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returningAll()
    .executeTakeFirst()

  if (!newRole) {
    throw new Error("Failed to create role")
  }

  if (permissions.length > 0) {
    await db
      .insertInto("rolePermissions")
      .values(
        permissions.map((permissionId) => ({
          roleId: newRole.id,
          permissionId,
          conditions: null,
          createdAt: new Date().toISOString(),
        }))
      )
      .execute()
  }

  return newRole
}

export async function deleteRoleById(request: FastifyRequest, roleId: number) {
  const db = getDb<Database>(request)

  await db.deleteFrom("rolePermissions").where("roleId", "=", roleId).execute()

  const deletedRole = await db
    .deleteFrom("roles")
    .where("id", "=", roleId)
    .where("isSystemRole", "=", false)
    .returningAll()
    .executeTakeFirst()

  if (!deletedRole) {
    throw new Error("Role not found or cannot delete system role")
  }

  return deletedRole
}

export async function getRolesWithPermissions(
  request: FastifyRequest,
  orgId: string
) {
  const db = getDb<Database>(request)

  const roles = await db
    .selectFrom("roles")
    .leftJoin("rolePermissions", "roles.id", "rolePermissions.roleId")
    .leftJoin("permissions", "rolePermissions.permissionId", "permissions.id")
    .select([
      "roles.id as roleId",
      "roles.name as roleName",
      "roles.description as roleDescription",
      "permissions.id as permissionId",
      "permissions.name as permissionName",
      "permissions.action",
      "permissions.resourceType",
    ])
    .where((eb) =>
      eb.or([
        eb("roles.orgId", "=", orgId),
        eb("roles.isSystemRole", "=", true),
      ])
    )
    .execute()

  const rolesMap = new Map<number, any>()

  roles.forEach((row) => {
    if (!rolesMap.has(row.roleId)) {
      rolesMap.set(row.roleId, {
        id: row.roleId,
        name: row.roleName,
        description: row.roleDescription,
        permissions: [],
      })
    }

    if (row.permissionId) {
      rolesMap.get(row.roleId).permissions.push({
        id: row.permissionId,
        name: row.permissionName,
        action: row.action,
        resourceType: row.resourceType,
      })
    }
  })

  return Array.from(rolesMap.values())
}

export async function removePermissionFromRole(
  request: FastifyRequest,
  roleId: number,
  permissionId: number
) {
  const db = getDb<Database>(request)

  const deleted = await db
    .deleteFrom("rolePermissions")
    .where("roleId", "=", roleId)
    .where("permissionId", "=", permissionId)
    .returningAll()
    .executeTakeFirst()

  if (!deleted) {
    throw new Error("Role permission not found")
  }

  return deleted
}

export async function updateRoleWithPermissions(
  request: FastifyRequest,
  roleId: number,
  name: string,
  description: string,
  permissions: number[]
) {
  const db = getDb<Database>(request)

  const updatedRole = await db
    .updateTable("roles")
    .set({
      name,
      description,
    })
    .where("id", "=", roleId)
    .where("isSystemRole", "=", false)
    .returningAll()
    .executeTakeFirst()

  if (!updatedRole) {
    throw new Error("Role not found or cannot update system role")
  }

  await db.deleteFrom("rolePermissions").where("roleId", "=", roleId).execute()

  if (permissions.length > 0) {
    await db
      .insertInto("rolePermissions")
      .values(
        permissions.map((permissionId) => ({
          roleId,
          permissionId,
          conditions: null,
          createdAt: new Date().toISOString(),
        }))
      )
      .execute()
  }

  return updatedRole
}
