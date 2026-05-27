ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS extra_data JSONB DEFAULT '{}'::jsonb;
