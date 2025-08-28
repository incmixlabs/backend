import { API } from "@incmix/utils/env"

export const BASE_PATH = API.permissions

export const ERROR_PERMISSION_EXIST = {
  namespace: "errors",
  key: "permission_exist",
}
export const ERROR_PERMISSION_NOT_FOUND = {
  namespace: "errors",
  key: "permission_not_found",
}
// ERROR_NO_ROLES removed - duplicate of ERROR_ROLE_NOT_FOUND
export const ERROR_PERMISSION_CREATE_FAIL = {
  namespace: "errors",
  key: "permission_create_fail",
}
export const ERROR_PERMISSION_UPDATE_FAIL = {
  namespace: "errors",
  key: "permission_update_fail",
}
export const ERROR_PERMISSION_DELETE_FAIL = {
  namespace: "errors",
  key: "permission_delete_fail",
}

export const PERMISSION_DELETE_SUCCESS = {
  namespace: "auth",
  key: "permission_delete_success",
}
export const ERROR_INVALID_USER = { namespace: "errors", key: "invalid_user" }
export const ERROR_NOT_MEMBER = { namespace: "errors", key: "not_member" }
export const ERROR_MEMBER_EXIST = { namespace: "errors", key: "member_exist" }
export const ERROR_MEMBER_INSERT_FAIL = {
  namespace: "errors",
  key: "member_insert_fail",
}
export const ERROR_MEMBER_UPDATE_FAIL = {
  namespace: "errors",
  key: "member_update_fail",
}
export const ERROR_LAST_OWNER = { namespace: "errors", key: "last_owner" }
export const ERROR_ROLE_ALREADY_EXISTS = {
  namespace: "errors",
  key: "role_already_exists",
}
export const ERROR_ROLE_NOT_FOUND = {
  namespace: "errors",
  key: "role_not_found",
}
