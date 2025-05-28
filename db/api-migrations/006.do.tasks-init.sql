BEGIN;

-- Create projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  org_id TEXT NOT NULL REFERENCES organisations(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  updated_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, org_id)
);

-- Create indexes for projects
CREATE INDEX idx_projects_org_id ON projects(org_id);

CREATE INDEX idx_projects_created_by ON projects(created_by);

CREATE INDEX idx_projects_updated_by ON projects(updated_by);

-- Create columns table
CREATE TABLE columns (
  id TEXT PRIMARY KEY,
  label TEXT,
  column_order INTEGER NOT NULL DEFAULT 0,
  project_id TEXT NOT NULL REFERENCES projects(id),
  parent_id TEXT REFERENCES columns(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  updated_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(label, project_id)
);

-- Create indexes for columns
CREATE INDEX idx_columns_project_id ON columns(project_id);

CREATE INDEX idx_columns_parent_id ON columns(parent_id);

CREATE INDEX idx_columns_created_by ON columns(created_by);

CREATE INDEX idx_columns_updated_by ON columns(updated_by);

-- Create tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  content TEXT,
  task_order INTEGER NOT NULL DEFAULT 0,
  project_id TEXT NOT NULL REFERENCES projects(id),
  column_id TEXT NOT NULL REFERENCES columns(id),
  assigned_to TEXT REFERENCES users(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  updated_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for tasks
CREATE INDEX idx_tasks_project_id ON tasks(project_id);

CREATE INDEX idx_tasks_column_id ON tasks(column_id);

CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

CREATE INDEX idx_tasks_created_by ON tasks(created_by);

CREATE INDEX idx_tasks_updated_by ON tasks(updated_by);

CREATE INDEX idx_tasks_task_order ON tasks(task_order);

COMMIT;