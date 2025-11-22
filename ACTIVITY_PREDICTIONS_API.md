# Activity Predictions API - Documentation

## 🎯 Overview

This API uses **Grok AI** (xAI) to analyze user activity logs and generate predictions about future behavior patterns. It analyzes all user activity data and provides AI-powered insights.

## 📍 Endpoint

```
GET /api/v1/dashboard/activity-predictions
```

**Authentication**: Required (JWT Token)

## 🔐 Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 📥 Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO8601 Date | No | Filter activities from this date |
| `endDate` | ISO8601 Date | No | Filter activities until this date |
| `limit` | Integer | No | Maximum number of activities to analyze (default: 1000) |

## 📤 Response

**Status**: `200 OK`

```json
{
  "status": "success",
  "data": {
    "user_profile": {
      "username": "student_name",
      "student_standard": 11,
      "role": "student"
    },
    "activity_summary": {
      "total_activities": 1250,
      "time_range": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-31T23:59:59.000Z",
        "daysTracked": 31
      },
      "total_time_hours": "145.50",
      "top_apps": [
        {
          "app": "Chrome",
          "usageHours": "45.20",
          "sessions": 320
        },
        {
          "app": "VS Code",
          "usageHours": "38.50",
          "sessions": 180
        }
      ],
      "category_breakdown": {
        "productive_hours": "95.30",
        "neutral_hours": "25.20",
        "distracting_hours": "25.00"
      }
    },
    "ai_analysis": {
      "predictions": {
        "next_week": [
          "User will likely continue using Chrome as primary application",
          "High productivity trend expected to continue"
        ],
        "next_month": [
          "Activity patterns suggest stable behavior",
          "Maintaining high productivity levels"
        ]
      },
      "behavioral_patterns": [
        "Primary application: Chrome",
        "Productive time ratio: 65.5%",
        "Average daily activity: 40 activities"
      ],
      "recommendations": [
        "Maintain current productive habits",
        "Track progress weekly for better insights"
      ],
      "concerns": [],
      "productivity_trend": "increasing",
      "confidence_score": 0.8,
      "analysis_date": "2024-01-31T12:00:00.000Z"
    }
  }
}
```

## 🔧 How It Works

### 1. **Data Collection**
- Fetches all activity logs for the authenticated user
- Filters by date range if provided
- Limits to specified number of activities (default: 1000)

### 2. **Activity Analysis**
The system analyzes:
- **App Usage**: Most used applications and time spent
- **Time Patterns**: Peak activity hours
- **Category Breakdown**: Productive vs Neutral vs Distracting time
- **Behavioral Patterns**: Recurring activity patterns

### 3. **AI Analysis (Grok)**
- Sends activity summary to Grok AI
- Grok analyzes patterns and generates:
  - **Predictions**: What user is likely to do next week/month
  - **Behavioral Patterns**: Observed patterns in activity
  - **Recommendations**: Suggestions for improvement
  - **Concerns**: Potential issues or areas of concern
  - **Productivity Trend**: Increasing, decreasing, or stable

### 4. **Confidence Score**
- Calculated based on:
  - Amount of data (more days = higher confidence)
  - Activity frequency (more activities = higher confidence)
  - Range: 0.1 to 0.9

## 🚀 Setup

### Environment Variables

Add to `.env`:
```env
GROK_API_KEY=your_grok_api_key_here
GROK_API_URL=https://api.x.ai/v1/chat/completions
```

### Fallback Mode

If Grok API is not configured, the system uses **mock predictions** based on:
- App usage patterns
- Productivity ratios
- Activity frequency

## 📊 Example Usage

### cURL Example

```bash
curl -X GET "http://localhost:3000/api/v1/dashboard/activity-predictions?limit=500" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### With Date Range

```bash
curl -X GET "http://localhost:3000/api/v1/dashboard/activity-predictions?startDate=2024-01-01&endDate=2024-01-31&limit=1000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## 🎯 Use Cases

1. **Predictive Analytics**: Understand what students will likely do
2. **Productivity Insights**: Get AI-powered recommendations
3. **Behavioral Analysis**: Identify patterns and trends
4. **Early Intervention**: Detect concerning patterns early
5. **Personalized Recommendations**: Tailored advice based on activity

## ⚠️ Notes

- Requires sufficient activity data for accurate predictions (minimum 7 days recommended)
- Confidence score indicates prediction reliability
- Mock predictions available when Grok API is not configured
- Analysis is based on historical patterns, not guaranteed future behavior
