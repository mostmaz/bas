-- 1. ADD MISSING COLUMN (If not exists)
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS revenue_reset_date TIMESTAMPTZ DEFAULT NULL;

-- 2. ENABLE RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so app can fetch settings)
DROP POLICY IF EXISTS "Public Read Access" ON store_settings;
CREATE POLICY "Public Read Access" 
ON store_settings FOR SELECT 
TO public 
USING (true);

-- Allow public update access
DROP POLICY IF EXISTS "Public Update Access" ON store_settings;
CREATE POLICY "Public Update Access" 
ON store_settings FOR UPDATE 
TO public 
USING (true) 
WITH CHECK (true);

-- Allow public insert access
DROP POLICY IF EXISTS "Public Insert Access" ON store_settings;
CREATE POLICY "Public Insert Access" 
ON store_settings FOR INSERT 
TO public 
WITH CHECK (true);
