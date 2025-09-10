import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely"

const envs = ["all", "dev", "qa", "uat", "prod", "test"] as const
export type Env = (typeof envs)[number]
type FeatureFlagsTable = {
  id: Generated<string>
  name: string
  description: string | null
  enabled: boolean
  allowedEnv: ColumnType<Env[], string, string>
  allowedUsers: ColumnType<string[], string, string>
  createdAt: ColumnType<Date, string, string>
  updatedAt: ColumnType<Date, string, string>
  createdBy: string
  updatedBy: string
}

export type FeatureFlag = Selectable<FeatureFlagsTable>
export type NewFeatureFlag = Insertable<FeatureFlagsTable>
export type UpdatedFeatureFlag = Updateable<FeatureFlagsTable>

export type FeatureFlagColumns = keyof FeatureFlagsTable

export const featureFlagColumns: FeatureFlagColumns[] = [
  "id",
  "name",
  "description",
  "enabled",
  "allowedEnv",
  "allowedUsers",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
] as const

export interface FeatureFlagsTables {
  featureFlags: FeatureFlagsTable
}
