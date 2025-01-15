DELETE FROM
  translations
WHERE
  locale_id = 1;

insert into
  translations(locale_id, key, value, namespace)
values
  (
    1,
    "invalid_credentials",
    "Invalid Credentials",
    "errors"
  ),
  (1, "wrong_password", "Wrong Password", "errors"),
  (1, "unauthorized", "Unauthorized", "errors"),
  (1, "server_error", "Server Error", "errors"),
  (1, "bad_request", "Invalid Request", "errors"),
  (
    1,
    "forbidden",
    "You don't have access to this operation",
    "errors"
  ),
  (
    1,
    "already_registered",
    "Email already registered",
    "errors"
  ),
  (
    1,
    "invalid_code",
    "Invalid verification code",
    "errors"
  ),
  (
    1,
    "presigned_url",
    "Failed to get presigned URL ({{status}}): {{text}}",
    "errors"
  ),
  (
    1,
    "upload_fail",
    "Failed to upload file",
    "errors"
  ),
  (
    1,
    "no_pp",
    "Profile Picture does not exist",
    "errors"
  ),
  (
    1,
    "pp_delete_fail",
    "Failed to delete Profile Picture",
    "errors"
  ),
  (
    1,
    "pp_fetch_fail",
    "Failed to fetch Profile Picture",
    "errors"
  ),
  (
    1,
    "org_exist",
    "Organisation already exist",
    "errors"
  ),
  (
    1,
    "org_not_found",
    "Organisation not found",
    "errors"
  ),
  (
    1,
    "role_not_found",
    "Roles not set in Database",
    "errors"
  ),
  (
    1,
    "org_create_fail",
    "Failed to create Organisation",
    "errors"
  ),
  (
    1,
    "org_update_fail",
    "Failed to update Organisation",
    "errors"
  ),
  (
    1,
    "org_delete_fail",
    "Failed to delete Organisation",
    "errors"
  ),
  (
    1,
    "member_exist",
    "Member already exists",
    "errors"
  ),
  (
    1,
    "member_insert_fail",
    "Failed to insert Member",
    "errors"
  ),
  (
    1,
    "last_owner",
    "Organisation must have at least one owner",
    "errors"
  ),
  (
    1,
    "casl_forbidden",
    "Action: {{action}} is not allowed for role: {{role}}",
    "errors"
  ),
  (
    1,
    "logout_success",
    "Logged out successfully",
    "auth"
  ),
  (
    1,
    "user_deleted",
    "User deleted successfully",
    "auth"
  ),
  (
    1,
    "pp_updated",
    "Profile picture updated successfully",
    "auth"
  ),
  (
    1,
    "pp_deleted",
    "Profile picture deleted successfully",
    "auth"
  ),
  (
    1,
    "email_already_verified",
    "Email already verified",
    "auth"
  ),
  (
    1,
    "email_verify_required",
    "Email Verification Required",
    "auth"
  ),
  (
    1,
    "verify_success",
    "Email verified successfully! Redirecting to login page",
    "auth"
  ),
  (
    1,
    "mail_sent",
    "Mail sent successfully",
    "auth"
  ),
  (
    1,
    "pass_reset_success",
    "Password reset successfully",
    "auth"
  ),
  (
    1,
    "org_delete_success",
    "Organisation deleted successfully",
    "auth"
  ),
  (
    1,
    "user_not_found",
    "User not found",
    "errors"
  ),
  (
    1,
    "not_member",
    "User is not a member",
    "errors"
  ),
  (
    1,
    "not_implemented",
    "Not implemented",
    "errors"
  ),
  (
    1,
    "filename_req",
    "Filename is required",
    "errors"
  ),
  (
    1,
    "file_not_found",
    "File not found",
    "errors"
  ),
  (
    1,
    "files_list_failed",
    "Failed to get File list",
    "errors"
  ),
  (
    1,
    "r2_missing",
    "Missing R2 Config",
    "errors"
  ),
  (
    1,
    "r2_bucket",
    "R2_BUCKET is not set",
    "errors"
  ),
  (
    1,
    "delete_success",
    "File deleted successfully",
    "files"
  ),
  (
    1,
    "task_insert_fail",
    "Failed to add task",
    "errors"
  ),
  (
    1,
    "task_update_fail",
    "Failed to update task",
    "errors"
  ),
  (
    1,
    "task_delete_fail",
    "Failed to delete task",
    "errors"
  ),
  (
    1,
    "task_not_found",
    "Task not found",
    "errors"
  );