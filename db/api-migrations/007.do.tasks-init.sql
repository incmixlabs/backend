BEGIN;

-- Create CHECKLIST type
CREATE TYPE CHECKLIST AS (done boolean, item text);

create type project_status as enum (
  'todo',
  'started',
  'on_hold',
  'cancelled',
  'completed',
  'archived'
);

create type task_status as enum (
  'backlog',
  'active',
  'on_hold',
  'cancelled',
  'archived'
);

create type TIMELINE as (start_date TIMESTAMPTZ, end_date TIMESTAMPTZ);

-- Create projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  org_id TEXT NOT NULL REFERENCES organisations(id),
  status project_status default 'todo' not null,
  current_timeline TIMELINE,
  actual_timeline TIMELINE,
  checklists CHECKLIST [],
  budget_estimate integer,
  budget_actual integer,
  description text,
  company text,
  logo text,
  created_by_updated_by CREATED_BY_UPDATED_BY NOT NULL,
  timestamps TIMESTAMPS NOT NULL DEFAULT (NOW(), NOW()),
  UNIQUE(name, org_id)
);

-- Create columns table
CREATE TABLE columns (
  id TEXT PRIMARY KEY,
  label TEXT,
  column_order INTEGER NOT NULL DEFAULT 0,
  project_id TEXT NOT NULL REFERENCES projects(id),
  parent_id TEXT REFERENCES columns(id),
  created_by_updated_by CREATED_BY_UPDATED_BY NOT NULL,
  timestamps TIMESTAMPS NOT NULL DEFAULT (NOW(), NOW()),
  UNIQUE(label, project_id)
);

-- Create indexes for columns
CREATE INDEX idx_columns_parent_id ON columns(parent_id);

CREATE INDEX idx_columns_project_order ON columns(project_id, column_order);

-- Create tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title text,
  content TEXT,
  task_order INTEGER NOT NULL DEFAULT 0,
  figma_link TEXT,
  code_snippets TEXT [],
  status task_status default 'backlog' not null,
  checklist CHECKLIST [],
  project_id TEXT NOT NULL REFERENCES projects(id),
  column_id TEXT NOT NULL REFERENCES columns(id),
  assigned_to TEXT REFERENCES users(id),
  created_by_updated_by CREATED_BY_UPDATED_BY NOT NULL,
  current_timeline TIMELINE,
  actual_timeline TIMELINE,
  timestamps TIMESTAMPS NOT NULL DEFAULT (NOW(), NOW())
);

create table project_members (
  project_id text references projects(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  is_owner boolean default false,
  role text,
  timestamps TIMESTAMPS NOT NULL DEFAULT (NOW(), NOW()),
  created_by_updated_by CREATED_BY_UPDATED_BY NOT NULL,
  primary key (project_id, user_id)
);

create table comments (
  id text primary key,
  user_id text references users(id) on delete cascade,
  content text,
  timestamps TIMESTAMPS NOT NULL DEFAULT (NOW(), NOW()),
  created_by_updated_by CREATED_BY_UPDATED_BY NOT NULL
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
CREATE INDEX idx_tasks_column_id ON tasks(column_id);

CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

CREATE INDEX idx_tasks_project_column ON tasks(project_id, column_id);

CREATE INDEX idx_tasks_project_order ON tasks(project_id, task_order);

COMMIT;