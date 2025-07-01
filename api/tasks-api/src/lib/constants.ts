import { API } from "@incmix/utils/env"

export const BASE_PATH = API.TASKS

export const ERROR_PRESIGNED_URL = {
  namespace: "errors",
  key: "presigned_url",
}

export const ERROR_PROJECT_NOT_FOUND = {
  namespace: "errors",
  key: "project_not_found",
}
export const ERROR_COLUMN_NOT_FOUND = {
  namespace: "errors",
  key: "column_not_found",
}
export const ERROR_TASK_INSERT_FAIL = {
  namespace: "errors",
  key: "task_insert_fail",
}
export const ERROR_TASK_UPDATE_FAIL = {
  namespace: "errors",
  key: "task_update_fail",
}

export const ERROR_TASK_DELETE_FAIL = {
  namespace: "errors",
  key: "task_delete_fail",
}
export const ERROR_TASK_NOT_FOUND = {
  namespace: "errors",
  key: "task_not_found",
}

export const ERROR_USER_STORY_GENERATION_FAILED = {
  namespace: "errors",
  key: "user_story_generation_failed",
}
export const ERROR_TEMPLATE_ALREADY_EXISTS = {
  namespace: "errors",
  key: "template_already_exists",
}
export const ERROR_TEMPLATE_NOT_FOUND = {
  namespace: "errors",
  key: "template_not_found",
}

export const ERROR_CHECKLIST_CREATE_FAILED = {
  namespace: "errors",
  key: "checklist_create_failed",
}

export const ERROR_CHECKLIST_UPDATE_FAILED = {
  namespace: "errors",
  key: "checklist_update_failed",
}

export const ERROR_CHECKLIST_NOT_FOUND = {
  namespace: "errors",
  key: "checklist_not_found",
}

export const ERROR_COMMENT_CREATE_FAILED = {
  namespace: "errors",
  key: "comment_create_failed",
}

export const ERROR_COMMENT_UPDATE_FAILED = {
  namespace: "errors",
  key: "comment_update_failed",
}

export const ERROR_COMMENT_NOT_FOUND = {
  namespace: "errors",
  key: "comment_not_found",
}
