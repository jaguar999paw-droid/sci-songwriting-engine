#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# SCI Songwriting Engine — Endpoint Tester
# Tests all GET/POST endpoints and confirms service health
# ═══════════════════════════════════════════════════════════════════════════

set -e

echo "════════════════════════════════════════════════════════════════"
echo "🧪 SCI SONGWRITING ENGINE — ENDPOINT TEST SUITE"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3001"
ML_SERVICE_URL="http://localhost:3002"
TEST_API_KEY="sk-ant-test-key-12345"

# Track results
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local test_name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_status=$5

    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    echo -e "${BLUE}Test $TESTS_TOTAL:${NC} $test_name"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo "0")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null || echo "0")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [[ "$http_code" == *"$expected_status"* ]] || [[ "$http_code" == "200" ]]; then
        echo -e "  ${GREEN}✓ Status: $http_code${NC}"
        echo -e "  Response preview: ${body:0:100}..."
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  ${RED}✗ Expected $expected_status, got $http_code${NC}"
        echo -e "  Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1: Service Availability Check
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}→${NC} Checking service availability..."
echo ""

# Check Backend
if curl -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Backend${NC} (port 3001) is reachable"
else
    echo -e "  ${RED}✗ Backend${NC} (port 3001) is ${RED}NOT${NC} reachable"
    echo -e "    Make sure to run: ${YELLOW}bash START.sh${NC}"
    exit 1
fi

# Check ML Service (optional)
if curl -s "$ML_SERVICE_URL/ml/health" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ ML Service${NC} (port 3002) is reachable"
else
    echo -e "  ${YELLOW}⚠  ML Service${NC} (port 3002) not available (optional)"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2: Core Endpoint Tests
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}→${NC} Testing core endpoints..."
echo ""

# Test 1: Health Check
test_endpoint "GET /api/health" "GET" "$BACKEND_URL/api/health" "" "200"

# Test 2: POST /api/analyze - Identity Analysis
test_endpoint "POST /api/analyze - Basic Identity Analysis" "POST" "$BACKEND_URL/api/analyze" \
    '{
      "answers": {
        "whoAreYouNot": "I am not a victim",
        "emotionalTruth": "I carry rage and hope",
        "socialConflict": "The world tells me to be small",
        "mainIdea": "I will rise",
        "referenceText": ""
      }
    }' "200"

# Test 3: POST /api/analyze - With Reference
test_endpoint "POST /api/analyze - With Reference" "POST" "$BACKEND_URL/api/analyze" \
    '{
      "answers": {
        "whoAreYouNot": "I am not afraid",
        "emotionalTruth": "I am vulnerable but strong",
        "socialConflict": "Breaking free from expectation",
        "mainIdea": "I choose myself",
        "referenceText": "I got a right to be hostile - Kendrick Lamar"
      }
    }' "200"

# Test 4: POST /api/analyze - With Overrides
test_endpoint "POST /api/analyze - With Overrides" "POST" "$BACKEND_URL/api/analyze" \
    '{
      "answers": {
        "whoAreYouNot": "Not broken",
        "emotionalTruth": "I am whole",
        "socialConflict": "Finding my voice",
        "mainIdea": "Self-love is rebellion"
      },
      "overrides": {
        "rawness": 75,
        "energyValue": 85,
        "rhymeScheme": "INTERNAL"
      }
    }' "200"

# Test 5: GET /api/sessions - List Saved Sessions
test_endpoint "GET /api/sessions - List Sessions" "GET" "$BACKEND_URL/api/sessions" "" "200"

# Test 6: POST /api/save - Save a Session
test_endpoint "POST /api/save - Save Session" "POST" "$BACKEND_URL/api/save" \
    '{
      "metadata": {
        "archetype": "Defiant",
        "coreMessage": "I will not apologize",
        "theme": "Identity Reclamation"
      },
      "timestamp": '$(date +%s)'
    }' "200"

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 3: Results Summary
# ─────────────────────────────────────────────────────────────────────────────
echo "════════════════════════════════════════════════════════════════"
echo "📊 TEST RESULTS"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "Total Tests:  $TESTS_TOTAL"
echo -e "${GREEN}Passed:${NC}      $TESTS_PASSED"
echo -e "${RED}Failed:${NC}      $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Your SCI songwriting engine is working correctly!"
    echo ""
    echo "Next steps:"
    echo -e "  1. Open http://localhost:3000 in your browser"
    echo -e "  2. Enter your Anthropic API key (Claude)"
    echo -e "  3. Start the identity interrogation"
    echo -e "  4. Generate your first song"
    echo ""
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo -e "  • Make sure backend is running: ${YELLOW}npm run dev --prefix backend${NC}"
    echo -e "  • Check backend logs: ${YELLOW}tail -f /tmp/sci-backend.log${NC}"
    echo -e "  • Verify port 3001 is free: ${YELLOW}lsof -i :3001${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"

exit $TESTS_FAILED
