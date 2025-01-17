import { API } from "@jsprtmnn/utils/env"

export const BASE_PATH = API.USERS

export const ERROR_USER_NOT_FOUND = {
  namespace: "errors",
  key: "user_not_found",
}
export const ERROR_USER_DEL_FAILED = {
  namespace: "errors",
  key: "user_del_failed",
}

export const ERROR_PRESIGNED_URL = {
  namespace: "errors",
  key: "presigned_url",
}
export const ERROR_UPLOAD_FAIL = { namespace: "errors", key: "upload_fail" }
export const ERROR_NO_PP = { namespace: "errors", key: "no_pp" }
export const ERROR_PP_DELETE_FAIL = {
  namespace: "errors",
  key: "pp_delete_fail",
}
export const ERROR_PP_FETCH_FAIL = {
  namespace: "errors",
  key: "pp_fetch_fail",
}

export const USER_DEL = { namespace: "auth", key: "user_deleted" }
export const PP_UPDATED = { namespace: "auth", key: "pp_updated" }
export const PP_DELETED = { namespace: "auth", key: "pp_deleted" }
