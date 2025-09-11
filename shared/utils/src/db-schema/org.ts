import type { MongoQuery } from "@casl/ability"
import type { Action, Subject } from "@incmix/utils/types"
import type {
  ColumnType,
  Generated,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from "kysely"

// New enum types based on SQL migration
export type RoleScope = "org" | "project" | "both"
export type PermissionAction = Action

export type ResourceType = Subject

type OrgTable = {
  id: string
  name: string
  handle: string
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, never>
}

type MemberTable = {
  userId: string
  orgId: string
  roleId: number
}

// Updated RoleTable based on SQL migration 008
type RoleTable = {
  id: Generated<number>
  name: string
  description: string | null
  orgId: string | null
  isSystemRole: boolean
  scope: ColumnType<RoleScope, string, string>
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, never>
}

// Updated PermissionTable based on SQL migration 008
export type PermissionTable = {
  id: Generated<number>
  name: string
  description: string | null
  resourceType: ColumnType<ResourceType, string, string>
  action: ColumnType<PermissionAction, string, string>
  conditions: JSONColumnType<MongoQuery, string, string> | null
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, never>
}

// New RolePermissionsTable based on SQL migration 008
export type RolePermissionsTable = {
  roleId: number
  permissionId: number
  conditions: JSONColumnType<MongoQuery, string, string> | null
  createdAt: ColumnType<Date, string, never>
}

export type Org = Selectable<OrgTable>
export type NewOrg = Insertable<OrgTable>
export type UpdatedOrganisation = Updateable<OrgTable>

export type Member = Selectable<MemberTable>
export type NewMember = Insertable<MemberTable>
export type UpdatedMember = Updateable<MemberTable>

export type Role = Selectable<RoleTable>
export type NewRole = Insertable<RoleTable>
export type UpdatedRole = Updateable<RoleTable>

export type Permission = Selectable<PermissionTable>
export type NewPermission = Insertable<PermissionTable>
export type UpdatedPermission = Updateable<PermissionTable>

export type RolePermissions = Selectable<RolePermissionsTable>
export type NewRolePermissions = Insertable<RolePermissionsTable>
export type UpdatedRolePermissions = Updateable<RolePermissionsTable>

// Audit log table for tracking mutations
export type AuditLogTable = {
  id: Generated<number>
  userId: string
  userEmail: string
  action: string
  resourceType: string
  resourceId: string | null
  orgId: string | null
  projectId: string | null
  method: string
  path: string
  statusCode: number | null
  metadata: JSONColumnType<Record<string, any>, string, string> | null
  timestamp: ColumnType<Date, string, never>
  ip: string | null
  userAgent: string | null
}

export type AuditLog = Selectable<AuditLogTable>
export type NewAuditLog = Insertable<AuditLogTable>

export type OrgTables = {
  organisations: OrgTable
  members: MemberTable
  roles: RoleTable
  permissions: PermissionTable
  rolePermissions: RolePermissionsTable
  auditLogs: AuditLogTable
}
