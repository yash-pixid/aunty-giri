-- Clear existing test data
TRUNCATE activities, screenshots, keystrokes, system_metrics RESTART IDENTITY CASCADE;

-- Get or create a test user
WITH new_user AS (
  INSERT INTO users (username, email, password, is_active, role, created_at, updated_at)
  SELECT 'testuser', 'test@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, 'user', NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'testuser')
  RETURNING id
),
user_id AS (
  SELECT id FROM new_user
  UNION
  SELECT id FROM users WHERE username = 'testuser' LIMIT 1
)
-- Insert test activities for the past 7 days
INSERT INTO activities (
  user_id, 
  start_time, 
  end_time, 
  window_title, 
  app_name, 
  activity_type, 
  duration,
  is_active,
  created_at, 
  updated_at,
  url
)
SELECT 
  (SELECT id FROM user_id),
  NOW() - (n * INTERVAL '1 hour'),
  NOW() - (n * INTERVAL '1 hour') + (FLOOR(RANDOM() * 30 + 5) * INTERVAL '1 minute'),
  CASE 
    WHEN n % 5 = 0 THEN 'Visual Studio Code - Working on project'
    WHEN n % 5 = 1 THEN 'Google Chrome - Research'
    WHEN n % 5 = 2 THEN 'Terminal - Running commands'
    WHEN n % 5 = 3 THEN 'Zoom - Team Meeting'
    ELSE 'Slack - Team Communication'
  END,
  CASE 
    WHEN n % 5 = 0 THEN 'Visual Studio Code'
    WHEN n % 5 = 1 THEN 'Google Chrome'
    WHEN n % 5 = 2 THEN 'Terminal'
    WHEN n % 5 = 3 THEN 'Zoom'
    ELSE 'Slack'
  END,
  CASE 
    WHEN n % 5 = 0 THEN 'coding'
    WHEN n % 5 = 1 THEN 'browsing'
    WHEN n % 5 = 2 THEN 'terminal'
    WHEN n % 5 = 3 THEN 'meeting'
    ELSE 'communication'
  END,
  FLOOR(RANDOM() * 300 + 60)::integer, -- Random duration between 1-6 minutes
  true,
  NOW(),
  NOW(),
  CASE 
    WHEN n % 5 = 1 THEN 'https://www.google.com'
    WHEN n % 5 = 4 THEN 'https://slack.com'
    ELSE ''
  END
FROM generate_series(1, 100) as n;

-- Insert some screenshots
WITH user_id AS (
  SELECT id FROM users WHERE username = 'testuser' LIMIT 1
)
INSERT INTO screenshots (
  user_id,
  file_path,
  file_size,
  width,
  height,
  format,
  is_archived,
  created_at,
  updated_at,
  metadata
)
SELECT 
  (SELECT id FROM user_id),
  '/screenshots/screenshot-' || n || '.webp',
  FLOOR(RANDOM() * 500000 + 100000)::integer,
  1920,
  1080,
  'webp',
  false,
  NOW() - (n * INTERVAL '2 hour'),
  NOW() - (n * INTERVAL '2 hour'),
  '{}'::jsonb
FROM generate_series(1, 20) as n;

-- Insert keystroke data
WITH user_id AS (
  SELECT id FROM users WHERE username = 'testuser' LIMIT 1
),
apps AS (
  SELECT app_name, window_title FROM (
    VALUES 
      ('Visual Studio Code', 'index.js - project - VS Code'),
      ('Google Chrome', 'Google'),
      ('Terminal', 'Terminal'),
      ('Slack', 'Slack'),
      ('Zoom', 'Meeting')
  ) t(app_name, window_title)
)
INSERT INTO keystrokes (
  user_id,
  key_code,
  key_char,
  "timestamp",
  key_type,
  window_title,
  app_name,
  is_shortcut,
  modifiers,
  created_at,
  updated_at
)
SELECT 
  (SELECT id FROM user_id),
  65 + (n % 26), -- ASCII codes for A-Z
  CHR(97 + (n % 26)), -- a-z
  NOW() - (n * INTERVAL '5 minutes'),
  CASE WHEN n % 10 = 0 THEN 'control' ELSE 'alphanumeric' END,
  a.window_title,
  a.app_name,
  n % 10 = 0, -- 10% chance of being a shortcut
  CASE 
    WHEN n % 10 = 0 THEN ARRAY['Control', 'Shift']
    ELSE '{}'::text[]
  END,
  NOW() - (n * INTERVAL '5 minutes'),
  NOW() - (n * INTERVAL '5 minutes')
FROM generate_series(1, 200) as n
CROSS JOIN LATERAL (
  SELECT app_name, window_title 
  FROM apps 
  ORDER BY n % 5 + 1 
  LIMIT 1
) a;

-- Insert system metrics
WITH user_id AS (
  SELECT id FROM users WHERE username = 'testuser' LIMIT 1
)
INSERT INTO system_metrics (
  user_id,
  cpu_usage,
  memory_usage,
  disk_usage,
  network_in,
  network_out,
  "timestamp",
  cpu_temperature,
  disk_read,
  disk_write,
  metrics,
  created_at,
  updated_at
)
SELECT 
  (SELECT id FROM user_id),
  FLOOR(RANDOM() * 50 + 10)::double precision,
  FLOOR(RANDOM() * 70 + 20)::double precision,
  FLOOR(RANDOM() * 60 + 10)::double precision,
  FLOOR(RANDOM() * 1000000)::double precision,
  FLOOR(RANDOM() * 100000)::double precision,
  NOW() - (n * INTERVAL '15 minutes'),
  FLOOR(RANDOM() * 30 + 40)::double precision,
  FLOOR(RANDOM() * 1000000)::double precision,
  FLOOR(RANDOM() * 500000)::double precision,
  jsonb_build_object(
    'load_avg_1m', (RANDOM() * 2)::numeric(5,2),
    'load_avg_5m', (RANDOM() * 1.5)::numeric(5,2),
    'load_avg_15m', (RANDOM() * 1.2)::numeric(5,2)
  ),
  NOW() - (n * INTERVAL '15 minutes'),
  NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(1, 100) as n;

-- Verify the data was inserted
SELECT 'Activities' as table_name, COUNT(*) as count FROM activities
UNION ALL
SELECT 'Screenshots', COUNT(*) FROM screenshots
UNION ALL
SELECT 'Keystrokes', COUNT(*) FROM keystrokes
UNION ALL
SELECT 'System Metrics', COUNT(*) FROM system_metrics;
