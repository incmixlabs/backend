import { API } from "@incmix/utils/env"

export const BASE_PATH = API.files

export const ERROR_FILENAME_REQ = { namespace: "errors", key: "filename_req" }
export const ERROR_UPLOAD_FAIL = { namespace: "errors", key: "upload_fail" }
export const ERROR_FILE_NOT_FOUND = {
  namespace: "errors",
  key: "file_not_found",
}
export const ERROR_FILES_LIST_FAILED = {
  namespace: "errors",
  key: "files_list_failed",
}
export const ERROR_R2_MISSING = { namespace: "errors", key: "r2_missing" }
export const ERROR_R2_BUCKET = { namespace: "errors", key: "r2_bucket" }

export const FILE_DELETE_SUCCESS = {
  namespace: "files",
  key: "delete_success",
}
export const ERROR_FILE_DELETE_FAIL = {
  namespace: "errors",
  key: "file_delete_fail",
}
export const FILE_UPLOAD_SUCCESS = {
  namespace: "files",
  key: "upload_success",
}
