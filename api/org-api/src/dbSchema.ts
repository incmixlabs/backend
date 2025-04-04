import type { MongoQuery } from "@casl/ability"
import {
  type Action,
  type Subject,
  type UserRole,
  UserRoles,
} from "@incmix/utils/types"
import type {
  ColumnType,
  Generated,
  Insertable,
  JSONColumnType,
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

type MemberRole = (typeof MemberRoles)[number]

type OrganisationTable = {
  id: string
  name: string
  handle: string
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

type SubjectTable = {
  id: Generated<number>
  name: string
  editable: boolean
}

type ActionTable = {
  id: Generated<number>
  name: string
}
export type PermissionTable = {
  id: Generated<number>
  roleId: number
  action: ColumnType<Action, string, string>
  subject: ColumnType<Subject, string, string>
  conditions: JSONColumnType<MongoQuery>
}

export type Database = {
  organisations: OrganisationTable
  members: MemberTable
  roles: RoleTable
  permissions: PermissionTable
  subjects: SubjectTable
  actions: ActionTable
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
