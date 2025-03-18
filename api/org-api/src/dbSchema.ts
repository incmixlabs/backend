import type { MongoQuery } from "@casl/ability"
import type { Action, MemberRole, Subject } from "@incmix/utils/types"
import type {
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
  name: MemberRole
}

export type PermissionTable = {
  id: Generated<number>
  roleId: number
  action: Action
  subject: Subject
  conditions: JSONColumnType<MongoQuery>
}

export type Database = {
  organisations: OrganisationTable
  members: MemberTable
  roles: RoleTable
  permissions: PermissionTable
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
