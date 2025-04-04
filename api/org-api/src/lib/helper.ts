import type { Role } from "@/dbSchema"
import type { UserRole } from "@incmix/utils/types"

export function getRoleIdByName(dbRoles: Role[], name: UserRole) {
  const role = dbRoles.find((r) => r.name === name)

  return role?.id
}
