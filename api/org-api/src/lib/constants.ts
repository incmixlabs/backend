import { API } from "@incmix/utils/env"

export const BASE_PATH = API.ORG
export const ERROR_ORG_EXIST = {
  namespace: "errors",
  key: "org_exist",
} as const
export const ERROR_ORG_NOT_FOUND = {
  namespace: "errors",
  key: "org_not_found",
} as const
export const ERROR_NO_ROLES = {
  namespace: "errors",
  key: "role_not_found",
} as const
export const ERROR_ORG_CREATE_FAIL = {
  namespace: "errors",
  key: "org_create_fail",
} as const
export const ERROR_ORG_UPDATE_FAIL = {
  namespace: "errors",
  key: "org_update_fail",
} as const
export const ERROR_ORG_DELETE_FAIL = {
  namespace: "errors",
  key: "org_delete_fail",
} as const

export const ORG_DELETE_SUCCESS = {
  namespace: "auth",
  key: "org_delete_success",
} as const
export const ERROR_INVALID_USER = {
  namespace: "errors",
  key: "invalid_user",
} as const
export const ERROR_NOT_MEMBER = {
  namespace: "errors",
  key: "not_member",
} as const
export const ERROR_MEMBER_EXIST = {
  namespace: "errors",
  key: "member_exist",
} as const
export const ERROR_MEMBER_INSERT_FAIL = {
  namespace: "errors",
  key: "member_insert_fail",
} as const
export const ERROR_MEMBER_UPDATE_FAIL = {
  namespace: "errors",
  key: "member_update_fail",
} as const
export const ERROR_LAST_OWNER = { namespace: "errors", key: "last_owner" }
export const ERROR_ROLE_ALREADY_EXISTS = {
  namespace: "errors",
  key: "role_already_exists",
} as const
export const ERROR_ROLE_NOT_FOUND = {
  namespace: "errors",
  key: "role_not_found",
} as const
export const ERROR_PERMISSION_EXIST = {
  namespace: "errors",
  key: "permission_exist",
} as const
export const ERROR_PERMISSION_NOT_FOUND = {
  namespace: "errors",
  key: "permission_not_found",
} as const
export const ERROR_PERMISSION_CREATE_FAIL = {
  namespace: "errors",
  key: "permission_create_fail",
} as const
export const ERROR_PERMISSION_UPDATE_FAIL = {
  namespace: "errors",
  key: "permission_update_fail",
} as const
export const ERROR_PERMISSION_DELETE_FAIL = {
  namespace: "errors",
  key: "permission_delete_fail",
} as const
export const PERMISSION_DELETE_SUCCESS = {
  namespace: "auth",
  key: "permission_delete_success",
} as const
