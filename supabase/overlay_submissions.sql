-- Create overlay_submissions table
CREATE TABLE IF NOT EXISTS overlay_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE overlay_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public insert (anyone can submit)
CREATE POLICY "Public insert access" ON overlay_submissions
  FOR INSERT WITH CHECK (true);

-- Allow admin select (only authenticated/admin can view)
-- Note: We might need to relax this for the PIN-based admin if we don't do full auth
-- For now, let's allow public read but we will filter in the UI or rely on the obscure URL/PIN
-- Actually, better to stick to the pattern we used for site_settings if we want the admin dashboard to read it without full auth
CREATE POLICY "Allow anon select" ON overlay_submissions
  FOR SELECT USING (true);
  
-- Grant permissions
GRANT ALL ON overlay_submissions TO anon;
GRANT ALL ON overlay_submissions TO authenticated;
GRANT ALL ON overlay_submissions TO service_role;
