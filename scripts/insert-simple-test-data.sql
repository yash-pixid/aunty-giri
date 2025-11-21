-- First, let's get an existing user ID
WITH existing_user AS (
  SELECT id FROM users LIMIT 1
),
-- Insert test activities
activity_insert AS (
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
    (SELECT id FROM existing_user),
    NOW() - (n * INTERVAL '30 minutes'),
    NOW() - (n * INTERVAL '25 minutes'),
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
    300, -- 5 minutes in seconds
    true,
    NOW() - (n * INTERVAL '30 minutes'),
    NOW() - (n * INTERVAL '25 minutes')
  FROM generate_series(1, 20) as n
  RETURNING id
)
-- Just to make sure we have a SELECT at the end
SELECT 'Inserted ' || COUNT(*) || ' activities' as result FROM activity_insert;
