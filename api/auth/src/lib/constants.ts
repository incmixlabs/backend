import { API } from "@incmix/utils/env"

export const BASE_PATH = API.auth

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
