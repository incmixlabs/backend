
DROP DOMAIN IF EXISTS INCMIX.VALID_EMAIL CASCADE;
DROP DOMAIN IF EXISTS INCMIX.VALID_URL CASCADE;
DROP DOMAIN IF EXISTS INCMIX.VALID_EMAIL_OR_URL CASCADE;
DROP DOMAIN IF EXISTS DOMAIN INCMIX.VALID_HANDLE;
DROP DOMAIN IF EXISTS INCMIX.VALID_COL_NAME CASCADE;
DROP DOMAIN IF EXISTS INCMIX.VALID_HANDLE2 CASCADE;
DROP TYPE IF EXISTS INCMIX.OAUTH_ENUM CASCADE;
DROP DOMAIN IF EXISTS INCMIX.DATE_OF_BIRTH CASCADE;
DROP DOMAIN IF EXISTS INCMIX.VALID_PHONE CASCADE;
DROP DOMAIN IF EXISTS INCMIX.VALID_PASSWORD CASCADE;
DROP DOMAIN IF EXISTS INCMIX.US_POSTAL_CODE CASCADE;
DROP TYPE IF EXISTS INCMIX.VALID_ZONE CASCADE;
DROP TYPE IF EXISTS INCMIX.VALID_ROLE CASCADE;
DROP TYPE IF EXISTS INCMIX.COLAB_ROLE CASCADE;
DROP TYPE IF EXISTS INCMIX.UPDATE_TYPE CASCADE;
DROP DOMAIN IF EXISTS INCMIX.MMN_TYPE CASCADE;
DROP DOMAIN IF EXISTS INCMIX.NOTES_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.DATE_RANGE_TYPE CASCADE;
DROP DOMAIN IF EXISTS INCMIX.TAGS_TYPE CASCADE;
DROP DOMAIN IF EXISTS INCMIX.TINYINT CASCADE;
DROP DOMAIN IF EXISTS INCMIX.LOV_TYPE CASCADE;
DROP DOMAIN IF EXISTS INCMIX.NAME_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.COL_DEF_ENUM CASCADE;
DROP TYPE IF EXISTS INCMIX.RELATION_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.FILE_UNIT CASCADE;
DROP TYPE IF EXISTS INCMIX.FILE_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.JOB_STATUS_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.FREQ_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.WORKSPACE_VISIBILITY_OPTION CASCADE;
DROP TYPE IF EXISTS INCMIX.WORKSPACE_INVITE_OPTION CASCADE;
DROP TYPE IF EXISTS  INCMIX.NH_LEVEL_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.ORG_PLAN_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.SESSION_LOGOUT_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.AGREE_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.PROJECT_STATUS_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.PROJECT_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.TIME_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.TASK_PRIORITY_TYPE CASCADE;
DROP TYPE IF EXISTS INCMIX.ADDRESS;
DROP TYPE IF EXISTS INCMIX.DATE_RANGE;
DROP TYPE IF EXISTS INCMIX.LOCATION;
DROP TYPE IF EXISTS  INCMIX.FINANCIALS;
DROP TYPE IF EXISTS  incmix.cell_def CASCADE;
DROP TABLE IF EXISTS incmix.globals CASCADE CASCADE;
DROP TABLE IF EXISTS incmix.auth CASCADE CASCADE;
DROP TABLE IF EXITS INCMIX.BASE_INSERT_TABLE CASCADE;
DROP TABLE IF EXISTS INCMIX.BASE_UPDATE_TABLE CASCADE;
DROP TABLE IF EXISTS INCMIX.AUTH CASCADE;
DROP TABLE IF EXISTS incmix.users CASCADE CASCADE;
DROP TABLE IF EXISTS INCMIX.BASE_TABLE CASCADE;
DROP TABLE IF EXISTS INCMIX.SCHEMA_TABLE CASCADE;
DROP TABLE IF EXISTS INCMIX.STATUS CASCADE;
DROP TABLE IF EXISTS INCMIX.EFFECTIVE_TABLE CASCADE;
DROP TABLE IF EXISTS INCMIX.TXNS CASCADE;
DROP TABLE IF EXISTS INCMIX.MMN CASCADE;
DROP TABLE IF EXISTS INCMIX.LOV_HEADERS CASCADE;
DROP TABLE IF EXISTS INCMIX.LOVS CASCADE;
DROP TABLE IF EXISTS INCMIX.COL_DEFS CASCADE;
DROP TABLE IF EXISTS INCMIX.COLS CASCADE;
DROP TABLE IF EXISTS INCMIX.ROWS CASCADE;
DROP TABLE IF EXISTS INCMIX.ROW_AUDITS CASCADE;
DROP TABLE IF EXISTS INCMIX.CELLS CASCADE;
DROP TABLE IF EXISTS INCMIX.CELL_AUDITS CASCADE;
DROP TABLE IF EXISTS INCMIX.AUDIT_CELLS CASCADE;
DROP TABLE IF EXISTS INCMIX.FILE_DIRS CASCADE;
DROP TABLE IF EXISTS INCMIX.FILES CASCADE;
DROP TABLE IF EXISTS INCMIX.USERS CASCADE;
DROP TABLE IF EXISTS INCMIX.ACTIVE_SESSIONS CASCADE;
DROP TABLE IF EXISTS INCMIX.SESSIONS CASCADE;
DROP TABLE IF EXISTS INCMIX.RELATIONS CASCADE;
DROP TABLE IF EXISTS INCMIX.RELATION_AUDITS CASCADE;
DROP TABLE IF EXISTS INCMIX.CLIENTS CASCADE;
DROP TABLE IF EXISTS INCMIX.PROJECTS CASCADE;
DROP TABLE IF EXISTS INCMIX.TASKS CASCADE;
DROP TABLE IF EXISTS INCMIX.NOTES CASCADE;
DROP TABLE IF EXISTS INCMIX.BASE_PERMISSION_TABLE CASCADE;
DROP TABLE IF EXISTS INCMIX.ORGS CASCADE;
DROP TABLE IF EXISTS INCMIX.ASSIGNED_AGREEMENTS CASCADE;
DROP TABLE IF EXISTS INCMIX.TEAMS CASCADE;
DROP TABLE IF EXISTS INCMIX.TEAM_AUDITS CASCADE;
DROP TABLE IF EXISTS INCMIX.TEAM_MEMBERS CASCADE;
DROP TABLE IF EXISTS INCMIX.TEAM_MEMBER_AUDITS CASCADE;

DROP SCHEMA IF EXISTS INCMIX CASCADE;
