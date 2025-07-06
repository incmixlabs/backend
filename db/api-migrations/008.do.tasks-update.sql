BEGIN;

-- Create label type enum
CREATE TYPE label_type AS ENUM ('status', 'priority', 'tag');

-- Drop existing tables that are being replaced
DROP TABLE IF EXISTS task_checklists CASCADE;

DROP TABLE IF EXISTS project_checklists CASCADE;

DROP TABLE IF EXISTS tasks CASCADE;

DROP TABLE IF EXISTS columns CASCADE;

-- Drop existing enums that are being replaced
DROP TYPE IF EXISTS task_status CASCADE;

DROP TYPE IF EXISTS checklist_status CASCADE;

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
  status_id TEXT NOT NULL,
  priority_id TEXT NOT NULL,
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

-- Create indexes for tasks
CREATE INDEX idx_tasks_status_id ON tasks(status_id);

CREATE INDEX idx_tasks_priority_id ON tasks(priority_id);

CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);

CREATE INDEX idx_tasks_project_order ON tasks(project_id, task_order);

CREATE INDEX idx_tasks_completed ON tasks(completed);

CREATE INDEX idx_tasks_start_date ON tasks(start_date);

CREATE INDEX idx_tasks_end_date ON tasks(end_date);

-- Update projects table to remove fields not in new schema
ALTER TABLE
  projects DROP COLUMN IF EXISTS status;

ALTER TABLE
  projects DROP COLUMN IF EXISTS current_timeline_start_date;

ALTER TABLE
  projects DROP COLUMN IF EXISTS current_timeline_end_date;

ALTER TABLE
  projects DROP COLUMN IF EXISTS actual_timeline_start_date;

ALTER TABLE
  projects DROP COLUMN IF EXISTS actual_timeline_end_date;

ALTER TABLE
  projects DROP COLUMN IF EXISTS budget_estimate;

ALTER TABLE
  projects DROP COLUMN IF EXISTS budget_actual;

ALTER TABLE
  projects DROP COLUMN IF EXISTS description;

ALTER TABLE
  projects DROP COLUMN IF EXISTS company;

ALTER TABLE
  projects DROP COLUMN IF EXISTS logo;

-- Drop project_status enum as it's no longer needed
DROP TYPE IF EXISTS project_status CASCADE;

COMMIT;

insert into
  schema_version
values
  (
    8,
    'tasks-update',
    'e3a00105f19f93a5e887d24309c28db8',
    '2025-07-04 18:15:30'
  );
