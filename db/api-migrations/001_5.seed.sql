BEGIN;

-- Insert new roles
INSERT INTO
  roles (id, name, description, is_system_role, scope)
VALUES
  (
    1,
    'owner',
    'Full control over the org',
    true,
    'org'
  ),
  (
    2,
    'admin',
    'Administrative access to the org',
    true,
    'org'
  ),
  (
    3,
    'member',
    'Standard member with basic access',
    true,
    'both'
  ),
  (
    4,
    'project_manager',
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
    conditions
  )
VALUES
  -- User permissions
  (
    1,
    'Create User',
    'Ability to create new users',
    'User',
    'create',
    NULL
  ),
  (
    2,
    'Read User',
    'Ability to view user information',
    'User',
    'read',
    NULL
  ),
  (
    3,
    'Update User',
    'Ability to modify user information',
    'User',
    'update',
    NULL
  ),
  (
    4,
    'Delete User',
    'Ability to delete users',
    'User',
    'delete',
    NULL
  ),
  -- Role permissions
  (
    6,
    'Create Role',
    'Ability to create new roles',
    'Role',
    'create',
    NULL
  ),
  (
    7,
    'Read Role',
    'Ability to view role information',
    'Role',
    'read',
    NULL
  ),
  (
    8,
    'Update Role',
    'Ability to modify role information',
    'Role',
    'update',
    NULL
  ),
  (
    9,
    'Delete Role',
    'Ability to delete roles',
    'Role',
    'delete',
    NULL
  ),
  -- Permission permissions
  (
    10,
    'Read Permission',
    'Ability to view permission information',
    'Permission',
    'read',
    NULL
  ),
  -- Org permissions
  (
    11,
    'Create Org',
    'Ability to create new orgs',
    'Org',
    'create',
    NULL
  ),
  (
    12,
    'Read Org',
    'Ability to view org information',
    'Org',
    'read',
    NULL
  ),
  (
    13,
    'Update Org',
    'Ability to modify org information',
    'Org',
    'update',
    NULL
  ),
  (
    14,
    'Delete Org',
    'Ability to delete orgs',
    'Org',
    'delete',
    NULL
  ),
  -- Member permissions
  (
    16,
    'Create Member',
    'Ability to add new members',
    'Member',
    'create',
    NULL
  ),
  (
    17,
    'Read Member',
    'Ability to view member information',
    'Member',
    'read',
    NULL
  ),
  (
    18,
    'Update Member',
    'Ability to modify member information',
    'Member',
    'update',
    NULL
  ),
  (
    19,
    'Delete Member',
    'Ability to remove members',
    'Member',
    'delete',
    NULL
  ),
  -- Project permissions
  (
    21,
    'Create Project',
    'Ability to create new projects',
    'Project',
    'create',
    NULL
  ),
  (
    22,
    'Read Project',
    'Ability to view project information',
    'Project',
    'read',
    NULL
  ),
  (
    23,
    'Update Project',
    'Ability to modify project information',
    'Project',
    'update',
    NULL
  ),
  (
    24,
    'Delete Project',
    'Ability to delete projects',
    'Project',
    'delete',
    NULL
  ),
  -- Task permissions
  (
    26,
    'Create Task',
    'Ability to create new tasks',
    'Task',
    'create',
    NULL
  ),
  (
    27,
    'Read Task',
    'Ability to view task information',
    'Task',
    'read',
    NULL
  ),
  (
    28,
    'Update Task',
    'Ability to modify task information',
    'Task',
    'update',
    NULL
  ),
  (
    29,
    'Delete Task',
    'Ability to delete tasks',
    'Task',
    'delete',
    NULL
  ),
  -- Comment permissions
  (
    31,
    'Create Comment',
    'Ability to create new comments',
    'Comment',
    'create',
    NULL
  ),
  (
    32,
    'Read Comment',
    'Ability to view comments',
    'Comment',
    'read',
    NULL
  ),
  (
    33,
    'Update Comment',
    'Ability to modify comments',
    'Comment',
    'update',
    NULL
  ),
  (
    34,
    'Delete Comment',
    'Ability to delete comments',
    'Comment',
    'delete',
    NULL
  ),
  -- ProjectMember permissions
  (
    36,
    'Create ProjectMember',
    'Ability to add new project members',
    'ProjectMember',
    'create',
    NULL
  ),
  (
    37,
    'Read ProjectMember',
    'Ability to view project member information',
    'ProjectMember',
    'read',
    NULL
  ),
  (
    38,
    'Update ProjectMember',
    'Ability to modify project member information',
    'ProjectMember',
    'update',
    NULL
  ),
  (
    39,
    'Delete ProjectMember',
    'Ability to remove project members',
    'ProjectMember',
    'delete',
    NULL
  ),
  -- Document permissions
  (
    41,
    'Create Document',
    'Ability to create new documents',
    'Document',
    'create',
    NULL
  ),
  (
    42,
    'Read Document',
    'Ability to view documents',
    'Document',
    'read',
    NULL
  ),
  (
    43,
    'Update Document',
    'Ability to modify documents',
    'Document',
    'update',
    NULL
  ),
  (
    44,
    'Delete Document',
    'Ability to delete documents',
    'Document',
    'delete',
    NULL
  ),
  -- Folder permissions
  (
    46,
    'Create Folder',
    'Ability to create new folders',
    'Folder',
    'create',
    NULL
  ),
  (
    47,
    'Read Folder',
    'Ability to view folders',
    'Folder',
    'read',
    NULL
  ),
  (
    48,
    'Update Folder',
    'Ability to modify folders',
    'Folder',
    'update',
    NULL
  ),
  (
    49,
    'Delete Folder',
    'Ability to delete folders',
    'Folder',
    'delete',
    NULL
  ),
  -- File permissions
  (
    51,
    'Create File',
    'Ability to create new files',
    'File',
    'create',
    NULL
  ),
  (
    52,
    'Read File',
    'Ability to view files',
    'File',
    'read',
    NULL
  ),
  (
    53,
    'Update File',
    'Ability to modify files',
    'File',
    'update',
    NULL
  ),
  (
    54,
    'Delete File',
    'Ability to delete files',
    'File',
    'delete',
    NULL
  );

-- Insert default role-permission assignments
INSERT INTO
  role_permissions (role_id, permission_id, conditions)
VALUES
  -- Owner role gets all permissions (IDs 1-4, 6-10, 11-14, 16-19, 21-24, 26-29, 31-34, 36-39, 41-44, 46-49, 51-54)
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
  -- Owner: Read Permission
  (1, 11, NULL),
  -- Owner: Create Org
  (1, 12, NULL),
  -- Owner: Read Org
  (1, 13, NULL),
  -- Owner: Update Org
  (1, 14, NULL),
  -- Owner: Delete Org
  (1, 16, NULL),
  -- Owner: Create Member
  (1, 17, NULL),
  -- Owner: Read Member
  (1, 18, NULL),
  -- Owner: Update Member
  (1, 19, NULL),
  -- Owner: Delete Member
  (1, 21, NULL),
  -- Owner: Create Project
  (1, 22, NULL),
  -- Owner: Read Project
  (1, 23, NULL),
  -- Owner: Update Project
  (1, 24, NULL),
  -- Owner: Delete Project
  (1, 26, NULL),
  -- Owner: Create Task
  (1, 27, NULL),
  -- Owner: Read Task
  (1, 28, NULL),
  -- Owner: Update Task
  (1, 29, NULL),
  -- Owner: Delete Task
  (1, 31, NULL),
  -- Owner: Create Comment
  (1, 32, NULL),
  -- Owner: Read Comment
  (1, 33, NULL),
  -- Owner: Update Comment
  (1, 34, NULL),
  -- Owner: Delete Comment
  (1, 36, NULL),
  -- Owner: Create ProjectMember
  (1, 37, NULL),
  -- Owner: Read ProjectMember
  (1, 38, NULL),
  -- Owner: Update ProjectMember
  (1, 39, NULL),
  -- Owner: Delete ProjectMember
  (1, 41, NULL),
  -- Owner: Create Document
  (1, 42, NULL),
  -- Owner: Read Document
  (1, 43, NULL),
  -- Owner: Update Document
  (1, 44, NULL),
  -- Owner: Delete Document
  (1, 46, NULL),
  -- Owner: Create Folder
  (1, 47, NULL),
  -- Owner: Read Folder
  (1, 48, NULL),
  -- Owner: Update Folder
  (1, 49, NULL),
  -- Owner: Delete Folder
  (1, 51, NULL),
  -- Owner: Create File
  (1, 52, NULL),
  -- Owner: Read File
  (1, 53, NULL),
  -- Owner: Update File
  (1, 54, NULL),
  -- Owner: Delete File
  -- Admin role gets most permissions except org delete (IDs 1-4, 6-10, 11-13, 16-19, 21-24, 26-29, 31-34, 36-39, 41-44, 46-49, 51-54)
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
  (2, 10, NULL),
  -- Admin: Read Permission
  (2, 11, NULL),
  -- Admin: Create Org
  (2, 12, NULL),
  -- Admin: Read Org
  (2, 13, NULL),
  -- Admin: Update Org
  (2, 16, NULL),
  -- Admin: Create Member
  (2, 17, NULL),
  -- Admin: Read Member
  (2, 18, NULL),
  -- Admin: Update Member
  (2, 19, NULL),
  -- Admin: Delete Member
  (2, 21, NULL),
  -- Admin: Create Project
  (2, 22, NULL),
  -- Admin: Read Project
  (2, 23, NULL),
  -- Admin: Update Project
  (2, 24, NULL),
  -- Admin: Delete Project
  (2, 26, NULL),
  -- Admin: Create Task
  (2, 27, NULL),
  -- Admin: Read Task
  (2, 28, NULL),
  -- Admin: Update Task
  (2, 29, NULL),
  -- Admin: Delete Task
  (2, 31, NULL),
  -- Admin: Create Comment
  (2, 32, NULL),
  -- Admin: Read Comment
  (2, 33, NULL),
  -- Admin: Update Comment
  (2, 34, NULL),
  -- Admin: Delete Comment
  (2, 36, NULL),
  -- Admin: Create ProjectMember
  (2, 37, NULL),
  -- Admin: Read ProjectMember
  (2, 38, NULL),
  -- Admin: Update ProjectMember
  (2, 39, NULL),
  -- Admin: Delete ProjectMember
  (2, 41, NULL),
  -- Admin: Create Document
  (2, 42, NULL),
  -- Admin: Read Document
  (2, 43, NULL),
  -- Admin: Update Document
  (2, 44, NULL),
  -- Admin: Delete Document
  (2, 46, NULL),
  -- Admin: Create Folder
  (2, 47, NULL),
  -- Admin: Read Folder
  (2, 48, NULL),
  -- Admin: Update Folder
  (2, 49, NULL),
  -- Admin: Delete Folder
  (2, 51, NULL),
  -- Admin: Create File
  (2, 52, NULL),
  -- Admin: Read File
  (2, 53, NULL),
  -- Admin: Update File
  (2, 54, NULL),
  -- Admin: Delete File
  -- Member role gets basic read and limited write permissions (IDs 2, 7, 10, 12, 17, 22-24, 26-29, 31-34, 37, 42, 47, 52)
  (3, 2, NULL),
  -- Member: Read User
  (3, 7, NULL),
  -- Member: Read Role
  (3, 10, NULL),
  -- Member: Read Permission
  (3, 12, NULL),
  -- Member: Read Org
  (3, 17, NULL),
  -- Member: Read Member
  (3, 22, NULL),
  -- Member: Read Project
  (3, 21, NULL),
  -- Member: Create Project
  (3, 23, NULL),
  -- Member: Update Project
  (3, 24, NULL),
  -- Member: Delete Project
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
  -- Member: Read ProjectMember
  (3, 42, NULL),
  -- Member: Read Document
  (3, 47, NULL),
  -- Member: Read Folder
  (3, 52, NULL),
  -- Member: Read File
  -- Project Manager role gets project and task focused permissions (IDs 22-24, 26-29, 31-34, 36-39, 41-44, 46-49, 51-54)
  (4, 22, NULL),
  -- Project Manager: Read Project
  (4, 21, NULL),
  -- Project Manager: Create Project
  (4, 23, NULL),
  -- Project Manager: Update Project
  (4, 24, NULL),
  -- Project Manager: Delete Project
  (4, 26, NULL),
  -- Project Manager: Create Task
  (4, 27, NULL),
  -- Project Manager: Read Task
  (4, 28, NULL),
  -- Project Manager: Update Task
  (4, 29, NULL),
  -- Project Manager: Delete Task
  (4, 31, NULL),
  -- Project Manager: Create Comment
  (4, 32, NULL),
  -- Project Manager: Read Comment
  (4, 33, NULL),
  -- Project Manager: Update Comment
  (4, 34, NULL),
  -- Project Manager: Delete Comment
  (4, 36, NULL),
  -- Project Manager: Create ProjectMember
  (4, 37, NULL),
  -- Project Manager: Read ProjectMember
  (4, 38, NULL),
  -- Project Manager: Update ProjectMember
  (4, 39, NULL),
  -- Project Manager: Delete ProjectMember
  (4, 41, NULL),
  -- Project Manager: Create Document
  (4, 42, NULL),
  -- Project Manager: Read Document
  (4, 43, NULL),
  -- Project Manager: Update Document
  (4, 44, NULL),
  -- Project Manager: Delete Document
  (4, 46, NULL),
  -- Project Manager: Create Folder
  (4, 47, NULL),
  -- Project Manager: Read Folder
  (4, 48, NULL),
  -- Project Manager: Update Folder
  (4, 49, NULL),
  -- Project Manager: Delete Folder
  (4, 51, NULL),
  -- Project Manager: Create File
  (4, 52, NULL),
  -- Project Manager: Read File
  (4, 53, NULL),
  -- Project Manager: Update File
  (4, 54, NULL) -- Project Manager: Delete File
;

COMMIT;