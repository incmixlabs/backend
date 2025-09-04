BEGIN;

DROP INDEX IF EXISTS idx_permissions_subject_action;

DROP INDEX IF EXISTS idx_permissions_role_id;

DROP TABLE IF EXISTS permissions;

DROP INDEX IF EXISTS idx_members_role_id;

DROP INDEX IF EXISTS idx_members_org_id;

DROP TABLE IF EXISTS members;

DROP TABLE IF EXISTS roles;

DROP TABLE IF EXISTS orgs;

ALTER SEQUENCE IF EXISTS roles_id_seq RESTART WITH 1;

ALTER SEQUENCE IF EXISTS permissions_id_seq RESTART WITH 1;

COMMIT;