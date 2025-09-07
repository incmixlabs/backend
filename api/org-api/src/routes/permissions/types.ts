import { actions, subjects } from "@incmix/utils/types"
import { z } from "zod"

export const PermissionsWithRoleSchema = z.record(
  z.string(),
  z.union([z.enum(subjects), z.enum(actions), z.boolean()])
)

export const PermissionRolesResponseSchema = z.object({
  roles: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      isSystemRole: z.boolean().default(false),
    })
  ),
  permissions: PermissionsWithRoleSchema.array(),
})

export type PermissionsWithRole = z.infer<typeof PermissionsWithRoleSchema>

export const UpdatePermissionSchema = z.object({
  updates: z.array(
    z.object({
      subject: z.enum(subjects),
      action: z.enum(actions),
      roleId: z.number().int().positive(),
      allowed: z.boolean(),
    })
  ),
})
