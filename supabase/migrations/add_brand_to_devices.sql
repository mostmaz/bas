-- Add brand column to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS brand TEXT;

-- Comment on column
COMMENT ON COLUMN devices.brand IS 'The brand associated with this device (e.g. Apple, Samsung)';
