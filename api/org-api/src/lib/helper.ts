import type { Context } from "@/types"
import type { UserRole } from "@incmix/utils/types"
import { findAllRoles } from "./db"

export async function getRoleIdByName(c: Context, name: UserRole) {
  const dbRoles = await findAllRoles(c)
  const role = dbRoles.find((r) => r.name === name)

  return role?.id
}
