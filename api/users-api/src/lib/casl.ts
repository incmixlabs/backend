import type { Permission } from "@incmix/utils/types"

export const adminPermissions: Permission[] = [
  {
    action: "manage",
    subject: "all",
    conditions: {},
  },
]
export const userPermissions = (userId: string): Permission[] => [
  {
    action: "manage",
    subject: "User",
    conditions: {
      id: userId,
    },
  },
]
