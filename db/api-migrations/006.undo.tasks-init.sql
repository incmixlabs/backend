BEGIN;

-- Drop indexes for tasks
DROP INDEX IF EXISTS idx_tasks_end_date;

DROP INDEX IF EXISTS idx_tasks_start_date;

DROP INDEX IF EXISTS idx_tasks_completed;

DROP INDEX IF EXISTS idx_tasks_project_order;

DROP INDEX IF EXISTS idx_tasks_parent_task_id;

DROP INDEX IF EXISTS idx_tasks_priority_id;

DROP INDEX IF EXISTS idx_tasks_status_id;

-- Drop task-related tables
DROP TABLE IF EXISTS task_comments;

DROP TABLE IF EXISTS task_assignments;

DROP TABLE IF EXISTS tasks;

-- Drop indexes for labels
DROP INDEX IF EXISTS idx_labels_project_order;

DROP INDEX IF EXISTS idx_labels_project_type;

-- Drop labels table
DROP TABLE IF EXISTS labels;

-- Drop project-related tables
DROP TABLE IF EXISTS project_comments;

DROP TABLE IF EXISTS project_members;

DROP TABLE IF EXISTS projects;

-- Drop comments table
DROP TABLE IF EXISTS comments;

-- Drop types
DROP TYPE IF EXISTS label_type;

DROP TYPE IF EXISTS project_status;

COMMIT;