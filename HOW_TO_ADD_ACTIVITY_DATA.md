# How to Add Activity Data to Table

## ✅ **Current Status**

The script has already created **101 activity records** for user `17bb37a7-cfe0-4797-99a3-4f860a4f1b70`.

## 🚀 **Method 1: Run the Existing Script**

### **Add More Records (Default: 100)**

```bash
node scripts/generateActivityData.js
```

This will add **100 more records** to the existing data.

### **Modify the Script to Add Different Amount**

Edit `scripts/generateActivityData.js` and change line 207:

```javascript
const count = 100; // Change this number
await generateActivities(USER_ID, count);
```

For example:
- `const count = 200;` - Adds 200 records
- `const count = 500;` - Adds 500 records

## 🔧 **Method 2: Direct Database Insert (SQL)**

You can also insert data directly using SQL:

```sql
INSERT INTO activities (
  id, user_id, window_title, app_name, url, 
  start_time, end_time, duration, activity_type, is_active
) VALUES (
  gen_random_uuid(),
  '17bb37a7-cfe0-4797-99a3-4f860a4f1b70',
  'VS Code - index.js',
  'VS Code',
  NULL,
  NOW() - INTERVAL '1 hour',
  NOW(),
  3600,
  'application',
  true
);
```

## 📝 **Method 3: Using Node.js Script (Custom)**

Create a custom script:

```javascript
import { Activity } from './models/index.js';

const userId = '17bb37a7-cfe0-4797-99a3-4f860a4f1b70';

// Add single activity
await Activity.create({
  user_id: userId,
  window_title: 'VS Code - app.js',
  app_name: 'VS Code',
  url: null,
  start_time: new Date('2025-11-22T10:00:00'),
  end_time: new Date('2025-11-22T11:00:00'),
  duration: 3600,
  activity_type: 'application',
  is_active: true
});
```

## 🎯 **Quick Commands**

### **Check Current Record Count**
```bash
node -e "
import { Activity } from './models/index.js';
const count = await Activity.count({ 
  where: { user_id: '17bb37a7-cfe0-4797-99a3-4f860a4f1b70' } 
});
console.log('Total records:', count);
process.exit(0);
"
```

### **Add 50 More Records**
Edit the script to change `count = 50` and run:
```bash
node scripts/generateActivityData.js
```

### **Clear All Records for User (if needed)**
```bash
node -e "
import { Activity } from './models/index.js';
const deleted = await Activity.destroy({ 
  where: { user_id: '17bb37a7-cfe0-4797-99a3-4f860a4f1b70' } 
});
console.log('Deleted', deleted, 'records');
process.exit(0);
"
```

## 📊 **What the Script Generates**

The script creates realistic activity data with:

- **60% Productive Apps**: VS Code, Chrome, Terminal, Slack, Firefox, Safari
- **32% Distracting Apps**: YouTube, Facebook, Twitter, Instagram, Netflix, Spotify
- **8% Neutral Apps**: Finder, Settings, Notes, Calculator

- **Realistic Durations**:
  - Productive: 5 minutes to 1 hour
  - Distracting: 1 minute to 30 minutes
  - Neutral: 30 seconds to 10 minutes

- **Time Distribution**: Activities spread across 9 AM - 11 PM
- **Date Range**: Last 14 days from current date
- **URLs**: Realistic URLs for browser activities

## ✅ **Verification**

After adding data, verify with:

```bash
node -e "
import { Activity } from './models/index.js';
const userId = '17bb37a7-cfe0-4797-99a3-4f860a4f1b70';
const count = await Activity.count({ where: { user_id: userId } });
console.log('Total activities:', count);
process.exit(0);
"
```

## 🎯 **Ready to Test Grok Predictions**

Once you have sufficient data (100+ records recommended), test the predictions API:

```bash
curl -X GET "http://localhost:3000/api/v1/dashboard/activity-predictions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

The API will analyze all activity records and generate predictions!
