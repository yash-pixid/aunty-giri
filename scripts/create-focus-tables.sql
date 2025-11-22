-- Focus Feature Database Migration
-- Creates tables for focus sessions, events, and blocklist

-- Create focus_sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session configuration
  goal VARCHAR(255) NOT NULL,
  subject VARCHAR(100),
  planned_duration INTEGER NOT NULL,
  session_type VARCHAR(50) DEFAULT 'custom',
  
  -- Session timeline
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  actual_duration INTEGER,
  
  -- Session state
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  pause_count INTEGER DEFAULT 0,
  total_pause_duration INTEGER DEFAULT 0,
  
  -- Focus metrics (calculated post-session)
  focus_score DECIMAL(5,2),
  productivity_score DECIMAL(5,2),
  distraction_count INTEGER DEFAULT 0,
  app_switches INTEGER DEFAULT 0,
  
  -- Activity breakdown (in seconds)
  productive_time INTEGER DEFAULT 0,
  neutral_time INTEGER DEFAULT 0,
  distracting_time INTEGER DEFAULT 0,
  
  -- AI insights aggregation
  ai_summary JSONB DEFAULT '{}',
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for focus_sessions
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_status ON focus_sessions(status);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_start_time ON focus_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_status ON focus_sessions(user_id, status);

-- Create focus_session_events table
CREATE TABLE IF NOT EXISTS focus_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for focus_session_events
CREATE INDEX IF NOT EXISTS idx_focus_session_events_session_id ON focus_session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_focus_session_events_type ON focus_session_events(event_type);

-- Create focus_blocklist table
CREATE TABLE IF NOT EXISTS focus_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  item_type VARCHAR(20) NOT NULL,
  item_value TEXT NOT NULL,
  
  is_global BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, item_type, item_value)
);

-- Create index for focus_blocklist
CREATE INDEX IF NOT EXISTS idx_focus_blocklist_user_id ON focus_blocklist(user_id);

-- Add focus_session_id to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS focus_session_id UUID REFERENCES focus_sessions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_activities_focus_session_id ON activities(focus_session_id);

-- Add focus_session_id to screenshots table
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS focus_session_id UUID REFERENCES focus_sessions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_screenshots_focus_session_id ON screenshots(focus_session_id);

-- Create trigger for focus_sessions updated_at
CREATE TRIGGER update_focus_sessions_updated_at
BEFORE UPDATE ON focus_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT 'Focus tables created successfully!' AS status;
