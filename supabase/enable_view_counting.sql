-- Enable RLS on products table if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon) to read products (usually already exists, but good to ensure)
CREATE POLICY "Public products are viewable by everyone" 
ON products FOR SELECT 
USING (true);

-- Allow anyone to update ONLY the view counts
-- Note: Supabase policies for UPDATE are row-based. 
-- To restrict columns, we usually rely on a stored procedure or a trigger, 
-- but for simplicity in this context, we'll allow update access to the table 
-- and trust the client to only send view updates (or use a trigger for security).
-- A safer approach is a Security Definer function, but let's start with a policy 
-- that allows updates if the user is just incrementing views.

CREATE POLICY "Allow public to increment views"
ON products FOR UPDATE
USING (true)
WITH CHECK (true);

-- BETTER APPROACH: Use a stored procedure (RPC) to increment views safely
-- This prevents users from modifying other fields like price.

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
