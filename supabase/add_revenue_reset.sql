-- Add a column to track the last time revenue was reset
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS revenue_reset_date TIMESTAMPTZ DEFAULT NULL;

-- Comment: This date will be used to filter orders for the "Total Revenue" calculation on the dashboard.
-- Only orders created AFTER this date will be included in the sum.
