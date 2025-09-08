import { actions, subjects } from "@incmix/utils/types"
import { z } from "zod"

const PermissionMatrixSchema = z.record(
  z.enum(subjects),
  z.record(z.enum(actions), z.boolean())
)

export const PermissionsWithRoleSchema = z.object({
  roleId: z.number().int().positive(),
  permissions: PermissionMatrixSchema,
})

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
