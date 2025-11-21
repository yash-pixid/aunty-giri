-- Clear existing test data
TRUNCATE activities, screenshots, keystrokes, system_metrics RESTART IDENTITY CASCADE;

-- Get or create a test user
WITH new_user AS (
  INSERT INTO users (username, email, password, is_active, role, created_at, updated_at)
  SELECT 'testuser', 'test@example.com', 'hashed_password', true, 'user', NOW(), NOW()
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
  updated_at
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
  NOW()
FROM generate_series(1, 100) as n;

-- Insert some screenshots
WITH user_id AS (
  SELECT id FROM users WHERE username = 'testuser' LIMIT 1
)
INSERT INTO screenshots (
  user_id,
  image_path,
  created_at,
  updated_at
)
SELECT 
  (SELECT id FROM user_id),
  '/screenshots/screenshot-' || n || '.png',
  NOW() - (n * INTERVAL '2 hour'),
  NOW() - (n * INTERVAL '2 hour')
FROM generate_series(1, 20) as n;

-- Insert keystroke data
WITH user_id AS (
  SELECT id FROM users WHERE username = 'testuser' LIMIT 1
)
INSERT INTO keystrokes (
  user_id,
  window_title,
  app_name,
  keystroke_count,
  created_at,
  updated_at
)
SELECT 
  (SELECT id FROM user_id),
  'Window ' || n,
  CASE 
    WHEN n % 3 = 0 THEN 'VS Code'
    WHEN n % 3 = 1 THEN 'Chrome'
    ELSE 'Terminal'
  END,
  FLOOR(RANDOM() * 200 + 50)::integer,
  NOW() - (n * INTERVAL '30 minutes'),
  NOW() - (n * INTERVAL '30 minutes')
FROM generate_series(1, 50) as n;

-- Insert system metrics
WITH user_id AS (
  SELECT id FROM users WHERE username = 'testuser' LIMIT 1
)
INSERT INTO system_metrics (
  user_id,
  cpu_usage,
  memory_usage,
  disk_usage,
  created_at,
  updated_at
)
SELECT 
  (SELECT id FROM user_id),
  FLOOR(RANDOM() * 50 + 10)::numeric(5,2),
  FLOOR(RANDOM() * 70 + 20)::numeric(5,2),
  FLOOR(RANDOM() * 60 + 10)::numeric(5,2),
  NOW() - (n * INTERVAL '15 minutes'),
  NOW() - (n * INTERVAL '15 minutes')
FROM generate_series(1, 100) as n;
