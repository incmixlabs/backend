BEGIN;

-- Create userProfiles table with all columns
CREATE TABLE "user_profiles" (
  "id" TEXT PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL UNIQUE,
  "full_name" TEXT NOT NULL,
  "profile_image" TEXT,
  "locale_id" INTEGER NOT NULL REFERENCES "locales"("id"),
  "avatar" TEXT,
  "company_name" TEXT,
  "company_size" TEXT,
  "team_size" TEXT,
  "purpose" TEXT,
  "role" TEXT,
  "manage_first" TEXT,
  "focus_first" TEXT,
  "referral_sources" JSONB DEFAULT '[]' :: jsonb,
  "onboarding_completed" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

CREATE INDEX idx_user_profiles_locale_id ON user_profiles(locale_id);

COMMIT;