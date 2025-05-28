BEGIN;

DROP INDEX IF EXISTS idx_tasks_task_order;

DROP INDEX IF EXISTS idx_tasks_updated_by;

DROP INDEX IF EXISTS idx_tasks_created_by;

DROP INDEX IF EXISTS idx_tasks_assigned_to;

DROP INDEX IF EXISTS idx_tasks_column_id;

DROP INDEX IF EXISTS idx_tasks_project_id;

DROP TABLE IF EXISTS tasks;

DROP INDEX IF EXISTS idx_columns_updated_by;

DROP INDEX IF EXISTS idx_columns_created_by;

DROP INDEX IF EXISTS idx_columns_parent_id;

DROP INDEX IF EXISTS idx_columns_project_id;

DROP TABLE IF EXISTS columns;

DROP INDEX IF EXISTS idx_projects_updated_by;

DROP INDEX IF EXISTS idx_projects_created_by;

DROP INDEX IF EXISTS idx_projects_org_id;

DROP TABLE IF EXISTS projects;

COMMIT;
