CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT TRUE,
  allowed_env text [] NOT NULL DEFAULT ARRAY ['all'],
  allowed_users text [] NOT NULL DEFAULT ARRAY ['all'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text NOT NULL REFERENCES users(id),
  updated_by text NOT NULL REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_feature_flags_name ON feature_flags(name);

CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);

CREATE INDEX idx_feature_flags_created_by ON feature_flags(created_by);

CREATE INDEX idx_feature_flags_updated_by ON feature_flags(updated_by);

CREATE INDEX idx_feature_flags_created_at ON feature_flags(created_at);

CREATE INDEX idx_feature_flags_updated_at ON feature_flags(updated_at);

-- Create GIN index for array fields to enable efficient array operations
CREATE INDEX idx_feature_flags_allowed_env_gin ON feature_flags USING GIN(allowed_env);

CREATE INDEX idx_feature_flags_allowed_users_gin ON feature_flags USING GIN(allowed_users);

-- Create unique constraint on name to prevent duplicate feature flag names
CREATE UNIQUE INDEX idx_feature_flags_name_unique ON feature_flags(name);
