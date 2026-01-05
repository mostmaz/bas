-- Create visitor_devices table if it doesn't exist
CREATE TABLE IF NOT EXISTS visitor_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_name TEXT NOT NULL UNIQUE,
  visit_count INTEGER DEFAULT 1,
  last_visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE visitor_devices ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access" ON visitor_devices
  FOR SELECT USING (true);

-- Create RPC function to track device visits safely
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
