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

BEGIN;

-- Create email status enum type
CREATE TYPE email_status AS ENUM ('pending', 'delivered', 'failed');

-- Create email queue table
CREATE TABLE email_queue (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  recipient TEXT NOT NULL,
  template TEXT NOT NULL,
  payload TEXT NOT NULL,
  status email_status NOT NULL DEFAULT 'pending',
  sg_id TEXT,
  should_retry BOOLEAN NOT NULL DEFAULT false,
  data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for email queue
CREATE INDEX idx_email_queue_user_id ON email_queue(user_id);

CREATE INDEX idx_email_queue_status ON email_queue(status);

COMMIT;

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

BEGIN;

-- Create enum types
CREATE TYPE role_scope AS ENUM ('org', 'project', 'both');
CREATE TYPE permission_action AS ENUM ('create', 'read', 'update', 'delete', 'manage');

-- Create orgs table
CREATE TABLE orgs (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Create roles table with extended RBAC structure
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  desc TEXT,
  org_id TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  scope role_scope NOT NULL DEFAULT 'org',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT roles_name_org_id_key UNIQUE (name, org_id),
  CONSTRAINT fk_roles_org_id FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE
);

-- Create indexes for roles
CREATE INDEX idx_roles_org_id ON roles(org_id);
CREATE INDEX idx_roles_is_system_role ON roles(is_system_role);
CREATE INDEX idx_roles_scope ON roles(scope);

-- Create members table
CREATE TABLE members (
  user_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  role_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, org_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (org_id) REFERENCES orgs(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- Create indexes for members
CREATE INDEX idx_members_org_id ON members(org_id);
CREATE INDEX idx_members_role_id ON members(role_id);

-- Create permissions table with new structure
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL,
  action permission_action NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for permissions
CREATE INDEX idx_permissions_resource_type ON permissions(resource_type);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_resource_type_action ON permissions(resource_type, action);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  conditions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Create indexes for role_permissions
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Insert default roles
INSERT INTO
  roles (id, name)
VALUES
  (1, 'admin'),
  (2, 'owner'),
  (3, 'viewer'),
  (4, 'editor'),
  (5, 'commenter');

-- Update roles sequence
SELECT
  setval(
    'roles_id_seq',
    (
      SELECT
        MAX(id)
      FROM
        roles
    )
  );

-- Insert default permissions
INSERT INTO
  permissions (id, role_id, action, subject, conditions)
VALUES
  -- Admin permissions
  (1, 1, 'create', 'Org', NULL),
  (2, 1, 'read', 'Org', NULL),
  (3, 1, 'update', 'Org', NULL),
  (4, 1, 'delete', 'Org', NULL),
  (5, 1, 'manage', 'Member', NULL),
  -- Owner permissions
  (6, 2, 'create', 'Org', NULL),
  (7, 2, 'read', 'Org', NULL),
  (8, 2, 'update', 'Org', NULL),
  (9, 2, 'delete', 'Org', NULL),
  (10, 2, 'manage', 'Member', NULL),
  -- Viewer permissions
  (11, 3, 'read', 'Org', NULL),
  -- Editor permissions
  (12, 4, 'read', 'Org', NULL),
  -- Commenter permissions
  (13, 5, 'read', 'Org', NULL);

-- Update permissions sequence
SELECT
  setval(
    'permissions_id_seq',
    (
      SELECT
        MAX(id)
      FROM
        permissions
    )
  );

COMMIT;

BEGIN;

-- Create label type enum
CREATE TYPE label_type AS ENUM ('status', 'priority', 'tag');

create type project_status as ENUM (
  'todo',
  'started',
  'on_hold',
  'cancelled',
  'completed',
  'archived'
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  org_id TEXT NOT NULL REFERENCES orgs(id),
  status project_status default 'todo' not null,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget double precision,
  description text,
  company text,
  logo text,
  checklist jsonb DEFAULT '[]' :: jsonb,
  acceptance_criteria jsonb DEFAULT '[]' :: jsonb;
  created_by text references users(id) on delete cascade,
  updated_by text references users(id) on delete cascade,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, org_id)
);

create table project_members (
  project_id text references projects(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  is_owner boolean default false,
  role text,
  role_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by text references users(id) on delete cascade,
  updated_by text references users(id) on delete cascade,
  primary key (project_id, user_id)
);

CREATE INDEX idx_project_members_role_id ON project_members(role_id);

-- Create labels table (replaces columns table)
CREATE TABLE labels (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type label_type NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  UNIQUE(project_id, name)
);

-- Create indexes for labels
CREATE INDEX idx_labels_project_id ON labels(project_id);

CREATE INDEX idx_labels_project_type ON labels(project_id, type);

CREATE INDEX idx_labels_project_order ON labels(project_id, "order");

CREATE INDEX idx_labels_type ON labels(type);

-- Create tasks table with new schema
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  priority_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  task_order INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  description TEXT DEFAULT '',
  acceptance_criteria JSONB DEFAULT '[]' :: jsonb,
  checklist JSONB DEFAULT '[]' :: jsonb,
  completed BOOLEAN DEFAULT FALSE,
  ref_urls JSONB DEFAULT '[]' :: jsonb,
  labels_tags JSONB DEFAULT '[]' :: jsonb,
  attachments JSONB DEFAULT '[]' :: jsonb,
  parent_task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE task_assignments (
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

create table comments (
  id text primary key,
  user_id text references users(id) on delete cascade,
  content text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by text references users(id) on delete cascade,
  updated_by text references users(id) on delete cascade
);

create table project_comments (
  project_id text references projects(id) on delete cascade,
  comment_id text references comments(id) on delete cascade,
  primary key (project_id, comment_id)
);

create table task_comments (
  task_id text references tasks(id) on delete cascade,
  comment_id text references comments(id) on delete cascade,
  primary key (task_id, comment_id)
);

-- Create indexes for tasks
CREATE INDEX idx_tasks_status_id ON tasks(status_id);

CREATE INDEX idx_tasks_priority_id ON tasks(priority_id);

CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);

CREATE INDEX idx_tasks_project_order ON tasks(project_id, task_order);

CREATE INDEX idx_tasks_completed ON tasks(completed);

CREATE INDEX idx_tasks_start_date ON tasks(start_date);

CREATE INDEX idx_tasks_end_date ON tasks(end_date);

COMMIT;

begin;

CREATE TABLE story_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL
);

end;