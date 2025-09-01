import { API } from "@incmix/utils/env"

export const BASE_PATH = API.AUTH

export const ONLINE_USERS = "onlineUsers"

// Intl Keys

export const ERROR_INVALID_CREDENTIALS = {
  namespace: "errors",
  key: "invalid_credentials",
}
export const ERROR_USER_NOT_FOUND = {
  namespace: "errors",
  key: "user_not_found",
}
export const ERROR_WRONG_PASSWORD = {
  namespace: "errors",
  key: "wrong_password",
}

export const ERROR_ALREADY_REG = {
  namespace: "errors",
  key: "already_registered",
}
export const ERROR_INVALID_CODE = { namespace: "errors", key: "invalid_code" }

export const LOGOUT_SUCC = { namespace: "auth", key: "logout_success" }
export const USER_DEL = { namespace: "auth", key: "user_deleted" }
export const VERIFIY_REQ = { namespace: "auth", key: "email_verify_required" }
export const ACC_DISABLED = { namespace: "auth", key: "account_disabled" }

export const EMAIL_ALREADY_VERIFIED = {
  namespace: "auth",
  key: "email_already_verified",
}
export const VERIFY_SUCCESS = { namespace: "auth", key: "verify_success" }
export const MAIL_SENT = { namespace: "auth", key: "mail_sent" }
export const PASS_RESET_SUCCESS = {
  namespace: "auth",
  key: "pass_reset_success",
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

export const PP_UPDATED = { namespace: "auth", key: "pp_updated" }
export const PP_DELETED = { namespace: "auth", key: "pp_deleted" }
