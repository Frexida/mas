#!/bin/bash
# Worker API Test Script
# Tests worker creation, status, and messaging functionality

set -e  # Exit on error

API_BASE="http://localhost:8765"
SESSION_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test() {
    echo -e "\n${YELLOW}=== TEST: $1 ===${NC}"
}

# Check if API server is running
log_test "Checking API Server Status"
if curl -s "${API_BASE}/status" > /dev/null 2>&1; then
    log_info "API server is running"
else
    log_error "API server is not responding. Start it with: cd api && npm run dev"
    exit 1
fi

# Test 1: Create a session with workers
log_test "Creating Session with Workers"
CREATE_RESPONSE=$(curl -s -X POST "${API_BASE}/runs" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionMode": "isolated",
    "agents": {
      "metaManager": {
        "id": "00",
        "prompt": "You are the meta coordinator for this test session"
      },
      "units": [
        {
          "unitId": 1,
          "manager": {
            "id": "10",
            "prompt": "You are the design manager"
          },
          "workers": [
            {"id": "11", "prompt": "You are a UI designer worker"},
            {"id": "12", "prompt": "You are a UX designer worker"}
          ]
        },
        {
          "unitId": 2,
          "manager": {
            "id": "20",
            "prompt": "You are the development manager"
          },
          "workers": [
            {"id": "21", "prompt": "You are a frontend developer worker"},
            {"id": "22", "prompt": "You are a backend developer worker"}
          ]
        }
      ]
    }
  }')

echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"

SESSION_ID=$(echo "$CREATE_RESPONSE" | jq -r '.sessionId' 2>/dev/null)

if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "null" ]; then
    log_error "Failed to create session"
    exit 1
fi

log_info "Session created: ${SESSION_ID}"

# Wait for workers to initialize
log_info "Waiting 5 seconds for workers to initialize..."
sleep 5

# Test 2: List all sessions
log_test "Listing All Sessions"
SESSIONS_RESPONSE=$(curl -s "${API_BASE}/sessions")
echo "$SESSIONS_RESPONSE" | jq '.' 2>/dev/null || echo "$SESSIONS_RESPONSE"

# Test 3: Get session details
log_test "Getting Session Details"
SESSION_DETAIL=$(curl -s "${API_BASE}/sessions/${SESSION_ID}")
echo "$SESSION_DETAIL" | jq '.' 2>/dev/null || echo "$SESSION_DETAIL"

# Test 4: Get worker status
log_test "Getting Worker/Agent Status"
AGENT_STATUS=$(curl -s "${API_BASE}/sessions/${SESSION_ID}/agents")
echo "$AGENT_STATUS" | jq '.' 2>/dev/null || echo "$AGENT_STATUS"

# Extract worker count
WORKER_COUNT=$(echo "$AGENT_STATUS" | jq '.agents | length' 2>/dev/null)
log_info "Found ${WORKER_COUNT} workers/agents"

# Test 5: Send message to UI designer worker (agent 11)
log_test "Sending Message to UI Designer Worker (11)"
MESSAGE_RESPONSE=$(curl -s -X POST "${API_BASE}/message" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "11",
    "message": "Design a simple button component",
    "execute": false
  }')
echo "$MESSAGE_RESPONSE" | jq '.' 2>/dev/null || echo "$MESSAGE_RESPONSE"

# Test 6: Send message to backend developer worker (agent 22)
log_test "Sending Message to Backend Developer Worker (22)"
MESSAGE_RESPONSE2=$(curl -s -X POST "${API_BASE}/message" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "22",
    "message": "Create a REST API endpoint",
    "execute": false
  }')
echo "$MESSAGE_RESPONSE2" | jq '.' 2>/dev/null || echo "$MESSAGE_RESPONSE2"

# Test 7: Get connection info
log_test "Getting Session Connection Info"
CONNECT_RESPONSE=$(curl -s -X POST "${API_BASE}/sessions/${SESSION_ID}/connect")
echo "$CONNECT_RESPONSE" | jq '.' 2>/dev/null || echo "$CONNECT_RESPONSE"

# Test 8: Verify isolated session workspace
log_test "Verifying Isolated Session Workspace"
SESSION_DIR="../sessions/${SESSION_ID}"
if [ -d "$SESSION_DIR" ]; then
    log_info "Session directory exists: ${SESSION_DIR}"
    ls -la "$SESSION_DIR"

    if [ -d "${SESSION_DIR}/unit" ]; then
        log_info "Unit directory exists"
    else
        log_warn "Unit directory not found"
    fi

    if [ -d "${SESSION_DIR}/workflows" ]; then
        log_info "Workflows directory exists"
    else
        log_warn "Workflows directory not found"
    fi

    if [ -f "${SESSION_DIR}/.session" ]; then
        log_info "Session metadata file exists"
        cat "${SESSION_DIR}/.session"
    else
        log_warn "Session metadata file not found"
    fi
else
    log_error "Session directory not found: ${SESSION_DIR}"
fi

# Test 9: Check tmux session
log_test "Checking Tmux Session"
TMUX_SESSION=$(echo "$CREATE_RESPONSE" | jq -r '.tmuxSession' 2>/dev/null)
if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
    log_info "Tmux session exists: ${TMUX_SESSION}"
    tmux list-windows -t "$TMUX_SESSION"

    log_info "Tmux panes in each window:"
    for window in meta design development; do
        echo "  Window: $window"
        tmux list-panes -t "${TMUX_SESSION}:${window}" 2>/dev/null || echo "    No panes found"
    done
else
    log_warn "Tmux session not found: ${TMUX_SESSION}"
fi

# Test 10: Test error handling - invalid agent ID
log_test "Testing Error Handling (Invalid Agent ID)"
ERROR_RESPONSE=$(curl -s -X POST "${API_BASE}/message" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "99",
    "message": "This should fail",
    "execute": false
  }')
echo "$ERROR_RESPONSE" | jq '.' 2>/dev/null || echo "$ERROR_RESPONSE"

# Summary
log_test "Test Summary"
log_info "Session ID: ${SESSION_ID}"
log_info "Total Workers/Agents: ${WORKER_COUNT}"
log_info "Tmux Session: ${TMUX_SESSION}"
log_info "Workspace: ${SESSION_DIR}"

echo ""
log_info "To interact with the session manually:"
echo "  - Connect: tmux attach -t ${TMUX_SESSION}"
echo "  - Send messages: curl -X POST ${API_BASE}/message -H 'Content-Type: application/json' -d '{\"target\":\"11\",\"message\":\"Your message\"}'"
echo "  - Check status: curl ${API_BASE}/sessions/${SESSION_ID}/agents"
echo "  - Stop session: curl -X POST ${API_BASE}/sessions/${SESSION_ID}/stop"

echo ""
log_warn "Note: Session is still running. To stop it:"
echo "  curl -X POST ${API_BASE}/sessions/${SESSION_ID}/stop"
echo ""
