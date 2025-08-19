BEGIN;

-- Add acceptance_criteria field to projects table
-- This field will store JSON data for project acceptance criteria
ALTER TABLE
  projects
ADD
  COLUMN acceptance_criteria JSONB DEFAULT '[]' :: jsonb;

-- Add comment to document the field purpose
COMMENT ON COLUMN projects.acceptance_criteria IS 'JSON array of acceptance criteria items for the project';

-- Update existing projects to have empty acceptance criteria array
UPDATE
  projects
SET
  acceptance_criteria = '[]' :: jsonb
WHERE
  acceptance_criteria IS NULL;

-- Make the field NOT NULL after setting default values
ALTER TABLE
  projects
ALTER COLUMN
  acceptance_criteria
SET
  NOT NULL;

COMMIT;