BEGIN;

-- Rename columns from SendGrid to Resend
ALTER TABLE
  email_queue RENAME COLUMN sg_id TO resend_id;

ALTER TABLE
  email_queue RENAME COLUMN sendgrid_data TO resend_data;

COMMIT;
