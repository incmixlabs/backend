BEGIN;

-- Create translation type enum
CREATE TYPE translation_type AS ENUM ('frag', 'label');

-- Create locales table
CREATE TABLE locales (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create translations table
CREATE TABLE translations (
  id SERIAL PRIMARY KEY,
  locale_id INTEGER NOT NULL REFERENCES locales (id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  type translation_type NOT NULL DEFAULT 'label',
  namespace TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (locale_id, key, namespace)
);

-- Insert default locales
INSERT INTO
  locales (id, code, name, is_default)
VALUES
  (1, 'en', 'English', true),
  (2, 'pt', 'Portuguese', false);

COMMIT;