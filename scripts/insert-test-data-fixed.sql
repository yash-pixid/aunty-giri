-- Insert test users (only if they don't exist)
INSERT INTO users (id, username, email, password, role, is_active, created_at, updated_at)
SELECT '11111111-1111-1111-1111-111111111111', 'testuser', 'test@example.com', '$2a$10$uoCU0YvWyIPeZXaYPoC2k.6MMBesC18B6tQUW92H17uBYxP5JtWG2', 'student', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = '11111111-1111-1111-1111-111111111111');

-- Insert test activities
WITH activity_data AS (
  SELECT 
    gen_random_uuid() as id,
    '11111111-1111-1111-1111-111111111111' as user_id,
    NOW() - (n * INTERVAL '30 minutes') - (random() * INTERVAL '2 hours') as start_time,
    NOW() - (n * INTERVAL '25 minutes') - (random() * INTERVAL '1 hour 50 minutes') as end_time,
    CASE 
      WHEN n % 5 = 0 THEN 'Visual Studio Code - Working on project'
      WHEN n % 5 = 1 THEN 'Google Chrome - Research'
      WHEN n % 5 = 2 THEN 'Terminal - Running commands'
      WHEN n % 5 = 3 THEN 'Zoom - Team Meeting'
      ELSE 'Slack - Team Communication'
    END as window_title,
    CASE 
      WHEN n % 5 = 0 THEN 'Visual Studio Code'
      WHEN n % 5 = 1 THEN 'Google Chrome'
      WHEN n % 5 = 2 THEN 'Terminal'
      WHEN n % 5 = 3 THEN 'Zoom'
      ELSE 'Slack'
    END as app_name,
    CASE 
      WHEN n % 5 = 0 THEN 'coding'
      WHEN n % 5 = 1 THEN 'browsing'
      WHEN n % 5 = 2 THEN 'terminal'
      WHEN n % 5 = 3 THEN 'meeting'
      ELSE 'communication'
    END as activity_type,
    CASE 
      WHEN n % 5 = 1 THEN 'https://' || 
        CASE 
          WHEN n % 3 = 0 THEN 'github.com'
          WHEN n % 3 = 1 THEN 'stackoverflow.com'
          ELSE 'google.com'
        END
      ELSE NULL
    END as url,
    (EXTRACT(EPOCH FROM (NOW() - (n * INTERVAL '25 minutes') - (random() * INTERVAL '1 hour 50 minutes'))) - 
     EXTRACT(EPOCH FROM (NOW() - (n * INTERVAL '30 minutes') - (random() * INTERVAL '2 hours'))))::integer as duration
  FROM generate_series(1, 50) as n
)
INSERT INTO activities (
  id, user_id, start_time, end_time, window_title, 
  app_name, activity_type, url, duration, created_at, updated_at
)
SELECT 
  id, 
  user_id::uuid, 
  start_time, 
  end_time,
  window_title,
  app_name,
  activity_type,
  url,
  duration,
  start_time as created_at,
  end_time as updated_at
FROM activity_data
ON CONFLICT (id) DO NOTHING;

-- Insert test screenshots
WITH screenshot_data AS (
  SELECT 
    gen_random_uuid() as id,
    '11111111-1111-1111-1111-111111111111' as user_id,
    NOW() - (n * INTERVAL '2 hours') - (random() * INTERVAL '1 hour') as captured_at,
    'Screenshot ' || n as window_title,
    CASE 
      WHEN n % 3 = 0 THEN 'Visual Studio Code'
      WHEN n % 3 = 1 THEN 'Google Chrome'
      ELSE 'Terminal'
    END as app_name
  FROM generate_series(1, 20) as n
)
INSERT INTO screenshots (
  id, user_id, captured_at, created_at, updated_at,
  window_title, app_name
)
SELECT 
  id, 
  user_id::uuid, 
  captured_at,
  captured_at as created_at,
  captured_at as updated_at,
  window_title,
  app_name
FROM screenshot_data
ON CONFLICT (id) DO NOTHING;

-- Insert test keystrokes
WITH keystroke_data AS (
  SELECT 
    gen_random_uuid() as id,
    '11111111-1111-1111-1111-111111111111' as user_id,
    (65 + (random() * 25))::int as key_code,
    (NOW() - (n * INTERVAL '5 minutes') - (random() * INTERVAL '4 minutes')) as timestamp,
    CASE 
      WHEN n % 3 = 0 THEN 'Visual Studio Code'
      WHEN n % 3 = 1 THEN 'Google Chrome'
      ELSE 'Terminal'
    END as window_title,
    CASE 
      WHEN n % 3 = 0 THEN 'Visual Studio Code'
      WHEN n % 3 = 1 THEN 'Google Chrome'
      ELSE 'Terminal'
    END as app_name
  FROM generate_series(1, 500) as n
)
INSERT INTO keystrokes (
  id, user_id, key_code, timestamp, 
  created_at, updated_at, window_title, app_name
)
SELECT 
  id, 
  user_id::uuid, 
  key_code, 
  timestamp,
  timestamp as created_at,
  timestamp as updated_at,
  window_title,
  app_name
FROM keystroke_data
ON CONFLICT (id) DO NOTHING;

-- Insert test system metrics
WITH metric_data AS (
  SELECT 
    gen_random_uuid() as id,
    '11111111-1111-1111-1111-111111111111' as user_id,
    (20 + random() * 80)::numeric(5,2) as cpu_usage,
    (30 + random() * 60)::numeric(5,2) as memory_usage,
    (10 + random() * 40)::numeric(5,2) as disk_usage,
    (random() * 1024 * 1024)::int as network_in,
    (random() * 1024 * 512)::int as network_out,
    (NOW() - (n * INTERVAL '10 minutes') - (random() * INTERVAL '5 minutes')) as timestamp
  FROM generate_series(1, 200) as n
)
INSERT INTO system_metrics (
  id, user_id, cpu_usage, memory_usage, disk_usage, 
  network_in, network_out, timestamp, created_at, updated_at
)
SELECT 
  id, 
  '11111111-1111-1111-1111-111111111111'::uuid, 
  cpu_usage, 
  memory_usage, 
  disk_usage, 
  network_in, 
  network_out, 
  timestamp,
  timestamp as created_at,
  timestamp as updated_at
FROM metric_data
ON CONFLICT (id) DO NOTHING;

-- Verify the data was inserted
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'activities', COUNT(*) FROM activities
UNION ALL
SELECT 'screenshots', COUNT(*) FROM screenshots
UNION ALL
SELECT 'keystrokes', COUNT(*) FROM keystrokes
UNION ALL
SELECT 'system_metrics', COUNT(*) FROM system_metrics
ORDER BY table_name;
