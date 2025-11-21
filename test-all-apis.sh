#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
CONTENT_TYPE="Content-Type: application/json"

# Function to make API requests and display results
test_endpoint() {
  local method=$1
  local endpoint=$2
  local headers=$3
  local data=$4
  
  echo -e "${BLUE}→ Testing ${method} ${endpoint}${NC}"
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "${BASE_URL}${endpoint}" -H "$headers")
  else
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X $method "${BASE_URL}${endpoint}" -H "$headers" -d "$data")
  fi
  
  http_code=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
  body=$(echo "$response" | sed '/HTTP_STATUS/d')
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓ Status: $http_code${NC}"
  else
    echo -e "${RED}✗ Status: $http_code${NC}"
  fi
  
  echo "$body" | jq . 2>/dev/null || echo "$body"
  echo ""
}

echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}        Student Monitor Backend - API Test Suite${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}\n"

# 1. Health Check & Database Connection
echo -e "${GREEN}1. HEALTH CHECK & DATABASE CONNECTION${NC}"
test_endpoint "GET" "/health" ""

# 2. Auth Endpoints (Since auth is disabled, these should work)
echo -e "${GREEN}2. AUTH ENDPOINTS${NC}"

# Register a test user
echo -e "${BLUE}→ Testing Registration${NC}"
register_response=$(curl -s -X POST "${BASE_URL}/api/v1/auth/register" \
  -H "${CONTENT_TYPE}" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123456","role":"student"}')
echo "$register_response" | jq . 2>/dev/null || echo "$register_response"
echo ""

# Get current user (should work without auth since it's disabled)
test_endpoint "GET" "/api/v1/auth/me" ""

# 3. Monitor Endpoints
echo -e "${GREEN}3. MONITOR ENDPOINTS${NC}"

# Upload screenshot (will need actual file, but testing endpoint)
test_endpoint "GET" "/api/v1/monitor/screenshots" ""

# Log activity
test_endpoint "POST" "/api/v1/monitor/activity" "${CONTENT_TYPE}" '{
  "window_title": "Test Window Title",
  "app_name": "Test App",
  "start_time": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
  "end_time": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ" -d "+5 minutes")'",
  "activity_type": "application",
  "metadata": {"test": true}
}'

# Log keystrokes
test_endpoint "POST" "/api/v1/monitor/keystrokes" "${CONTENT_TYPE}" '{
  "key_log": [
    {
      "key_code": 65,
      "key_char": "A",
      "key_type": "alphanumeric",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
      "window_title": "Test Window",
      "app_name": "testapp",
      "is_shortcut": false,
      "modifiers": []
    },
    {
      "key_code": 66,
      "key_char": "B",
      "key_type": "alphanumeric",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
      "window_title": "Test Window",
      "app_name": "testapp",
      "is_shortcut": false,
      "modifiers": []
    }
  ]
}'

# Log system metrics
test_endpoint "POST" "/api/v1/monitor/metrics" "${CONTENT_TYPE}" '{
  "cpu": {
    "usage": 25.5,
    "temperature": 65.0
  },
  "memory": {
    "usage": 45.2
  },
  "disk": {
    "usage": 30.1,
    "read": 100.5,
    "write": 50.3
  },
  "network": {
    "in": 1024.5,
    "out": 512.3
  }
}'

# Get activities
test_endpoint "GET" "/api/v1/monitor/activities" ""

# Get keystrokes
test_endpoint "GET" "/api/v1/monitor/keystrokes" ""

# Get metrics
test_endpoint "GET" "/api/v1/monitor/metrics" ""

# Get activity summary
test_endpoint "GET" "/api/v1/monitor/activities/summary" ""

# Get metrics summary
test_endpoint "GET" "/api/v1/monitor/metrics/summary" ""

# 4. Dashboard Endpoints
echo -e "${GREEN}4. DASHBOARD ENDPOINTS${NC}"

test_endpoint "GET" "/api/v1/dashboard/summary" ""
test_endpoint "GET" "/api/v1/dashboard/timeline" ""
test_endpoint "GET" "/api/v1/dashboard/top-apps?limit=5" ""
test_endpoint "GET" "/api/v1/dashboard/website-usage?limit=5" ""
test_endpoint "GET" "/api/v1/dashboard/productivity-score" ""
test_endpoint "GET" "/api/v1/dashboard/screenshots?page=1&limit=10" ""
test_endpoint "GET" "/api/v1/dashboard/activity-report" ""

echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}All API tests completed!${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

