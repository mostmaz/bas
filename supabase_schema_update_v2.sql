-- Add exclude_sale_items column to discounts table

ALTER TABLE discounts 
ADD COLUMN IF NOT EXISTS exclude_sale_items BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN discounts.exclude_sale_items IS 'If true, this discount will not apply to items that are already on sale';
