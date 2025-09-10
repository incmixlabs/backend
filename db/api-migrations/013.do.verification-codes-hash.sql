BEGIN;

-- Add codeHash column to store hashed tokens securely
ALTER TABLE verification_codes 
ADD COLUMN code_hash TEXT;

-- Create index on code_hash for performance
CREATE INDEX idx_verification_codes_code_hash ON verification_codes (code_hash);

-- Add constraint to ensure only one active reset_password token per user
-- Note: Cannot use NOW() in index predicate as it's not immutable
-- Will handle uniqueness in application logic instead

COMMIT;