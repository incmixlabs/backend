import type { Context } from "@/types"

import type { Action, Subject } from "@incmix/utils/types"

import type {
  KyselyDb,
  NewPermission,
  NewRole,
  UpdatedPermission,
  UpdatedRole,
} from "@incmix-api/utils/db-schema"

export function findAllRoles(c: Context, orgId?: string) {
  let query = c.get("db").selectFrom("roles").selectAll()

  if (orgId) {
    query = query.where((eb) => eb.or([eb("organizationId", "=", orgId)]))
  }

  return query.execute()
}

export function insertRole(c: Context, role: NewRole) {
  return c
    .get("db")
    .insertInto("roles")
    .values(role)
    .returningAll()
    .executeTakeFirst()
}

export function findRoleByName(c: Context, name: string, orgId?: string) {
  let query = c.get("db").selectFrom("roles").selectAll()

  if (orgId) {
    query = query.where((eb) =>
      eb.and([eb("organizationId", "=", orgId), eb("name", "=", name)])
    )
  } else {
    query = query.where("name", "=", name)
  }

  return query.executeTakeFirst()
}

export function findRoleById(c: Context, id: number, orgId?: string) {
  let query = c.get("db").selectFrom("roles").selectAll()

  if (orgId) {
    query = query.where((eb) =>
      eb.and([eb("organizationId", "=", orgId), eb("id", "=", id)])
    )
  } else {
    query = query.where("id", "=", id)
  }

  return query.executeTakeFirst()
}

export function updateRoleById(c: Context, role: UpdatedRole, id: number) {
  return c
    .get("db")
    .updateTable("roles")
    .set(role)
    .where("id", "=", id)
    .executeTakeFirst()
}

export async function deleteRoleById(c: Context, id: number) {
  return await c
    .get("db")
    .transaction()
    .execute(async (tx) => {
      await tx
        .deleteFrom("rolePermissions")
        .where("roleId", "=", id)
        .executeTakeFirstOrThrow()
      return await tx
        .deleteFrom("roles")
        .where("id", "=", id)
        .executeTakeFirstOrThrow()
    })
}

export function findPermissionBySubjectAndAction(
  c: Context,
  subject: Subject,
  action: Action,
  roleId: number,
  instance?: KyselyDb
) {
  return (instance ?? c.get("db"))
    .selectFrom("rolePermissions")
    .innerJoin("permissions", "permissions.id", "rolePermissions.permissionId")
    .selectAll()
    .where("permissions.resourceType", "=", subject)
    .where("permissions.action", "=", action)
    .where("rolePermissions.roleId", "=", roleId)
    .executeTakeFirst()
}

export function insertPermission(
  c: Context,
  permission: NewPermission,
  instance?: KyselyDb
) {
  return (instance ?? c.get("db"))
    .insertInto("permissions")
    .values(permission)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export function updatePermission(
  c: Context,
  permission: UpdatedPermission,
  id: number,
  instance?: KyselyDb
) {
  return (instance ?? c.get("db"))
    .updateTable("permissions")
    .set(permission)
    .where("id", "=", id)
    .executeTakeFirstOrThrow()
}

export function deletePermission(
  c: Context,
  id: number,
  roleId: number,
  instance?: KyselyDb
) {
  return (instance ?? c.get("db"))
    .deleteFrom("rolePermissions")
    .where((eb) =>
      eb.and([eb("permissionId", "=", id), eb("roleId", "=", roleId)])
    )
    .executeTakeFirstOrThrow()
}
