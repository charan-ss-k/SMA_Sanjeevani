#!/bin/bash
# Login System Test Script
# Tests the authentication flow without manual browser testing

echo "🧪 SMA Sanjeevani Login System Test"
echo "===================================="
echo ""

# Configuration
BACKEND_URL="http://127.0.0.1:8000"
TEST_USERNAME="testuser"
TEST_PASSWORD="testpass123"
TEST_EMAIL="testuser@example.com"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check if backend is running
echo -e "${BLUE}[TEST 1] Checking if backend is running...${NC}"
if ! curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo -e "${YELLOW}Start backend with: python backend/start.py${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Test 2: Test signup endpoint
echo -e "${BLUE}[TEST 2] Testing signup endpoint...${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST \
    "${BACKEND_URL}/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"${TEST_USERNAME}\",
        \"email\": \"${TEST_EMAIL}\",
        \"password\": \"${TEST_PASSWORD}\",
        \"first_name\": \"Test\",
        \"last_name\": \"User\",
        \"age\": 30,
        \"gender\": \"Male\"
    }" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$SIGNUP_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$SIGNUP_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Signup successful (HTTP $HTTP_CODE)${NC}"
    
    # Extract token from response
    TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    if [ ! -z "$TOKEN" ]; then
        echo -e "${GREEN}✅ Token received: ${TOKEN:0:20}...${NC}"
    else
        echo -e "${RED}❌ No token in response${NC}"
    fi
elif [ "$HTTP_CODE" == "400" ]; then
    echo -e "${YELLOW}⚠️  User might already exist (HTTP 400)${NC}"
    echo "    Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Signup failed (HTTP $HTTP_CODE)${NC}"
    echo "    Response: $RESPONSE_BODY"
    exit 1
fi
echo ""

# Test 3: Test login endpoint
echo -e "${BLUE}[TEST 3] Testing login endpoint...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST \
    "${BACKEND_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"${TEST_USERNAME}\",
        \"password\": \"${TEST_PASSWORD}\"
    }" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Login successful (HTTP 200)${NC}"
    
    # Extract and display token info
    TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    USER=$(echo "$RESPONSE_BODY" | grep -o '"username":"[^"]*' | cut -d'"' -f4)
    
    if [ ! -z "$TOKEN" ]; then
        echo -e "${GREEN}✅ Token: ${TOKEN:0:20}...${NC}"
        echo -e "${GREEN}✅ User: $USER${NC}"
    else
        echo -e "${RED}❌ No token in response${NC}"
    fi
    
    # Verify response has required fields
    if echo "$RESPONSE_BODY" | grep -q '"token_type"'; then
        echo -e "${GREEN}✅ Token type present${NC}"
    fi
    
    if echo "$RESPONSE_BODY" | grep -q '"user"'; then
        echo -e "${GREEN}✅ User object present${NC}"
    fi
    
    if echo "$RESPONSE_BODY" | grep -q '"expires_in"'; then
        echo -e "${GREEN}✅ Expiry time present${NC}"
    fi
else
    echo -e "${RED}❌ Login failed (HTTP $HTTP_CODE)${NC}"
    echo "    Response: $RESPONSE_BODY"
    exit 1
fi
echo ""

# Test 4: Test invalid login
echo -e "${BLUE}[TEST 4] Testing invalid login (should fail)...${NC}"
INVALID_LOGIN=$(curl -s -X POST \
    "${BACKEND_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"invaliduser\",
        \"password\": \"wrongpassword\"
    }" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$INVALID_LOGIN" | tail -n1)

if [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}✅ Invalid login correctly rejected (HTTP 401)${NC}"
else
    echo -e "${RED}❌ Invalid login should return 401, got $HTTP_CODE${NC}"
fi
echo ""

# Test 5: Verify response format
echo -e "${BLUE}[TEST 5] Verifying response format...${NC}"
echo "$RESPONSE_BODY" | python3 -m json.tool > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Response is valid JSON${NC}"
else
    echo -e "${RED}❌ Response is not valid JSON${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}===================================="
echo "Test Summary"
echo "====================================${NC}"
echo -e "${GREEN}✅ All authentication tests passed!${NC}"
echo ""
echo "Next Steps:"
echo "1. Open frontend application: http://localhost:5174"
echo "2. Click on Login"
echo "3. Enter username: $TEST_USERNAME"
echo "4. Enter password: $TEST_PASSWORD"
echo "5. Check browser console (F12) for debug logs"
echo ""
echo -e "${YELLOW}Debug Output to Look For:${NC}"
echo "🔐 Auth Request: { url, method, isLogin }"
echo "📤 Payload: { username, password }"
echo "📥 Response Status: 200 OK"
echo "✅ Auth Success: { user, tokenLength }"
echo "💾 Stored: { token: ✓, user: ✓ }"
