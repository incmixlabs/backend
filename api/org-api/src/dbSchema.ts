import type { MongoQuery } from "@casl/ability"
import type { Action, MemberRole, Subject } from "@jsprtmnn/utils/types"
import type { Insertable, JSONColumnType, Selectable, Updateable } from "kysely"
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
  id: number
  name: MemberRole
}

export type PermissionTable = {
  id: number
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
