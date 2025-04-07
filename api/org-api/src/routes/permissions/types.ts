import { z } from "@hono/zod-openapi"
import {
  type Permission,
  USER_ROLES,
  type UserRole,
  UserRoles,
  actions,
  subjects,
} from "@incmix/utils/types"

export const PermissionsWithRoleSchema = z
  .object({
    subject: z.enum(subjects),
    action: z.enum(actions),
    [UserRoles.ROLE_ADMIN]: z.boolean(),
    [UserRoles.ROLE_EDITOR]: z.boolean(),
    [UserRoles.ROLE_VIEWER]: z.boolean(),
    [UserRoles.ROLE_OWNER]: z.boolean(),
    [UserRoles.ROLE_COMMENTER]: z.boolean(),
  })
  .openapi("PermissionsWithRoleSchema")

export const PermissionRolesResponseSchema = z
  .object({
    roles: z
      .object({
        name: z.string(),
        id: z.number(),
      })
      .array(),
    permissions: PermissionsWithRoleSchema.array(),
  })
  .openapi("PermissionRolesResponseSchema")

export type PermissionsWithRole = z.infer<typeof PermissionsWithRoleSchema>

export const UpdatePermissionSchema = z
  .object({
    updates: z.array(
      z.object({
        subject: z.enum(subjects),
        action: z.enum(actions),
        roleId: z.number(),
        allowed: z.boolean(),
      })
    ),
  })
  .openapi("UpdatePermissionSchema")
