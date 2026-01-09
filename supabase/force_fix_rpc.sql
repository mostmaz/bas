-- FORCE CLEANUP OF RPC FUNCTIONS
-- We must drop these explicitly to resolve the ambiguity error

-- 1. Drop the UUID version (The old one causing issues)
DROP FUNCTION IF EXISTS public.increment_product_views(uuid);

-- 2. Drop the TEXT version (To ensure we start fresh)
DROP FUNCTION IF EXISTS public.increment_product_views(text);

-- 3. Recreate the CORRECT function (TEXT version)
CREATE OR REPLACE FUNCTION public.increment_product_views(product_id TEXT)
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

-- 4. Verify Visitor Devices Table (Just in case)
CREATE TABLE IF NOT EXISTS visitor_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_name TEXT NOT NULL UNIQUE,
  visit_count INTEGER DEFAULT 1,
  last_visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Ensure RLS and Policies for Visitor Devices
ALTER TABLE visitor_devices ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'visitor_devices' AND policyname = 'Public read access'
    ) THEN
        CREATE POLICY "Public read access" ON visitor_devices
        FOR SELECT USING (true);
    END IF;
END $$;

-- 6. Ensure Visitor Tracking RPC exists
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
