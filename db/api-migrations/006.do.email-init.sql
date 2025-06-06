BEGIN;

-- Create email status enum type
CREATE TYPE email_status AS ENUM ('pending', 'delivered', 'failed');

-- Create email queue table
CREATE TABLE email_queue (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  recipient TEXT NOT NULL,
  template TEXT NOT NULL,
  payload TEXT NOT NULL,
  status email_status NOT NULL DEFAULT 'pending',
  sg_id TEXT,
  should_retry BOOLEAN NOT NULL DEFAULT false,
  sendgrid_data TEXT,
  timestamps TIMESTAMPS NOT NULL DEFAULT (NOW(), NOW())
);

-- Create indexes for email queue
CREATE INDEX idx_email_queue_user_id ON email_queue(user_id);

CREATE INDEX idx_email_queue_status ON email_queue(status);

COMMIT;
