BEGIN;

DROP TABLE IF EXISTS accounts;

DROP TABLE IF EXISTS verification_codes;

DROP TABLE IF EXISTS sessions;

DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS verification_code_type_enum;

DROP TYPE IF EXISTS user_type_enum;

COMMIT;
