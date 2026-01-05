-- 1. Ensure columns exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_view_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create Index for performance
CREATE INDEX IF NOT EXISTS idx_products_daily_views ON products(daily_views DESC);

-- 3. Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. Ensure public read access
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Public products are viewable by everyone'
    ) THEN
        CREATE POLICY "Public products are viewable by everyone" 
        ON products FOR SELECT 
        USING (true);
    END IF;
END $$;

-- 5. Create or Replace the RPC function for safe view incrementing
CREATE OR REPLACE FUNCTION increment_product_views(product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET 
    views = COALESCE(views, 0) + 1,
    daily_views = CASE 
      WHEN last_view_reset::date < CURRENT_DATE THEN 1 
      ELSE COALESCE(daily_views, 0) + 1 
    END,
    last_view_reset = CASE 
      WHEN last_view_reset::date < CURRENT_DATE THEN NOW() 
      ELSE last_view_reset 
    END
  WHERE id = product_id;
END;
$$;
