# Student Monitor Backend - API Contracts

This document describes all API endpoints, request/response formats, and examples for the Student Monitor Backend API.

**Base URL**: `http://localhost:3000`

**API Version**: `v1`

**Note**: Authentication is required for most endpoints. Only registration, login, refresh-token, and health check endpoints work without authentication tokens.

**Authentication**: For protected endpoints, include the JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Monitor APIs](#monitor-apis)
3. [Dashboard APIs](#dashboard-apis)4. [Recommendation APIs](#recommendation-apis)
5. [Health Check](#health-check)

---

## Authentication APIs

Base Path: `/api/v1/auth`

### 1. Register User

**POST** `/api/v1/auth/register`

Register a new user account.

#### Request Body

```json
{
  "username": "string (required, 3-50 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)",
  "role": "string (optional, 'admin' | 'parent' | 'student', default: 'student')",
  "student_standard": "integer (optional, 1-12, required if role is 'student')"
}
```

#### Response

**Status**: `201 Created`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "string",
      "is_active": true,
      "created_at": "ISO8601 datetime",
      "updated_at": "ISO8601 datetime"
    },
    "token": "jwt_token_string"
  }
}
```

#### Error Response

**Status**: `400 Bad Request`

```json
{
  "status": "error",
  "message": "User with this email or username already exists"
}
```

---

### 2. Register Parent-Student

**POST** `/api/v1/auth/register-parent-student`

Register both parent and student accounts in a single request. Creates two linked user accounts where the student is associated with the parent.

#### Request Body

```json
{
  "parent_name": "string (required, parent's full name)",
  "parent_email": "string (required, valid email for parent)",
  "parent_password": "string (required, min 6 characters)",
  "student_name": "string (required, student's full name)",
  "student_email": "string (required, valid email for student)",
  "student_password": "string (required, min 6 characters)",
  "student_standard": "integer (required, 1-12, student's class/grade)"
}
```

#### Response

**Status**: `201 Created`

```json
{
  "status": "success",
  "message": "Parent and student accounts created successfully",
  "data": {
    "parent": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "parent",
      "parent_id": null,
      "student_standard": null,
      "is_active": true,
      "created_at": "ISO8601 datetime",
      "updated_at": "ISO8601 datetime"
    },
    "student": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "student",
      "parent_id": "parent_uuid",
      "student_standard": 9,
      "is_active": true,
      "created_at": "ISO8601 datetime",
      "updated_at": "ISO8601 datetime"
    },
    "primaryUser": {
      "id": "parent_uuid",
      "username": "string",
      "email": "string",
      "role": "parent",
      "is_active": true,
      "created_at": "ISO8601 datetime",
      "updated_at": "ISO8601 datetime"
    },
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": "15m"
  }
}
```

#### Error Responses

**Status**: `400 Bad Request`

```json
{
  "status": "error",
  "message": "Parent with this email or username already exists"
}
```

```json
{
  "status": "error",
  "message": "Student with this email or username already exists"
}
```

```json
{
  "status": "error",
  "message": "student_standard must be an integer between 1 and 12"
}
```

```json
{
  "status": "error",
  "message": "All fields are required: parent_name, parent_email, parent_password, student_name, student_email, student_password, student_standard"
}
```

---

### 3. Login

**POST** `/api/v1/auth/login`

Authenticate and get JWT token.

#### Request Body

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "string",
      "is_active": true,
      "last_active": "ISO8601 datetime"
    },
    "token": "jwt_token_string"
  }
}
```

#### Error Response

**Status**: `401 Unauthorized`

```json
{
  "status": "error",
  "message": "Invalid credentials"
}
```

---

### 4. Refresh Token

**POST** `/api/v1/auth/refresh-token`

Refresh access token using refresh token.

#### Request Body

```json
{
  "refreshToken": "string (required)"
}
```

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "accessToken": "jwt_token_string",
    "refreshToken": "jwt_refresh_token_string",
    "expiresIn": "15m"
  }
}
```

#### Error Response

**Status**: `401 Unauthorized`

```json
{
  "status": "error",
  "message": "Invalid or expired refresh token"
}
```

---

### 5. Get Current User

**GET** `/api/v1/auth/me`

Get current authenticated user information.

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "string",
      "is_active": true,
      "created_at": "ISO8601 datetime",
      "updated_at": "ISO8601 datetime"
    }
  }
}
```

---

### 6. Update Profile

**PUT** `/api/v1/auth/profile`

Update user profile information.

#### Request Body

```json
{
  "username": "string (optional)",
  "email": "string (optional)",
  "currentPassword": "string (required if changing password)",
  "newPassword": "string (required if changing password)"
}
```

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "string",
      "updated_at": "ISO8601 datetime"
    }
  }
}
```

---

### 7. Logout

**POST** `/api/v1/auth/logout`

Logout current user (client-side token removal).

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

## Monitor APIs

Base Path: `/api/v1/monitor`

### 1. Upload Screenshot

**POST** `/api/v1/monitor/screenshot`

Upload a screenshot image.

#### Request

- **Content-Type**: `multipart/form-data`
- **Body**: Form data with field `screenshot` (image file)
  - Allowed types: `image/jpeg`, `image/png`, `image/webp`
  - Max file size: `10MB`

#### Response

**Status**: `201 Created`

```json
{
  "status": "success",
  "data": {
    "screenshot": {
      "id": "uuid",
      "userId": "uuid",
      "file_path": "string",
      "file_size": "integer (bytes)",
      "width": "integer",
      "height": "integer",
      "format": "webp",
      "created_at": "ISO8601 datetime",
      "metadata": {
        "user_agent": "string",
        "ip": "string",
        "original_name": "string"
      }
    }
  }
}
```

---

### 2. Get Screenshots

**GET** `/api/v1/monitor/screenshots`

Get list of screenshots with pagination.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | ISO8601 | No | - | Filter start date |
| `endDate` | ISO8601 | No | - | Filter end date |
| `limit` | integer | No | 50 | Number of results per page |
| `offset` | integer | No | 0 | Number of results to skip |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "total": "integer",
    "screenshots": [
      {
        "id": "uuid",
        "userId": "uuid",
        "file_path": "string",
        "file_size": "integer",
        "width": "integer",
        "height": "integer",
        "format": "string",
        "created_at": "ISO8601 datetime",
        "metadata": {}
      }
    ]
  }
}
```

---

### 3. Delete Screenshot

**DELETE** `/api/v1/monitor/screenshots/:id`

Delete a screenshot by ID.

#### URL Parameters

- `id` (uuid): Screenshot ID

#### Response

**Status**: `204 No Content` or `200 OK`

```json
{
  "status": "success",
  "data": null
}
```

---

### 4. Log Activity

**POST** `/api/v1/monitor/activity`

Log application/browser activity.

#### Request Body

```json
{
  "window_title": "string (required)",
  "app_name": "string (required)",
  "start_time": "ISO8601 datetime (required)",
  "end_time": "ISO8601 datetime (required)",
  "activity_type": "string (required, 'application' | 'browser' | 'system')",
  "url": "string (optional, for browser activities)",
  "metadata": "object (optional)"
}
```

#### Response

**Status**: `201 Created`

```json
{
  "status": "success",
  "data": {
    "activity": {
      "id": "uuid",
      "userId": "uuid",
      "window_title": "string",
      "app_name": "string",
      "start_time": "ISO8601 datetime",
      "end_time": "ISO8601 datetime",
      "duration": "integer (seconds)",
      "activity_type": "string",
      "url": "string | null",
      "created_at": "ISO8601 datetime",
      "updated_at": "ISO8601 datetime",
      "metadata": {}
    }
  }
}
```

---

### 5. Get Activities

**GET** `/api/v1/monitor/activities`

Get list of activities with filtering.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | ISO8601 | No | - | Filter start date |
| `endDate` | ISO8601 | No | - | Filter end date |
| `limit` | integer | No | 100 | Number of results per page |
| `offset` | integer | No | 0 | Number of results to skip |
| `appName` | string | No | - | Filter by app name |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "total": "integer",
    "activities": [
      {
        "id": "uuid",
        "userId": "uuid",
        "window_title": "string",
        "app_name": "string",
        "start_time": "ISO8601 datetime",
        "end_time": "ISO8601 datetime",
        "duration": "integer",
        "activity_type": "string",
        "url": "string | null",
        "created_at": "ISO8601 datetime"
      }
    ]
  }
}
```

---

### 6. Get Activity Summary

**GET** `/api/v1/monitor/activities/summary`

Get aggregated activity summary.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | ISO8601 | No | - | Filter start date |
| `endDate` | ISO8601 | No | - | Filter end date |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "total_time": "integer (seconds)",
    "by_app": [
      {
        "app_name": "string",
        "total_duration": "integer (seconds)",
        "activity_count": "integer"
      }
    ],
    "by_type": [
      {
        "activity_type": "string",
        "total_duration": "integer (seconds)"
      }
    ]
  }
}
```

---

### 7. Log Keystrokes

**POST** `/api/v1/monitor/keystrokes`

Log keystroke data (bulk).

#### Request Body

```json
{
  "key_log": [
    {
      "key_code": "integer (required)",
      "key_char": "string (optional)",
      "key_type": "string (required, 'alphanumeric' | 'special' | etc.)",
      "timestamp": "ISO8601 datetime (required)",
      "window_title": "string (optional)",
      "app_name": "string (optional)",
      "is_shortcut": "boolean (optional, default: false)",
      "modifiers": "array (optional, e.g., ['ctrl', 'shift'])"
    }
  ]
}
```

#### Response

**Status**: `201 Created`

```json
{
  "status": "success",
  "data": {
    "keystrokes": [
      {
        "id": "uuid",
        "userId": "uuid",
        "key_code": "integer",
        "key_char": "string | null",
        "key_type": "string",
        "timestamp": "ISO8601 datetime",
        "window_title": "string | null",
        "app_name": "string",
        "is_shortcut": "boolean",
        "modifiers": "array",
        "created_at": "ISO8601 datetime"
      }
    ]
  }
}
```

---

### 8. Get Keystrokes

**GET** `/api/v1/monitor/keystrokes`

Get list of keystrokes.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_date` | ISO8601 | No | - | Filter start date |
| `end_date` | ISO8601 | No | - | Filter end date |
| `limit` | integer | No | 100 | Number of results per page |
| `offset` | integer | No | 0 | Number of results to skip |
| `app_name` | string | No | - | Filter by app name |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "total": "integer",
    "keystrokes": [
      {
        "id": "uuid",
        "userId": "uuid",
        "key_code": "integer",
        "key_char": "string",
        "timestamp": "ISO8601 datetime",
        "app_name": "string"
      }
    ]
  }
}
```

---

### 9. Log System Metrics

**POST** `/api/v1/monitor/metrics`

Log system performance metrics.

#### Request Body

```json
{
  "cpu": {
    "usage": "number (required, 0-100)",
    "temperature": "number (optional, celsius)"
  },
  "memory": {
    "usage": "number (required, 0-100)"
  },
  "disk": {
    "usage": "number (required, 0-100)",
    "read": "number (optional)",
    "write": "number (optional)"
  },
  "network": {
    "in": "number (optional, bytes)",
    "out": "number (optional, bytes)"
  }
}
```

#### Response

**Status**: `201 Created`

```json
{
  "status": "success",
  "data": {
    "metric": {
      "id": "uuid",
      "userId": "uuid",
      "cpu_usage": "number",
      "memory_usage": "number",
      "disk_usage": "number",
      "network_in": "number",
      "network_out": "number",
      "cpu_temperature": "number | null",
      "disk_read": "number",
      "disk_write": "number",
      "timestamp": "ISO8601 datetime",
      "created_at": "ISO8601 datetime",
      "metrics": {
        "cpu": {},
        "memory": {},
        "disk": {},
        "network": {}
      }
    }
  }
}
```

---

### 10. Get System Metrics

**GET** `/api/v1/monitor/metrics`

Get list of system metrics.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_date` | ISO8601 | No | - | Filter start date |
| `end_date` | ISO8601 | No | - | Filter end date |
| `limit` | integer | No | 100 | Number of results per page |
| `offset` | integer | No | 0 | Number of results to skip |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "total": "integer",
    "metrics": [
      {
        "id": "uuid",
        "userId": "uuid",
        "cpu_usage": "number",
        "memory_usage": "number",
        "disk_usage": "number",
        "network_in": "number",
        "network_out": "number",
        "cpu_temperature": "number | null",
        "created_at": "ISO8601 datetime"
      }
    ]
  }
}
```

---

### 11. Get Metrics Summary

**GET** `/api/v1/monitor/metrics/summary`

Get aggregated system metrics summary.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `start_date` | ISO8601 | No | - | Filter start date |
| `end_date` | ISO8601 | No | - | Filter end date |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "avg_cpu_usage": "number",
    "avg_memory_usage": "number",
    "avg_disk_usage": "number",
    "avg_network_in": "number",
    "avg_network_out": "number",
    "avg_cpu_temp": "number",
    "avg_disk_read": "number",
    "avg_disk_write": "number"
  }
}
```

---

## Dashboard APIs

Base Path: `/api/v1/dashboard`

### 1. Get Dashboard Summary

**GET** `/api/v1/dashboard/summary`

Get overall dashboard summary with today's statistics.

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "summary": {
      "totalTime": "integer (seconds)",
      "productiveTime": "integer (seconds)",
      "productivityScore": "integer (0-100)",
      "screenshotsCount": "integer",
      "avg_cpu_usage": "number",
      "avg_memory_usage": "number",
      "avg_disk_usage": "number"
    },
    "comparison": {
      "yesterday_total_time": "integer (seconds)"
    }
  }
}
```

---

### 2. Get Activity Timeline

**GET** `/api/v1/dashboard/timeline`

Get activity timeline grouped by time intervals.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | ISO8601 date | No | today | Target date (YYYY-MM-DD) |
| `interval` | string | No | hour | Grouping interval ('minute' | 'hour' | 'day') |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "timeline": {
      "2025-11-20 18:00": [
        {
          "app_name": "string",
          "duration": "integer (seconds)"
        }
      ]
    },
    "activity_types": ["string"]
  }
}
```

---

### 3. Get Top Applications

**GET** `/api/v1/dashboard/top-apps`

Get top applications by usage time.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 10 | Number of top apps to return |
| `startDate` | ISO8601 | No | - | Filter start date |
| `endDate` | ISO8601 | No | - | Filter end date |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": [
    {
      "app_name": "string",
      "total_duration": "integer (seconds)",
      "sessions": "integer"
    }
  ]
}
```

---

### 4. Get Website Usage

**GET** `/api/v1/dashboard/website-usage`

Get top websites by visit count and time spent.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 20 | Number of websites to return |
| `startDate` | ISO8601 | No | - | Filter start date |
| `endDate` | ISO8601 | No | - | Filter end date |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": [
    {
      "domain": "string",
      "total_duration": "integer (seconds)",
      "visits": "integer"
    }
  ]
}
```

---

### 5. Get Productivity Score

**GET** `/api/v1/dashboard/productivity-score`

Get productivity score and breakdown.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | ISO8601 | No | - | Filter start date |
| `endDate` | ISO8601 | No | - | Filter end date |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "score": "integer (0-100)",
    "breakdown": {
      "productive": "integer (seconds)",
      "neutral": "integer (seconds)",
      "distracting": "integer (seconds)"
    },
    "totalTime": "integer (seconds)"
  }
}
```

---

### 6. Get Screenshots (Dashboard)

**GET** `/api/v1/dashboard/screenshots`

Get paginated screenshots for dashboard.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Results per page |
| `startDate` | ISO8601 | No | - | Filter start date |
| `endDate` | ISO8601 | No | - | Filter end date |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "total": "integer",
    "totalPages": "integer",
    "currentPage": "integer",
    "screenshots": [
      {
        "id": "uuid",
        "userId": "uuid",
        "file_path": "string",
        "file_size": "integer",
        "width": "integer",
        "height": "integer",
        "format": "string",
        "created_at": "ISO8601 datetime",
        "metadata": {}
      }
    ]
  }
}
```

---

### 7. Generate Activity Report

**GET** `/api/v1/dashboard/activity-report`

Generate comprehensive activity report.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startDate` | ISO8601 | No | - | Report start date |
| `endDate` | ISO8601 | No | - | Report end date |
| `format` | string | No | json | Output format ('json') |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "summary": {
      "totalTime": "integer (seconds)",
      "totalSessions": "integer",
      "uniqueApps": "integer",
      "avgCpuUsage": "number",
      "avgMemoryUsage": "number",
      "avgDiskUsage": "number"
    },
    "topApps": [
      {
        "appName": "string",
        "totalDuration": "integer (seconds)",
        "sessions": "integer"
      }
    ],
    "dailyActivity": [
      {
        "date": "ISO8601 date",
        "totalDuration": "integer (seconds)"
      }
    ],
    "topWebsites": [
      {
        "url": "string",
        "totalDuration": "integer (seconds)",
        "visits": "integer"
      }
    ]
  }
}
```

---

## Recommendation APIs

Base Path: `/api/v1/recommendations`

### 1. Get Personalized Recommendations

**GET** `/api/v1/recommendations`

Get personalized content recommendations based on user's standard and trending topics in India.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 20 | Number of recommendations to return |
| `offset` | integer | No | 0 | Number of recommendations to skip |
| `category` | string | No | - | Filter by category |
| `content_type` | string | No | - | Filter by content type ('video', 'article', 'course', 'tutorial', 'blog') |
| `difficulty_level` | string | No | - | Filter by difficulty ('beginner', 'intermediate', 'advanced') |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "total": "integer",
    "recommendations": [
      {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "content_type": "string",
        "url": "string",
        "thumbnail_url": "string",
        "category": "string",
        "subcategory": "string",
        "target_standards": "array",
        "difficulty_level": "string",
        "duration_minutes": "integer",
        "language": "string",
        "source": "string",
        "author": "string",
        "rating": "number",
        "tags": "array",
        "trending_score": "number",
        "personalization_score": "number",
        "created_at": "ISO8601 datetime",
        "user_interaction": {
          "interaction_type": "string",
          "rating": "integer",
          "recommended_at": "ISO8601 datetime"
        }
      }
    ],
    "pagination": {
      "limit": "integer",
      "offset": "integer",
      "total_pages": "integer"
    }
  }
}
```

---

### 2. Get Trending Topics

**GET** `/api/v1/recommendations/trending-topics`

Get trending topics relevant to user's standard and current growth trends in India.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 10 | Number of topics to return |
| `category` | string | No | - | Filter by category |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "trending_topics": [
      {
        "id": "uuid",
        "topic_name": "string",
        "description": "string",
        "category": "string",
        "target_age_groups": "array",
        "target_standards": "array",
        "relevance_in_india": "string",
        "future_prospects": "string",
        "trending_score": "number",
        "growth_rate": "number",
        "job_market_demand": "string",
        "salary_range": "string",
        "skills_required": "array",
        "related_careers": "array",
        "learning_path": "array",
        "created_at": "ISO8601 datetime"
      }
    ]
  }
}
```

---

### 3. Get Recommendations by Category

**GET** `/api/v1/recommendations/category/:category`

Get recommendations filtered by a specific category.

#### URL Parameters

- `category` (string): Category name (e.g., 'technology', 'ai_ml', 'digital_marketing')

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 15 | Number of recommendations to return |
| `offset` | integer | No | 0 | Number of recommendations to skip |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "category": "string",
    "total": "integer",
    "recommendations": "array (same structure as personalized recommendations)",
    "pagination": {
      "limit": "integer",
      "offset": "integer",
      "total_pages": "integer"
    }
  }
}
```

---

### 4. Search Recommendations

**GET** `/api/v1/recommendations/search`

Search recommendations by query string.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search query (minimum 2 characters) |
| `limit` | integer | No | 20 | Number of results to return |
| `offset` | integer | No | 0 | Number of results to skip |
| `category` | string | No | - | Filter by category |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "query": "string",
    "total": "integer",
    "recommendations": "array (same structure as personalized recommendations)",
    "pagination": {
      "limit": "integer",
      "offset": "integer",
      "total_pages": "integer"
    }
  }
}
```

---

### 5. Get Career Recommendations

**GET** `/api/v1/recommendations/career`

Get career-focused recommendations based on high-demand fields in India.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 15 | Number of recommendations to return |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "career_topics": "array (trending topics with high job demand)",
    "recommendations": "array (career-focused content)"
  }
}
```

---

### 6. Get Recommendations for Topic

**GET** `/api/v1/recommendations/topic/:topic_id`

Get recommendations related to a specific trending topic.

#### URL Parameters

- `topic_id` (uuid): Trending topic ID

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 10 | Number of recommendations to return |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "topic": {
      "id": "uuid",
      "topic_name": "string",
      "description": "string",
      "category": "string",
      "future_prospects": "string",
      "job_market_demand": "string",
      "salary_range": "string"
    },
    "recommendations": "array (related content)"
  }
}
```

---

### 7. Record User Interaction

**POST** `/api/v1/recommendations/interactions/:recommendation_id`

Record user interaction with a recommendation (viewed, liked, saved, etc.).

#### URL Parameters

- `recommendation_id` (uuid): Recommendation ID

#### Request Body

```json
{
  "interaction_type": "string (required, 'viewed' | 'clicked' | 'liked' | 'saved' | 'completed' | 'dismissed')",
  "rating": "integer (optional, 1-5)",
  "time_spent_minutes": "integer (optional)",
  "completion_percentage": "number (optional, 0-100)",
  "feedback": "string (optional)"
}
```

#### Response

**Status**: `201 Created`

```json
{
  "status": "success",
  "data": {
    "interaction": {
      "id": "uuid",
      "user_id": "uuid",
      "recommendation_id": "uuid",
      "interaction_type": "string",
      "rating": "integer",
      "time_spent_minutes": "integer",
      "completion_percentage": "number",
      "feedback": "string",
      "recommended_at": "ISO8601 datetime",
      "interacted_at": "ISO8601 datetime"
    }
  }
}
```

---

### 8. Get User Interaction History

**GET** `/api/v1/recommendations/interactions`

Get user's interaction history with recommendations.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 50 | Number of interactions to return |
| `offset` | integer | No | 0 | Number of interactions to skip |
| `interaction_type` | string | No | - | Filter by interaction type |

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "total": "integer",
    "interactions": [
      {
        "id": "uuid",
        "interaction_type": "string",
        "rating": "integer",
        "time_spent_minutes": "integer",
        "completion_percentage": "number",
        "feedback": "string",
        "recommended_at": "ISO8601 datetime",
        "interacted_at": "ISO8601 datetime",
        "Recommendation": {
          "title": "string",
          "content_type": "string",
          "category": "string",
          "url": "string",
          "thumbnail_url": "string"
        }
      }
    ],
    "pagination": {
      "limit": "integer",
      "offset": "integer",
      "total_pages": "integer"
    }
  }
}
```

---

### 9. Get Available Categories

**GET** `/api/v1/recommendations/meta/categories`

Get list of available recommendation categories.

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "categories": [
      {
        "value": "string",
        "label": "string"
      }
    ]
  }
}
```

---

### 10. Get Content Types

**GET** `/api/v1/recommendations/meta/content-types`

Get list of available content types.

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "content_types": [
      {
        "value": "string",
        "label": "string"
      }
    ]
  }
}
```

---

### 11. Get Recommendation Statistics

**GET** `/api/v1/recommendations/stats`

Get recommendation system statistics (admin endpoint).

#### Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "total_recommendations": "integer",
    "total_trending_topics": "integer",
    "total_interactions": "integer",
    "popular_categories": [
      {
        "category": "string",
        "count": "integer"
      }
    ],
    "most_interacted": [
      {
        "recommendation_id": "uuid",
        "interaction_count": "integer",
        "Recommendation": {
          "title": "string",
          "category": "string",
          "content_type": "string"
        }
      }
    ]
  }
}
```

---

## Health Check

### Health Check

**GET** `/health`

Check server health and database connection.

#### Response

**Status**: `200 OK`

```json
{
  "status": "ok",
  "timestamp": "ISO8601 datetime",
  "uptime": "number (seconds)"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "status": "error",
  "message": "Error description"
}
```

### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Invalid credentials"
}
```

### 404 Not Found

```json
{
  "status": "error",
  "message": "Resource not found",
  "path": "string"
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Internal server error"
}
```

### 503 Service Unavailable

```json
{
  "status": "error",
  "message": "Database connection error"
}
```

---

## Data Types

### UUID
Universally Unique Identifier string format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### ISO8601 DateTime
Date and time in ISO 8601 format: `2025-11-21T17:54:18.508Z`

### ISO8601 Date
Date in ISO 8601 format: `2025-11-21`

---

## Notes

1. **Authentication**: Currently disabled. All endpoints work without authentication tokens.
2. **Pagination**: Use `limit` and `offset` for paginated endpoints, or `page` and `limit` for page-based pagination.
3. **Date Filtering**: All date parameters accept ISO8601 format. Time ranges are inclusive on start and exclusive on end.
4. **File Uploads**: Screenshot uploads are automatically converted to WebP format and optimized.
5. **Rate Limiting**: Not currently implemented.
6. **CORS**: Enabled for all origins (configure in production).

---

## Example Requests

### cURL Examples

#### Register User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "student"
  }'
```

#### Register Parent-Student
```bash
curl -X POST http://localhost:3000/api/v1/auth/register-parent-student \
  -H "Content-Type: application/json" \
  -d '{
    "parent_name": "John Doe",
    "parent_email": "john.doe@example.com",
    "parent_password": "parentpass123",
    "student_name": "Jane Doe",
    "student_email": "jane.doe@example.com",
    "student_password": "studentpass123",
    "student_standard": 10
  }'
```

#### Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

#### Log Activity
```bash
curl -X POST http://localhost:3000/api/v1/monitor/activity \
  -H "Content-Type: application/json" \
  -d '{
    "window_title": "My Application",
    "app_name": "Chrome",
    "start_time": "2025-11-21T10:00:00Z",
    "end_time": "2025-11-21T10:30:00Z",
    "activity_type": "browser"
  }'
```

#### Get Dashboard Summary
```bash
curl http://localhost:3000/api/v1/dashboard/summary
```

#### Get Top Apps
```bash
curl "http://localhost:3000/api/v1/dashboard/top-apps?limit=5"
```

#### Get Personalized Recommendations
```bash
curl -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:3000/api/v1/recommendations?limit=10&category=ai_ml"
```

#### Get Trending Topics
```bash
curl -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:3000/api/v1/recommendations/trending-topics?limit=5"
```

#### Search Recommendations
```bash
curl -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:3000/api/v1/recommendations/search?q=machine%20learning&limit=10"
```

#### Record User Interaction
```bash
curl -X POST http://localhost:3000/api/v1/recommendations/interactions/recommendation-uuid \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "interaction_type": "viewed",
    "rating": 5,
    "time_spent_minutes": 45
  }'
```

#### Get Career Recommendations
```bash
curl -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:3000/api/v1/recommendations/career?limit=15"
```

---

**Last Updated**: 2025-11-21
**API Version**: 1.0

