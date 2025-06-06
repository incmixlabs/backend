BEGIN;

-- Create organisations table
CREATE TABLE organisations (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  timestamps TIMESTAMPS NOT NULL DEFAULT (NOW(), NOW())
);

-- Create roles table (without the check constraint that was later dropped)
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

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

-- Create permissions table
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  action TEXT NOT NULL,
  conditions JSONB,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Create indexes for permissions
CREATE INDEX idx_permissions_role_id ON permissions(role_id);

CREATE INDEX idx_permissions_subject_action ON permissions(subject, action);

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