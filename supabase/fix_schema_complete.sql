-- 1. DROP THE OLD FUNCTION TO FIX OVERLOADING ERROR
-- We drop both versions to be safe and start fresh
DROP FUNCTION IF EXISTS increment_product_views(UUID);
DROP FUNCTION IF EXISTS increment_product_views(TEXT);

-- 2. Ensure columns exist in products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_view_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Create Index for performance
CREATE INDEX IF NOT EXISTS idx_products_daily_views ON products(daily_views DESC);

-- 4. Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 5. Ensure public read access for products
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

-- 6. Create the correct RPC function (TEXT version)
CREATE OR REPLACE FUNCTION increment_product_views(product_id TEXT)
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

-- 7. CREATE VISITOR DEVICES TABLE (Fixes 404 error)
CREATE TABLE IF NOT EXISTS visitor_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_name TEXT NOT NULL UNIQUE,
  visit_count INTEGER DEFAULT 1,
  last_visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enable RLS on visitor_devices
ALTER TABLE visitor_devices ENABLE ROW LEVEL SECURITY;

-- 9. Allow public read access on visitor_devices
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'visitor_devices' AND policyname = 'Public read access'
    ) THEN
        CREATE POLICY "Public read access" ON visitor_devices
        FOR SELECT USING (true);
    END IF;
END $$;

-- 10. Create RPC function to track device visits
CREATE OR REPLACE FUNCTION track_visitor_device(device_name_input TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO visitor_devices (device_name, visit_count, last_visited_at)
  VALUES (device_name_input, 1, NOW())
  ON CONFLICT (device_name)
  DO UPDATE SET
    visit_count = visitor_devices.visit_count + 1,
    last_visited_at = NOW();
END;
$$;
