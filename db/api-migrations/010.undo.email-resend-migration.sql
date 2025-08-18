BEGIN;

-- Revert columns from Resend back to SendGrid
ALTER TABLE
  email_queue RENAME COLUMN resend_id TO sg_id;

ALTER TABLE
  email_queue RENAME COLUMN resend_data TO sendgrid_data;

COMMIT;
