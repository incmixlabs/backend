import type { Context } from "@/types"
import { UnauthorizedError } from "@incmix-api/utils/errors"
import type { Action, SubjectTuple } from "@incmix/utils/types"
import { findAllRoles } from "./db"

export async function getRoleIdByName(c: Context, name: string) {
  const dbRoles = await findAllRoles(c)
  const role = dbRoles.find((r) => r.name === name)

  return role?.id
}

export async function throwUnlessUserCan(
  c: Context,
  action: Action,
  subject: SubjectTuple,
  orgId: string
) {
  const rbac = c.get("rbac")
  const can = await rbac.hasOrgPermission(action, subject, orgId)
  if (!can) {
    throw new UnauthorizedError("You are not authorized to perform this action")
  }
}
