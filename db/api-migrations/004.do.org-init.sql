BEGIN;

-- Create enum types
CREATE TYPE role_scope AS ENUM ('organization', 'project', 'both');
CREATE TYPE permission_action AS ENUM ('create', 'read', 'update', 'delete', 'manage');

-- Create organisations table
CREATE TABLE organisations (
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
  description TEXT,
  organization_id TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  scope role_scope NOT NULL DEFAULT 'organization',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT roles_name_organization_id_key UNIQUE (name, organization_id),
  CONSTRAINT fk_roles_organization_id FOREIGN KEY (organization_id) REFERENCES organisations(id) ON DELETE CASCADE
);

-- Create indexes for roles
CREATE INDEX idx_roles_organization_id ON roles(organization_id);
CREATE INDEX idx_roles_is_system_role ON roles(is_system_role);
CREATE INDEX idx_roles_scope ON roles(scope);

-- Create members table
CREATE TABLE members (
  user_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  role_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, org_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (org_id) REFERENCES organisations(id) ON DELETE CASCADE,
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
  (1, 1, 'create', 'Organisation', NULL),
  (2, 1, 'read', 'Organisation', NULL),
  (3, 1, 'update', 'Organisation', NULL),
  (4, 1, 'delete', 'Organisation', NULL),
  (5, 1, 'manage', 'Member', NULL),
  -- Owner permissions
  (6, 2, 'create', 'Organisation', NULL),
  (7, 2, 'read', 'Organisation', NULL),
  (8, 2, 'update', 'Organisation', NULL),
  (9, 2, 'delete', 'Organisation', NULL),
  (10, 2, 'manage', 'Member', NULL),
  -- Viewer permissions
  (11, 3, 'read', 'Organisation', NULL),
  -- Editor permissions
  (12, 4, 'read', 'Organisation', NULL),
  -- Commenter permissions
  (13, 5, 'read', 'Organisation', NULL);

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