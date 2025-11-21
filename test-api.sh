#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting API Tests...${NC}\n"

# Function to make API requests and display results
test_endpoint() {
  local method=$1
  local endpoint=$2
  local headers=$3
  local data=$4
  
  echo -e "${GREEN}Testing ${method} ${endpoint}${NC}"
  
  if [ -z "$data" ]; then
    response=$(curl -s -X $method "http://localhost:3000${endpoint}" -H "$headers")
  else
    response=$(curl -s -X $method "http://localhost:3000${endpoint}" -H "$headers" -d "$data")
  fi
  
  # Pretty print JSON response
  echo $response | jq .
  echo -e "\n"
}

# 1. Login and get token
echo -e "${GREEN}1. Testing Authentication${NC}"
login_response=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

token=$(echo $login_response | jq -r '.data.token')

if [ -z "$token" ] || [ "$token" = "null" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo $login_response | jq .
  exit 1
fi

echo -e "✅ Logged in successfully. Token: ${token:0:20}...\n"

# Set auth header
auth_header="Authorization: Bearer $token"
content_type="Content-Type: application/json"

# 2. Test Auth Endpoints
echo -e "\n${GREEN}2. Testing Auth Endpoints${NC}"

# Get current user
test_endpoint "GET" "/api/v1/auth/me" "$auth_header"

# Update profile
test_endpoint "PUT" "/api/v1/auth/profile" "$auth_header $content_type" '{"username":"admin_updated"}'

# 3. Test Dashboard Endpoints
echo -e "${GREEN}\n3. Testing Dashboard Endpoints${NC}"

# Get dashboard summary
test_endpoint "GET" "/api/v1/dashboard/summary" "$auth_header"

# Get activities
test_endpoint "GET" "/api/v1/dashboard/activities" "$auth_header"

# Get screenshots
test_endpoint "GET" "/api/v1/dashboard/screenshots" "$auth_header"

# Get keystrokes
test_endpoint "GET" "/api/v1/dashboard/keystrokes" "$auth_header"

# Get metrics
test_endpoint "GET" "/api/v1/dashboard/metrics" "$auth_header"

# 4. Test Monitor Endpoints
echo -e "${GREEN}\n4. Testing Monitor Endpoints${NC}"

# Record activity
test_endpoint "POST" "/api/v1/monitor/activity" "$auth_header $content_type" '{"windowTitle":"Test Window","appName":"Test App","activityType":"application"}'

# Record keystroke
test_endpoint "POST" "/api/v1/monitor/keystroke" "$auth_header $content_type" '{"keyCode":65,"key":"A","windowTitle":"Test Window","appName":"Test App"}'

# Record metrics
test_endpoint "POST" "/api/v1/monitor/metrics" "$auth_header $content_type" '{"cpuUsage":25.5,"memoryUsage":45.2,"diskUsage":30.1}'

# 5. Test Health Check
echo -e "${GREEN}\n5. Testing Health Check${NC}"
test_endpoint "GET" "/health" ""

# 6. Logout
echo -e "${GREEN}\n6. Testing Logout${NC}"
test_endpoint "POST" "/api/v1/auth/logout" "$auth_header"

echo -e "${GREEN}\nAll tests completed!${NC}"
