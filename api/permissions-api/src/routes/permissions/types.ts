import { z } from "@hono/zod-openapi"
import { actions, subjects } from "@incmix/utils/types"

export const PermissionsWithRoleSchema = z
  .record(z.string(), z.union([z.enum(subjects), z.enum(actions), z.boolean()]))
  .openapi("PermissionsWithRoleSchema")

export const PermissionRolesResponseSchema = z
  .object({
    roles: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        isSystemRole: z.boolean().default(false),
      })
    ),
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
