-- Create site_settings table for global configuration
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (everyone needs to see the overlay)
CREATE POLICY "Public read access" ON site_settings
  FOR SELECT USING (true);

-- Allow authenticated users (admins) to update settings
CREATE POLICY "Admin update access" ON site_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert access" ON site_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert default overlay setting if not exists
INSERT INTO site_settings (key, value)
VALUES (
  'home_overlay', 
  '{"enabled": false, "text": "Welcome to our store! Check out our latest offers.", "dismissible": true}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
