import type { Action, SubjectTuple } from "@incmix/utils/types"
import { UnauthorizedError } from "@incmix-api/utils/errors"
import type { Context } from "@/types"

export async function throwUnlessUserCan(
  c: Context,
  action: Action,
  subject: SubjectTuple,
  orgId?: string
) {
  const rbac = c.rbac
  if (!rbac) {
    throw new UnauthorizedError("RBAC not available")
  }
  const can = await rbac.hasOrgPermission(action, subject, orgId)
  if (!can) {
    throw new UnauthorizedError("You are not authorized to perform this action")
  }
}
