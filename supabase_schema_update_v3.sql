-- Add 'link' column to 'slides' table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'slides' AND column_name = 'link') THEN
        ALTER TABLE slides ADD COLUMN link TEXT;
    END IF;
END $$;
