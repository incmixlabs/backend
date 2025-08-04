BEGIN;

-- Insert new roles
INSERT INTO
  roles (id, name, description, is_system_role, scope)
VALUES
  (
    1,
    'Owner',
    'Full control over the organization',
    true,
    'organization'
  ),
  (
    2,
    'Admin',
    'Administrative access to the organization',
    true,
    'organization'
  ),
  (
    3,
    'Member',
    'Standard member with basic access',
    true,
    'both'
  ),
  (
    4,
    'Project Manager',
    'Manages projects and team coordination',
    true,
    'project'
  );

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

-- Insert default permissions for all resource types
INSERT INTO
  permissions (
    id,
    name,
    description,
    resource_type,
    action,
    condition
  )
VALUES
  -- User permissions
  (
    1,
    'Create User',
    'Ability to create new users',
    'user',
    'create',
    NULL
  ),
  (
    2,
    'Read User',
    'Ability to view user information',
    'user',
    'read',
    NULL
  ),
  (
    3,
    'Update User',
    'Ability to modify user information',
    'user',
    'update',
    '{"id":"{{user.id}}"}'
  ),
  (
    4,
    'Delete User',
    'Ability to delete users',
    'user',
    'delete',
    '{"id":"{{user.id}}"}'
  ),
  (
    5,
    'Manage User',
    'Full control over user management',
    'user',
    'manage',
    '{"id":"{{user.id}}"}'
  ),
  -- Role permissions
  (
    6,
    'Create Role',
    'Ability to create new roles',
    'role',
    'create',
    NULL
  ),
  (
    7,
    'Read Role',
    'Ability to view role information',
    'role',
    'read',
    NULL
  ),
  (
    8,
    'Update Role',
    'Ability to modify role information',
    'role',
    'update',
    NULL
  ),
  (
    9,
    'Delete Role',
    'Ability to delete roles',
    'role',
    'delete',
    NULL
  ),
  (
    10,
    'Manage Role',
    'Full control over role management',
    'role',
    'manage',
    NULL
  ),
  -- Organization permissions
  (
    11,
    'Create Organization',
    'Ability to create new organizations',
    'organization',
    'create',
    NULL
  ),
  (
    12,
    'Read Organization',
    'Ability to view organization information',
    'organization',
    'read',
    NULL
  ),
  (
    13,
    'Update Organization',
    'Ability to modify organization information',
    'organization',
    'update',
    '{"id":"{{organization.id}}"}'
  ),
  (
    14,
    'Delete Organization',
    'Ability to delete organizations',
    'organization',
    'delete',
    '{"id":"{{organization.id}}"}'
  ),
  (
    15,
    'Manage Organization',
    'Full control over organization management',
    'organization',
    'manage',
    '{"id":"{{organization.id}}"}'
  ),
  -- Member permissions
  (
    16,
    'Create Member',
    'Ability to add new members',
    'member',
    'create',
    '{"id":"{{organization.id}}"}'
  ),
  (
    17,
    'Read Member',
    'Ability to view member information',
    'member',
    'read',
    NULL
  ),
  (
    18,
    'Update Member',
    'Ability to modify member information',
    'member',
    'update',
    '{"id":"{{organization.id}}"}'
  ),
  (
    19,
    'Delete Member',
    'Ability to remove members',
    'member',
    'delete',
    '{"$or":[{"id":"{{organization.id}}"},{"userId":"{{user.id}}"}]}'
  ),
  (
    20,
    'Manage Member',
    'Full control over member management',
    'member',
    'manage',
    '{"id":"{{organization.id}}"}'
  ),
  -- Project permissions
  (
    21,
    'Create Project',
    'Ability to create new projects',
    'project',
    'create',
    '{"id":"{{organization.id}}"}'
  ),
  (
    22,
    'Read Project',
    'Ability to view project information',
    'project',
    'read',
    '{"id":"{{project.id}}"}'
  ),
  (
    23,
    'Update Project',
    'Ability to modify project information',
    'project',
    'update',
    '{"id":"{{project.id}}"}'
  ),
  (
    24,
    'Delete Project',
    'Ability to delete projects',
    'project',
    'delete',
    '{"id":"{{project.id}}"}'
  ),
  (
    25,
    'Manage Project',
    'Full control over project management',
    'project',
    'manage',
    '{"id":"{{project.id}}"}'
  ),
  -- Task permissions
  (
    26,
    'Create Task',
    'Ability to create new tasks',
    'task',
    'create',
    '{"id":"{{project.id}}"}'
  ),
  (
    27,
    'Read Task',
    'Ability to view task information',
    'task',
    'read',
    '{"id":"{{project.id}}"}'
  ),
  (
    28,
    'Update Task',
    'Ability to modify task information',
    'task',
    'update',
    '{"$or":[{"created_by":"{{user.id}}"},{"assigned_to":"{{user.id}}"}]}'
  ),
  (
    29,
    'Delete Task',
    'Ability to delete tasks',
    'task',
    'delete',
    '{"$or":[{"created_by":"{{user.id}}"},{"assigned_to":"{{user.id}}"}]}'
  ),
  (
    30,
    'Manage Task',
    'Full control over task management',
    'task',
    'manage',
    '{"$or":[{"created_by":"{{user.id}}"},{"assigned_to":"{{user.id}}"}]}'
  ),
  -- Comment permissions
  (
    31,
    'Create Comment',
    'Ability to create new comments',
    'comment',
    'create',
    '{"id":"{{project.id}}"}'
  ),
  (
    32,
    'Read Comment',
    'Ability to view comments',
    'comment',
    'read',
    '{"id":"{{project.id}}"}'
  ),
  (
    33,
    'Update Comment',
    'Ability to modify comments',
    'comment',
    'update',
    '{"created_by":"{{user.id}}"}'
  ),
  (
    34,
    'Delete Comment',
    'Ability to delete comments',
    'comment',
    'delete',
    '{"created_by":"{{user.id}}"}'
  ),
  (
    35,
    'Manage Comment',
    'Full control over comment management',
    'comment',
    'manage',
    '{"createdBy":"{{user.id}}"}'
  ),
  -- Project Member permissions
  (
    36,
    'Create Project Member',
    'Ability to add new project members',
    'project_member',
    'create',
    '{"id":"{{project.id}}"}'
  ),
  (
    37,
    'Read Project Member',
    'Ability to view project member information',
    'project_member',
    'read',
    '{"id":"{{project.id}}"}'
  ),
  (
    38,
    'Update Project Member',
    'Ability to modify project member information',
    'project_member',
    'update',
    '{"id":"{{project.id}}"}'
  ),
  (
    39,
    'Delete Project Member',
    'Ability to remove project members',
    'project_member',
    'delete',
    '{"$or":[{"id":"{{project.id}}"},{"userId":"{{user.id}}"}]}'
  ),
  (
    40,
    'Manage Project Member',
    'Full control over project member management',
    'project_member',
    'manage',
    '{"id":"{{project.id}}"}'
  );

-- Insert default role-permission assignments
INSERT INTO
  role_permissions (role_id, permission_id, conditions)
VALUES
  -- Owner role gets all permissions (IDs 1-35)
  (1, 2, NULL),
  -- Owner: Read User
  (1, 6, NULL),
  -- Owner: Create Role
  (1, 7, NULL),
  -- Owner: Read Role
  (1, 8, NULL),
  -- Owner: Update Role
  (1, 9, NULL),
  -- Owner: Delete Role
  (1, 10, NULL),
  -- Owner: Manage Role
  (1, 11, NULL),
  -- Owner: Create Organization
  (1, 12, NULL),
  -- Owner: Read Organization
  (1, 13, NULL),
  -- Owner: Update Organization
  (1, 14, NULL),
  -- Owner: Delete Organization
  (1, 15, NULL),
  -- Owner: Manage Organization
  (1, 16, NULL),
  -- Owner: Create Member
  (1, 17, NULL),
  -- Owner: Read Member
  (1, 18, NULL),
  -- Owner: Update Member
  (1, 19, NULL),
  -- Owner: Delete Member
  (1, 20, NULL),
  -- Owner: Manage Member
  (1, 21, NULL),
  -- Owner: Create Project
  (1, 22, NULL),
  -- Owner: Read Project
  (1, 23, NULL),
  -- Owner: Update Project
  (1, 24, NULL),
  -- Owner: Delete Project
  (1, 25, NULL),
  -- Owner: Manage Project
  (1, 26, NULL),
  -- Owner: Create Task
  (1, 27, NULL),
  -- Owner: Read Task
  (1, 28, NULL),
  -- Owner: Update Task
  (1, 29, NULL),
  -- Owner: Delete Task
  (1, 30, NULL),
  -- Owner: Manage Task
  (1, 31, NULL),
  -- Owner: Create Comment
  (1, 32, NULL),
  -- Owner: Read Comment
  (1, 33, NULL),
  -- Owner: Update Comment
  (1, 34, NULL),
  -- Owner: Delete Comment
  (1, 35, NULL),
  -- Owner: Manage Comment
  (1, 36, NULL),
  -- Owner: Create Project Member
  (1, 37, NULL),
  -- Owner: Read Project Member
  (1, 38, NULL),
  -- Owner: Update Project Member
  (1, 39, NULL),
  -- Owner: Delete Project Member
  (1, 40, NULL),
  -- Owner: Manage Project Member
  -- Admin role gets most permissions except organization delete (IDs 1-4, 6-10, 12-35)
  (2, 2, NULL),
  -- Admin: Read User
  (2, 6, NULL),
  -- Admin: Create Role
  (2, 7, NULL),
  -- Admin: Read Role
  (2, 8, NULL),
  -- Admin: Update Role
  (2, 9, NULL),
  -- Admin: Delete Role
  (2, 12, NULL),
  -- Admin: Read Organization
  (2, 13, NULL),
  -- Admin: Update Organization
  (2, 16, NULL),
  -- Admin: Create Member
  (2, 17, NULL),
  -- Admin: Read Member
  (2, 18, NULL),
  -- Admin: Update Member
  (2, 19, NULL),
  -- Admin: Delete Member
  (2, 20, NULL),
  -- Admin: Manage Member
  (2, 21, NULL),
  -- Admin: Create Project
  (2, 22, NULL),
  -- Admin: Read Project
  (2, 23, NULL),
  -- Admin: Update Project
  (2, 24, NULL),
  -- Admin: Delete Project
  (2, 25, NULL),
  -- Admin: Manage Project
  (2, 26, NULL),
  -- Admin: Create Task
  (2, 27, NULL),
  -- Admin: Read Task
  (2, 28, NULL),
  -- Admin: Update Task
  (2, 29, NULL),
  -- Admin: Delete Task
  (2, 30, NULL),
  -- Admin: Manage Task
  (2, 31, NULL),
  -- Admin: Create Comment
  (2, 32, NULL),
  -- Admin: Read Comment
  (2, 33, NULL),
  -- Admin: Update Comment
  (2, 34, NULL),
  -- Admin: Delete Comment
  (2, 35, NULL),
  -- Admin: Manage Comment
  (2, 36, NULL),
  -- Admin: Create Project Member
  (2, 37, NULL),
  -- Admin: Read Project Member
  (2, 38, NULL),
  -- Admin: Update Project Member
  (2, 39, NULL),
  -- Admin: Delete Project Member
  (2, 40, NULL),
  -- Admin: Manage Project Member
  -- Member role gets basic read and limited write permissions (IDs 2, 7, 12, 17, 22-25, 26-29, 31-34)
  (3, 2, NULL),
  -- Member: Read User
  (3, 7, NULL),
  -- Member: Read Role
  (3, 12, NULL),
  -- Member: Read Organization
  (3, 17, NULL),
  -- Member: Read Member
  (3, 22, NULL),
  -- Member: Read Project
  (3, 21, NULL),
  -- Member: Create Project
  (3, 23, NULL),
  -- Member: Update Project
  (3, 26, NULL),
  -- Member: Create Task
  (3, 27, NULL),
  -- Member: Read Task
  (3, 28, NULL),
  -- Member: Update Task
  (3, 29, NULL),
  -- Member: Delete Task
  (3, 31, NULL),
  -- Member: Create Comment
  (3, 32, NULL),
  -- Member: Read Comment
  (3, 33, NULL),
  -- Member: Update Comment
  (3, 34, NULL),
  -- Member: Delete Comment
  (3, 37, NULL),
  -- Member: Read Project Member
  -- Project Manager role gets project and task focused permissions (IDs 22-25, 26-30, 31-35)
  (4, 22, NULL),
  -- Project Manager: Read Project
  (4, 21, NULL),
  -- Project Manager: Create Project
  (4, 23, NULL),
  -- Project Manager: Update Project
  (4, 24, NULL),
  -- Project Manager: Delete Project
  (4, 25, NULL),
  -- Project Manager: Manage Project
  (4, 26, NULL),
  -- Project Manager: Create Task
  (4, 27, NULL),
  -- Project Manager: Read Task
  (4, 28, NULL),
  -- Project Manager: Update Task
  (4, 29, NULL),
  -- Project Manager: Delete Task
  (4, 30, NULL),
  -- Project Manager: Manage Task
  (4, 31, NULL),
  -- Project Manager: Create Comment
  (4, 32, NULL),
  -- Project Manager: Read Comment
  (4, 33, NULL),
  -- Project Manager: Update Comment
  (4, 34, NULL),
  -- Project Manager: Delete Comment
  (4, 35, NULL),
  -- Project Manager: Manage Comment
  (4, 36, NULL),
  -- Project Manager: Create Project Member
  (4, 37, NULL),
  -- Project Manager: Read Project Member
  (4, 38, NULL),
  -- Project Manager: Update Project Member
  (4, 39, NULL),
  -- Project Manager: Delete Project Member
  (4, 40, NULL);

-- Project Manager: Manage Project Member
COMMIT;