BEGIN;

-- Create verification code type enum
CREATE TYPE verification_code_type_enum AS ENUM ('email_verification', 'reset_password');

-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT,
  email_verified_at TIMESTAMPTZ,
  last_logged_in TIMESTAMPTZ DEFAULT NOW (),
  is_active BOOLEAN DEFAULT TRUE,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Create verification_codes table
CREATE TABLE verification_codes (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  user_id TEXT REFERENCES users (id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  code_type verification_code_type_enum NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE accounts (
  account_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
  PRIMARY KEY (account_id, provider)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);

CREATE INDEX idx_verification_codes_email ON verification_codes (email);

CREATE INDEX idx_verification_codes_user_id ON verification_codes (user_id);

CREATE INDEX idx_accounts_user_id ON accounts (user_id);

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
  "bio" TEXT,
  "location" TEXT,
  "website" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_locale_id ON user_profiles(locale_id);

COMMIT;
