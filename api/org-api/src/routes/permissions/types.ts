import { z } from "@hono/zod-openapi"
import { UserRoles, actions, subjects } from "@incmix/utils/types"

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

export const AddNewRoleSchema = z
  .object({
    name: z.string().min(3).max(50).openapi({
      example: "Admin",
      description: "The name of the role",
    }),
  })
  .openapi("AddNewRoleSchema")

export const UpdateRoleSchema = z
  .object({
    id: z.number().int().positive().openapi({
      example: 1,
      description: "The ID of the role",
    }),
    name: z.string().min(3).max(50).openapi({
      example: "Admin",
      description: "The name of the role",
    }),
  })
  .openapi("UpdateRoleSchema")

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
        subject: z.enum(subjects).openapi({
          example: "Organisation",
          description: "The resource being affected",
        }),
        action: z.enum(actions).openapi({
          example: "manage",
          description: "The operation being performed",
        }),
        roleId: z.number().int().positive().openapi({
          example: 1,
          description: "The ID of the role",
        }),
        allowed: z.boolean().openapi({
          example: true,
          description: "Whether the permission is granted",
        }),
      })
    ),
  })
  .openapi("UpdatePermissionSchema")
