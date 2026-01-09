-- Add daily_views column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS daily_views INTEGER DEFAULT 0;

-- Add last_view_reset column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS last_view_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create an index on daily_views for faster sorting
CREATE INDEX IF NOT EXISTS idx_products_daily_views ON products(daily_views DESC);
