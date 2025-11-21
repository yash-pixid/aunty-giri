-- Insert test users
INSERT INTO users (id, username, email, password, role, is_active, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'testuser', 'test@example.com', '$2a$10$uoCU0YvWyIPeZXaYPoC2k.6MMBesC18B6tQUW92H17uBYxP5JtWG2', 'student', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'student1', 'student1@example.com', '$2a$10$uoCU0YvWyIPeZXaYPoC2k.6MMBesC18B6tQUW92H17uBYxP5JtWG2', 'student', true, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'parent1', 'parent1@example.com', '$2a$10$uoCU0YvWyIPeZXaYPoC2k.6MMBesC18B6tQUW92H17uBYxP5JtWG2', 'parent', true, NOW(), NOW());

-- Insert test activities
WITH activity_data AS (
  SELECT 
    gen_random_uuid() as id,
    '11111111-1111-1111-1111-111111111111' as user_id,
    CASE 
      WHEN n % 5 = 0 THEN 'Coding Session'
      WHEN n % 5 = 1 THEN 'Web Browsing'
      WHEN n % 5 = 2 THEN 'Documentation'
      WHEN n % 5 = 3 THEN 'Video Meeting'
      ELSE 'Research'
    END as title,
    CASE 
      WHEN n % 5 = 0 THEN 'Working on project implementation'
      WHEN n % 5 = 1 THEN 'Research and learning'
      WHEN n % 5 = 2 THEN 'Reading documentation'
      WHEN n % 5 = 3 THEN 'Team sync meeting'
      ELSE 'General research activities'
    END as description,
    (NOW() - (n * INTERVAL '30 minutes') - (random() * INTERVAL '2 hours')) as start_time,
    (NOW() - (n * INTERVAL '25 minutes') - (random() * INTERVAL '1 hour 50 minutes')) as end_time
  FROM generate_series(1, 50) as n
)
INSERT INTO activities (id, user_id, title, description, start_time, end_time, created_at, updated_at)
SELECT 
  id, 
  user_id::uuid, 
  title, 
  description, 
  start_time, 
  end_time,
  start_time as created_at,
  end_time as updated_at
FROM activity_data;

-- Insert test screenshots
WITH screenshot_data AS (
  SELECT 
    gen_random_uuid() as id,
    '11111111-1111-1111-1111-111111111111' as user_id,
    '/uploads/screenshots/screenshot-' || n || '.png' as image_path,
    '/uploads/thumbnails/thumb-' || n || '.jpg' as thumbnail_path,
    (NOW() - (n * INTERVAL '2 hours') - (random() * INTERVAL '1 hour')) as captured_at
  FROM generate_series(1, 20) as n
)
INSERT INTO screenshots (id, user_id, image_path, thumbnail_path, captured_at, created_at, updated_at)
SELECT 
  id, 
  user_id::uuid, 
  image_path, 
  thumbnail_path, 
  captured_at,
  captured_at as created_at,
  captured_at as updated_at
FROM screenshot_data;

-- Insert test keystrokes
WITH keystroke_data AS (
  SELECT 
    gen_random_uuid() as id,
    '11111111-1111-1111-1111-111111111111' as user_id,
    (65 + (random() * 25))::int as key_code,
    chr(65 + (random() * 25)::int) as key,
    (NOW() - (n * INTERVAL '5 minutes') - (random() * INTERVAL '4 minutes')) as timestamp
  FROM generate_series(1, 500) as n
)
INSERT INTO keystrokes (id, user_id, key_code, key, timestamp, created_at, updated_at)
SELECT 
  id, 
  user_id::uuid, 
  key_code, 
  key, 
  timestamp,
  timestamp as created_at,
  timestamp as updated_at
FROM keystroke_data;

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
INSERT INTO system_metrics (id, user_id, cpu_usage, memory_usage, disk_usage, network_in, network_out, timestamp, created_at, updated_at)
SELECT 
  id, 
  user_id::uuid, 
  cpu_usage, 
  memory_usage, 
  disk_usage, 
  network_in, 
  network_out, 
  timestamp,
  timestamp as created_at,
  timestamp as updated_at
FROM metric_data;

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
