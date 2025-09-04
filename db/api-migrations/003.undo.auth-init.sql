BEGIN;

DROP TABLE IF EXISTS accounts;

DROP TABLE IF EXISTS verification_codes;

DROP TABLE IF EXISTS sessions;

DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS verification_code_type_enum;

DROP TYPE IF EXISTS user_type_enum;

DROP INDEX IF EXISTS idx_user_profiles_email;

DROP INDEX IF EXISTS idx_user_profiles_locale_id;

DROP TABLE IF EXISTS "user_profiles";

COMMIT;
