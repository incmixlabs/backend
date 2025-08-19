BEGIN;

-- Remove acceptance_criteria field from projects table
ALTER TABLE
  projects DROP COLUMN acceptance_criteria;

COMMIT;