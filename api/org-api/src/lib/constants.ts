import { API } from "@incmix/utils/env"

export const BASE_PATH = API.ORG

export const ERROR_ORG_EXIST = { namespace: "errors", key: "org_exist" }
export const ERROR_ORG_NOT_FOUND = {
  namespace: "errors",
  key: "org_not_found",
}
export const ERROR_NO_ROLES = { namespace: "errors", key: "role_not_found" }
export const ERROR_ORG_CREATE_FAIL = {
  namespace: "errors",
  key: "org_create_fail",
}
export const ERROR_ORG_UPDATE_FAIL = {
  namespace: "errors",
  key: "org_update_fail",
}
export const ERROR_ORG_DELETE_FAIL = {
  namespace: "errors",
  key: "org_delete_fail",
}

export const ORG_DELETE_SUCCESS = {
  namespace: "auth",
  key: "org_delete_success",
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
