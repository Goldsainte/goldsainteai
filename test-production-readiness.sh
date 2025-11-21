#!/bin/bash

# Production Readiness Test Suite
# Run this before deploying to production

echo "🧪 Testing Production Readiness..."
echo ""

PROJECT_URL="https://iwdevxltjuedijrcdejs.supabase.co"
TOKEN="YOUR_TEST_USER_TOKEN"  # Get from Supabase dashboard or login

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# ============================================
# 1. TEST RATE LIMITING
# ============================================
echo "📊 Test 1: Rate Limiting"
echo "Sending 25 requests to booking-actions..."

for i in {1..25}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "$PROJECT_URL/functions/v1/booking-actions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"action":"test"}')
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  
  if [ "$i" -gt 20 ] && [ "$HTTP_CODE" = "429" ]; then
    echo -e "${GREEN}✓${NC} Rate limit working (got 429 after 20 requests)"
    PASSED=$((PASSED + 1))
    break
  fi
done

# ============================================
# 2. TEST INPUT VALIDATION
# ============================================
echo ""
echo "📊 Test 2: Input Validation"

RESPONSE=$(curl -s -X POST \
  "$PROJECT_URL/functions/v1/booking-actions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"request_cancellation","userId":"test","data":{"bookingId":"invalid-uuid","role":"hacker"}}')

if echo "$RESPONSE" | grep -q "Invalid"; then
  echo -e "${GREEN}✓${NC} Input validation working"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗${NC} Input validation failed"
  FAILED=$((FAILED + 1))
fi

# ============================================
# 3. TEST ERROR SANITIZATION
# ============================================
echo ""
echo "📊 Test 3: Error Sanitization"

RESPONSE=$(curl -s -X POST \
  "$PROJECT_URL/functions/v1/booking-actions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"request_cancellation","userId":"test","data":null}')

if echo "$RESPONSE" | grep -q -v "stack\|Stack\|at Object\|at async"; then
  echo -e "${GREEN}✓${NC} Error details sanitized"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗${NC} Error details exposed"
  FAILED=$((FAILED + 1))
fi

# ============================================
# 4. TEST CRON JOBS
# ============================================
echo ""
echo "📊 Test 4: Cron Jobs"
echo "Check Supabase dashboard for cron jobs..."
echo "Run: SELECT * FROM cron.job;"

# ============================================
# 5. TEST ENVIRONMENT VARIABLES
# ============================================
echo ""
echo "📊 Test 5: Environment Variables"

if [ -f ".env" ]; then
  if grep -q "YOUR_GOOGLE_PLACES_API_KEY_HERE" .env; then
    echo -e "${RED}✗${NC} Google Places API key still placeholder"
    FAILED=$((FAILED + 1))
  else
    echo -e "${GREEN}✓${NC} Google Places API key configured"
    PASSED=$((PASSED + 1))
  fi
  
  if grep -q "VITE_SENTRY_DSN" .env; then
    echo -e "${GREEN}✓${NC} Sentry DSN configured"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗${NC} Sentry DSN missing"
    FAILED=$((FAILED + 1))
  fi
else
  echo -e "${RED}✗${NC} .env file not found"
  FAILED=$((FAILED + 1))
fi

# ============================================
# RESULTS
# ============================================
echo ""
echo "============================================"
echo "📊 Test Results"
echo "============================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed! Ready for production.${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Fix issues before deploying.${NC}"
  exit 1
fi
