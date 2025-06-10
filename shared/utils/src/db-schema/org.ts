import { type Action, type Subject, UserRoles } from "@incmix/utils/types"
import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely"

const MemberRoles = [
  UserRoles.ROLE_ADMIN,
  UserRoles.ROLE_OWNER,
  UserRoles.ROLE_EDITOR,
  UserRoles.ROLE_VIEWER,
  UserRoles.ROLE_COMMENTER,
] as const

export type MemberRole = (typeof MemberRoles)[number]

type OrganisationTable = {
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

type RoleTable = {
  id: Generated<number>
  name: ColumnType<MemberRole, string, string>
}

export type PermissionTable = {
  id: Generated<number>
  roleId: number
  action: ColumnType<Action>
  subject: ColumnType<Subject>
  conditions: string | null
}

export type Organisation = Selectable<OrganisationTable>
export type NewOrganisation = Insertable<OrganisationTable>
export type UpdatedOrganisation = Updateable<OrganisationTable>

export type Member = Selectable<MemberTable>
export type NewMember = Insertable<MemberTable>
export type UpdatedMember = Updateable<MemberTable>

export type Role = Selectable<RoleTable>
export type NewRole = Insertable<RoleTable>
export type UpdatedRole = Updateable<RoleTable>

export type Permission = Selectable<PermissionTable>
export type NewPermission = Insertable<PermissionTable>
export type UpdatedPermission = Updateable<PermissionTable>

export type OrgTables = {
  organisations: OrganisationTable
  members: MemberTable
  roles: RoleTable
  permissions: PermissionTable
}
