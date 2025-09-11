BEGIN;

-- Insert new roles
INSERT INTO
  roles (id, name, description, is_system_role, scope)
VALUES
  (1, 'owner', 'Full control over the org', true, 'org'),
  (2, 'admin', 'Administrative access to the org', true, 'org'),
  (3, 'member', 'Standard member with basic access', true, 'both'),
  (4, 'project_manager', 'Manages projects and team coordination', true, 'project'),
  (5, 'guest', 'Limited access for external collaborators', false, 'project');

-- Update roles sequence
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- Insert default permissions for all resource types
INSERT INTO
  permissions (
    id,
    name,
    description,
    resource_type,
    action
  )
VALUES
  -- User permissions
  (1, 'Create User', 'Ability to create new users', 'User', 'create'),
  (2, 'Read User', 'Ability to view user information', 'User', 'read'),
  (3, 'Update User', 'Ability to modify user information', 'User', 'update'),
  (4, 'Delete User', 'Ability to delete users', 'User', 'delete'),
  -- Role permissions
  (6, 'Create Role', 'Ability to create new roles', 'Role', 'create'),
  (7, 'Read Role', 'Ability to view role information', 'Role', 'read'),
  (8, 'Update Role', 'Ability to modify role information', 'Role', 'update'),
  (9, 'Delete Role', 'Ability to delete roles', 'Role', 'delete'),
  -- Permission permissions
  (10, 'Read Permission', 'Ability to view permission information', 'Permission', 'read'),
  -- Organisation permissions
  (11, 'Create Organisation', 'Ability to create new organisations', 'Organisation', 'create'),
  (12, 'Read Organisation', 'Ability to view organisation information', 'Organisation', 'read'),
  (13, 'Update Organisation', 'Ability to modify organisation information', 'Organisation', 'update'),
  (14, 'Delete Organisation', 'Ability to delete organisations', 'Organisation', 'delete'),
  -- Member permissions
  (16, 'Create Member', 'Ability to add new members', 'Member', 'create'),
  (17, 'Read Member', 'Ability to view member information', 'Member', 'read'),
  (18, 'Update Member', 'Ability to modify member information', 'Member', 'update'),
  (19, 'Delete Member', 'Ability to remove members', 'Member', 'delete'),
  -- Project permissions
  (21, 'Create Project', 'Ability to create new projects', 'Project', 'create'),
  (22, 'Read Project', 'Ability to view project information', 'Project', 'read'),
  (23, 'Update Project', 'Ability to modify project information', 'Project', 'update'),
  (24, 'Delete Project', 'Ability to delete projects', 'Project', 'delete'),
  -- Task permissions
  (26, 'Create Task', 'Ability to create new tasks', 'Task', 'create'),
  (27, 'Read Task', 'Ability to view task information', 'Task', 'read'),
  (28, 'Update Task', 'Ability to modify task information', 'Task', 'update'),
  (29, 'Delete Task', 'Ability to delete tasks', 'Task', 'delete'),
  -- Comment permissions
  (31, 'Create Comment', 'Ability to create new comments', 'Comment', 'create'),
  (32, 'Read Comment', 'Ability to view comments', 'Comment', 'read'),
  (33, 'Update Comment', 'Ability to modify comments', 'Comment', 'update'),
  (34, 'Delete Comment', 'Ability to delete comments', 'Comment', 'delete'),
  -- ProjectMember permissions
  (36, 'Create ProjectMember', 'Ability to add new project members', 'ProjectMember', 'create'),
  (37, 'Read ProjectMember', 'Ability to view project member information', 'ProjectMember', 'read'),
  (38, 'Update ProjectMember', 'Ability to modify project member information', 'ProjectMember', 'update'),
  (39, 'Delete ProjectMember', 'Ability to remove project members', 'ProjectMember', 'delete'),
  -- Document permissions
  (41, 'Create Document', 'Ability to create new documents', 'Document', 'create'),
  (42, 'Read Document', 'Ability to view documents', 'Document', 'read'),
  (43, 'Update Document', 'Ability to modify documents', 'Document', 'update'),
  (44, 'Delete Document', 'Ability to delete documents', 'Document', 'delete'),
  -- Folder permissions
  (46, 'Create Folder', 'Ability to create new folders', 'Folder', 'create'),
  (47, 'Read Folder', 'Ability to view folders', 'Folder', 'read'),
  (48, 'Update Folder', 'Ability to modify folders', 'Folder', 'update'),
  (49, 'Delete Folder', 'Ability to delete folders', 'Folder', 'delete'),
  -- File permissions
  (51, 'Create File', 'Ability to create new files', 'File', 'create'),
  (52, 'Read File', 'Ability to view files', 'File', 'read'),
  (53, 'Update File', 'Ability to modify files', 'File', 'update'),
  (54, 'Delete File', 'Ability to delete files', 'File', 'delete');
  -- Guest permissions (public read) are not included here because 'read_public' is not a valid enum value.

-- Insert default role-permission assignments
INSERT INTO
  role_permissions (role_id, permission_id)
VALUES
  -- Owner role gets all permissions (IDs 1-4, 6-10, 11-14, 16-19, 21-24, 26-29, 31-34, 36-39, 41-44, 46-49, 51-54)
  (1, 1), (1, 2), (1, 3), (1, 4),
  (1, 6), (1, 7), (1, 8), (1, 9),
  (1, 10),
  (1, 11), (1, 12), (1, 13), (1, 14),
  (1, 16), (1, 17), (1, 18), (1, 19),
  (1, 21), (1, 22), (1, 23), (1, 24),
  (1, 26), (1, 27), (1, 28), (1, 29),
  (1, 31), (1, 32), (1, 33), (1, 34),
  (1, 36), (1, 37), (1, 38), (1, 39),
  (1, 41), (1, 42), (1, 43), (1, 44),
  (1, 46), (1, 47), (1, 48), (1, 49),
  (1, 51), (1, 52), (1, 53), (1, 54),
  -- Admin role gets all except delete organisation
  (2, 1), (2, 2), (2, 3), (2, 4),
  (2, 6), (2, 7), (2, 8), (2, 9),
  (2, 10),
  (2, 11), (2, 12), (2, 13),
  (2, 16), (2, 17), (2, 18), (2, 19),
  (2, 21), (2, 22), (2, 23), (2, 24),
  (2, 26), (2, 27), (2, 28), (2, 29),
  (2, 31), (2, 32), (2, 33), (2, 34),
  (2, 36), (2, 37), (2, 38), (2, 39),
  (2, 41), (2, 42), (2, 43), (2, 44),
  (2, 46), (2, 47), (2, 48), (2, 49),
  (2, 51), (2, 52), (2, 53), (2, 54),
  -- Member role gets basic read and limited write permissions
  (3, 2), (3, 7), (3, 10), (3, 12), (3, 17),
  (3, 21), (3, 22), (3, 23), (3, 24),
  (3, 26), (3, 27), (3, 28), (3, 29),
  (3, 31), (3, 32), (3, 33), (3, 34),
  (3, 37), (3, 42), (3, 47), (3, 52),
  -- Project Manager role gets project and task focused permissions
  (4, 21), (4, 22), (4, 23), (4, 24),
  (4, 26), (4, 27), (4, 28), (4, 29),
  (4, 31), (4, 32), (4, 33), (4, 34),
  (4, 36), (4, 37), (4, 38), (4, 39),
  (4, 41), (4, 42), (4, 43), (4, 44),
  (4, 46), (4, 47), (4, 48), (4, 49),
  (4, 51), (4, 52), (4, 53), (4, 54);
  -- Guest role gets only public read permissions
  -- (5, 55), (5, 56); -- These permissions are omitted because 'read_public' is not a valid enum value.

COMMIT;
