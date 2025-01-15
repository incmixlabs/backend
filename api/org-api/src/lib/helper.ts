import type { Role } from "@/dbSchema"
import type { MemberRole } from "@incmix/shared/types"

export function getRoleIdByName(dbRoles: Role[], name: MemberRole) {
  const role = dbRoles.find((r) => r.name === name)

  return role?.id
}
