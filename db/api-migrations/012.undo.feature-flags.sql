-- Drop indexes first (in reverse order of creation)
DROP INDEX IF EXISTS idx_feature_flags_name_unique;

DROP INDEX IF EXISTS idx_feature_flags_allowed_users_gin;

DROP INDEX IF EXISTS idx_feature_flags_allowed_env_gin;

DROP INDEX IF EXISTS idx_feature_flags_updated_at;

DROP INDEX IF EXISTS idx_feature_flags_created_at;

DROP INDEX IF EXISTS idx_feature_flags_updated_by;

DROP INDEX IF EXISTS idx_feature_flags_created_by;

DROP INDEX IF EXISTS idx_feature_flags_enabled;

DROP INDEX IF EXISTS idx_feature_flags_name;

-- Drop the table
DROP TABLE IF EXISTS feature_flags;
