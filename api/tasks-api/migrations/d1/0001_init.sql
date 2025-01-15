-- Migration number: 0001 	 2024-05-24T07:01:38.889Z
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  content TEXT,
  status TEXT not null,
  task_order INTEGER not null default 0,
  project_id TEXT not null,
  column_id TEXT not null,
  assigned_to TEXT not null,
  created_by TEXT not null,
  updated_by TEXT not null,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE columns (
  id TEXT PRIMARY KEY,
  label TEXT,
  column_order INTEGER not null default 0,
  project_id TEXT not null,
  parent_id TEXT,
  created_by TEXT not null,
  updated_by TEXT not null,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  unique(label, project_id)
);

create TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  org_id TEXT not null,
  created_by TEXT not null,
  updated_by TEXT not null,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  unique(name, org_id)
);