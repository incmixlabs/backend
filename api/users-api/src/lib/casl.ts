import type { Permission } from "@jsprtmnn/utils/types"

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
