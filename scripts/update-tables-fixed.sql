-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
DROP TRIGGER IF EXISTS update_screenshots_updated_at ON screenshots;
DROP TRIGGER IF EXISTS update_keystrokes_updated_at ON keystrokes;
DROP TRIGGER IF EXISTS update_system_metrics_updated_at ON system_metrics;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_activities_user_id;
DROP INDEX IF EXISTS idx_screenshots_user_id;
DROP INDEX IF EXISTS idx_keystrokes_user_id;
DROP INDEX IF EXISTS idx_system_metrics_user_id;

-- 1. Update activities table
ALTER TABLE activities 
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS description;

ALTER TABLE activities 
  ADD COLUMN IF NOT EXISTS window_title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS app_name VARCHAR(255) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS activity_type VARCHAR(50) NOT NULL DEFAULT 'application',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS url TEXT;

-- 2. Update screenshots table
ALTER TABLE screenshots 
  RENAME COLUMN image_path TO file_path;

ALTER TABLE screenshots 
  DROP COLUMN IF EXISTS thumbnail_path,
  DROP COLUMN IF EXISTS captured_at,
  ADD COLUMN IF NOT EXISTS file_size INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS width INTEGER,
  ADD COLUMN IF NOT EXISTS height INTEGER,
  ADD COLUMN IF NOT EXISTS format VARCHAR(10) DEFAULT 'webp',
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Update keystrokes table
ALTER TABLE keystrokes 
  RENAME COLUMN key TO key_char;

ALTER TABLE keystrokes
  ADD COLUMN IF NOT EXISTS key_type VARCHAR(20) DEFAULT 'alphanumeric',
  ADD COLUMN IF NOT EXISTS window_title TEXT,
  ADD COLUMN IF NOT EXISTS app_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_shortcut BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS modifiers TEXT[] DEFAULT '{}';

-- 4. Update system_metrics table
ALTER TABLE system_metrics 
  ADD COLUMN IF NOT EXISTS cpu_temperature FLOAT,
  ADD COLUMN IF NOT EXISTS disk_read FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disk_write FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}'::jsonb;

-- Recreate indexes
CREATE INDEX idx_activities_user_id ON activities (user_id);
CREATE INDEX idx_activities_created_at ON activities (created_at);

CREATE INDEX idx_screenshots_user_id ON screenshots (user_id);
CREATE INDEX idx_screenshots_created_at ON screenshots (created_at);

CREATE INDEX idx_keystrokes_user_id ON keystrokes (user_id);
CREATE INDEX idx_keystrokes_timestamp ON keystrokes (timestamp);
CREATE INDEX idx_keystrokes_app_name ON keystrokes (app_name);
CREATE INDEX idx_keystrokes_is_shortcut ON keystrokes (is_shortcut);

CREATE INDEX idx_system_metrics_user_id ON system_metrics (user_id);
CREATE INDEX idx_system_metrics_created_at ON system_metrics (created_at);

-- Recreate the update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_screenshots_updated_at
BEFORE UPDATE ON screenshots
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keystrokes_updated_at
BEFORE UPDATE ON keystrokes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_metrics_updated_at
BEFORE UPDATE ON system_metrics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the schema changes
SELECT 
    table_name, 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name IN ('users', 'activities', 'screenshots', 'keystrokes', 'system_metrics')
ORDER BY 
    table_name, 
    ordinal_position;
