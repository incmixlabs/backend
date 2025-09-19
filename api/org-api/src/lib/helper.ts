import type { Action, SubjectTuple } from "@incmix/utils/types"
import { UnauthorizedError } from "@incmix-api/utils/errors"
import type { FastifyRequest } from "fastify"

export async function throwUnlessUserCan(
  request: FastifyRequest,
  action: Action,
  subject: SubjectTuple,
  orgId?: string
) {
  const rbac = request.context?.rbac
  if (!rbac) {
    throw new UnauthorizedError("RBAC not available")
  }
  const can = await rbac.hasOrgPermission(action, subject, orgId)
  if (!can) {
    throw new UnauthorizedError("You are not authorized to perform this action")
  }
}
