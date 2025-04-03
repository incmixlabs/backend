import type { MongoQuery } from "@casl/ability"
import type { Action, Subject, UserRole } from "@incmix/utils/types"
import type {
  ColumnType,
  Generated,
  Insertable,
  JSONColumnType,
  Selectable,
  Updateable,
} from "kysely"
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
  name: ColumnType<UserRole, string, string>
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
