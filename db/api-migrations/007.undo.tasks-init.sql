BEGIN;

DROP INDEX IF EXISTS idx_tasks_project_order;

DROP INDEX IF EXISTS idx_tasks_project_column;

DROP INDEX IF EXISTS idx_tasks_assigned_to;

DROP INDEX IF EXISTS idx_tasks_column_id;

DROP TABLE IF EXISTS task_comments;

DROP TABLE IF EXISTS project_comments;

DROP TABLE IF EXISTS comments;

DROP TABLE IF EXISTS project_members;

DROP TABLE IF EXISTS tasks;

DROP INDEX IF EXISTS idx_columns_project_order;

DROP INDEX IF EXISTS idx_columns_parent_id;

DROP TABLE IF EXISTS columns;

DROP INDEX IF EXISTS idx_projects_org_created;

DROP TABLE IF EXISTS projects;

DROP TYPE IF EXISTS CHECKLIST;

DROP TYPE IF EXISTS TIMELINE;

DROP TYPE IF EXISTS task_status;

DROP TYPE IF EXISTS project_status;

COMMIT;