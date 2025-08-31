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
  org_id TEXT NOT NULL REFERENCES organisations(id),
  status project_status default 'todo' not null,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget double precision,
  description text,
  company text,
  logo text,
  checklist jsonb DEFAULT '[]' :: jsonb,
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
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by text references users(id) on delete cascade,
  updated_by text references users(id) on delete cascade,
  primary key (project_id, user_id)
);

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