BEGIN;

-- Create user type enum
CREATE TYPE user_type_enum AS ENUM ('super_admin', 'member', 'user');

-- Create verification code type enum
CREATE TYPE verification_code_type_enum AS ENUM ('email_verification', 'reset_password');

-- Create users table
CREATE TABLE
  users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT,
    email_verified_at TIMESTAMPTZ,
    last_logged_in TIMESTAMPTZ DEFAULT NOW (),
    is_active BOOLEAN DEFAULT TRUE,
    user_type user_type_enum NOT NULL DEFAULT 'user',
    timestamps TIMESTAMPS NOT NULL DEFAULT (NOW(), NOW())
  );

-- Create sessions table
CREATE TABLE
  sessions (
    id TEXT PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

-- Create verification_codes table
CREATE TABLE
  verification_codes (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    user_id TEXT,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    code_type verification_code_type_enum NOT NULL,
    timestamps TIMESTAMPS NOT NULL DEFAULT (NOW(), NOW()),
    CONSTRAINT fk_verification_codes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

-- Create accounts table
CREATE TABLE
  accounts (
    account_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    PRIMARY KEY (account_id, provider),
    CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);

CREATE INDEX idx_verification_codes_email ON verification_codes (email);

CREATE INDEX idx_verification_codes_user_id ON verification_codes (user_id);

CREATE INDEX idx_accounts_user_id ON accounts (user_id);

COMMIT;