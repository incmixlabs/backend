-- Migration number: 0011 	 2024-09-06T20:52:51.041Z
-- Insert permissions for the admin role (role_id = 1)
INSERT INTO
  permissions (role_id, action, subject, conditions)
VALUES
  (1, 'create', 'Organisation', NULL),
  (1, 'read', 'Organisation', NULL),
  (1, 'update', 'Organisation', NULL),
  (1, 'delete', 'Organisation', NULL),
  (1, 'manage', 'Member', NULL);

-- Insert permissions for the owner role (role_id = 2)
INSERT INTO
  permissions (role_id, action, subject, conditions)
VALUES
  (2, 'create', 'Organisation', NULL),
  (2, 'read', 'Organisation', NULL),
  (2, 'update', 'Organisation', NULL),
  (2, 'delete', 'Organisation', NULL),
  (2, 'manage', 'Member', NULL);

-- Insert permissions for the viewer role (role_id = 3)
INSERT INTO
  permissions (role_id, action, subject, conditions)
VALUES
  (3, 'read', 'Organisation', NULL);

-- Insert permissions for the editor role (role_id = 4)
INSERT INTO
  permissions (role_id, action, subject, conditions)
VALUES
  (4, 'read', 'Organisation', NULL);

-- Insert permissions for the commenter role (role_id = 5)
INSERT INTO
  permissions (role_id, action, subject, conditions)
VALUES
  (5, 'read', 'Organisation', NULL);