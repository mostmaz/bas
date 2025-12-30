-- Add new columns to the discounts table for conditional and automatic discounts

ALTER TABLE discounts 
ADD COLUMN IF NOT EXISTS target_product_ids TEXT[],
ADD COLUMN IF NOT EXISTS min_quantity INTEGER,
ADD COLUMN IF NOT EXISTS is_automatic BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS name TEXT;

-- Comment on columns
COMMENT ON COLUMN discounts.target_product_ids IS 'Array of product IDs that this discount applies to';
COMMENT ON COLUMN discounts.min_quantity IS 'Minimum total quantity of items in cart required for this discount';
COMMENT ON COLUMN discounts.is_automatic IS 'If true, this discount is applied automatically when conditions are met';
COMMENT ON COLUMN discounts.name IS 'Display name for the discount (especially for automatic ones)';
