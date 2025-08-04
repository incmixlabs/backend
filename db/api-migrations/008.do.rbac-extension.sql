BEGIN;

-- Delete all existing permissions
DELETE FROM
  permissions;

-- Delete all existing roles
DELETE FROM
  roles;

-- Drop user_type column from users table
ALTER TABLE
  users DROP COLUMN IF EXISTS user_type;

-- Add is_super_admin boolean column with default false
ALTER TABLE
  users
ADD
  COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT false;

-- Create scope enum type
CREATE TYPE role_scope AS ENUM ('organization', 'project', 'both');

-- Create action enum type
CREATE TYPE permission_action AS ENUM ('create', 'read', 'update', 'delete', 'manage');

-- Drop the existing unique constraint on name
ALTER TABLE
  roles DROP CONSTRAINT roles_name_key;

-- Add new columns to roles table
ALTER TABLE
  roles
ADD
  COLUMN description TEXT,
ADD
  COLUMN organization_id TEXT,
ADD
  COLUMN is_system_role BOOLEAN NOT NULL DEFAULT false,
ADD
  COLUMN scope role_scope NOT NULL DEFAULT 'organization',
ADD
  COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD
  COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add composite unique constraint on (name, organization_id)
ALTER TABLE
  roles
ADD
  CONSTRAINT roles_name_organization_id_key UNIQUE (name, organization_id);

-- Add foreign key constraint for organization_id
ALTER TABLE
  roles
ADD
  CONSTRAINT fk_roles_organization_id FOREIGN KEY (organization_id) REFERENCES organisations(id) ON DELETE CASCADE;

-- Create index for organization_id
CREATE INDEX idx_roles_organization_id ON roles(organization_id);

-- Create index for is_system_role
CREATE INDEX idx_roles_is_system_role ON roles(is_system_role);

-- Create index for scope
CREATE INDEX idx_roles_scope ON roles(scope);

-- Update permissions table structure
-- Drop existing foreign key constraints
ALTER TABLE
  permissions DROP CONSTRAINT IF EXISTS permissions_role_id_fkey;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_permissions_role_id;

DROP INDEX IF EXISTS idx_permissions_subject_action;

-- Alter permissions table to new structure
ALTER TABLE
  permissions DROP COLUMN role_id,
  DROP COLUMN subject,
  DROP COLUMN action,
ADD
  COLUMN name TEXT NOT NULL,
ADD
  COLUMN description TEXT,
ADD
  COLUMN resource_type TEXT NOT NULL,
ADD
  COLUMN action permission_action NOT NULL,
ADD
  COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD
  COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create indexes for new structure
CREATE INDEX idx_permissions_resource_type ON permissions(resource_type);

CREATE INDEX idx_permissions_action ON permissions(action);

CREATE INDEX idx_permissions_resource_type_action ON permissions(resource_type, action);

-- Create role_permissions table
CREATE TABLE role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  conditions JSONB,
  -- Role-specific conditions that override permission defaults
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

ALTER TABLE
  project_members
ADD
  COLUMN role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE;

-- Create indexes for role_permissions
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);

CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

COMMIT;