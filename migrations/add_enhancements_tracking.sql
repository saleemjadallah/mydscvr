-- Add enhancements_used column to usage_records table
ALTER TABLE usage_records
ADD COLUMN IF NOT EXISTS enhancements_used INTEGER DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN usage_records.enhancements_used IS 'Tracks the number of image enhancements used in the billing period';
