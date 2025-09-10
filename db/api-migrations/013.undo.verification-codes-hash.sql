BEGIN;

-- Remove unique constraint for single active reset token per user
DROP INDEX IF EXISTS idx_verification_codes_user_reset_active;

-- Remove index on code_hash
DROP INDEX IF EXISTS idx_verification_codes_code_hash;

-- Remove codeHash column
ALTER TABLE verification_codes 
DROP COLUMN IF EXISTS code_hash;

COMMIT;