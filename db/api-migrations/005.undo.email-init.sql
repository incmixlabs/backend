BEGIN;


DROP INDEX IF EXISTS idx_email_queue_status;

DROP INDEX IF EXISTS idx_email_queue_user_id;

DROP TABLE IF EXISTS email_queue;

DROP TYPE IF EXISTS email_status;

COMMIT;
