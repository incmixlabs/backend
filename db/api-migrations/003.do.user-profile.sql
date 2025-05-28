BEGIN;

-- Create userProfiles table with all columns
CREATE TABLE "user_profiles" (
  "id" TEXT PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL UNIQUE,
  "full_name" TEXT NOT NULL,
  "profile_image" TEXT,
  "locale_id" INTEGER NOT NULL REFERENCES "locales"("id"),
  "avatar" TEXT,
  "company_name" TEXT NOT NULL,
  "company_size" TEXT NOT NULL,
  "team_size" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "manage_first" TEXT NOT NULL,
  "focus_first" TEXT NOT NULL,
  "referral_sources" JSONB NOT NULL DEFAULT '[]' :: jsonb,
  "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

CREATE INDEX idx_user_profiles_locale_id ON user_profiles(locale_id);

COMMIT;
