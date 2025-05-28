BEGIN;

DROP INDEX IF EXISTS idx_user_profiles_email;

DROP INDEX IF EXISTS idx_user_profiles_locale_id;

DROP TABLE IF EXISTS "user_profiles";

COMMIT;
