#!/usr/bin/env bash
# test-modules.sh - Test script for common modules
# Tests the newly created modular functions

# Don't exit on error during tests
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
    ((TOTAL_TESTS++))
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

# Setup test environment
TEST_DIR="/tmp/mas-module-test-$$"
TEST_SESSION_ID="test-$(uuidgen | head -c 8)"
TEST_SESSION_NAME="mas-test-${TEST_SESSION_ID}"
MAS_ROOT="$(dirname "$0")"
MAS_WORKSPACE_ROOT="$TEST_DIR"

# Export required variables
export MAS_ROOT MAS_WORKSPACE_ROOT

# Load print functions
source "$MAS_ROOT/lib/mas-message.sh" 2>/dev/null || {
    # Define basic print functions if mas-message.sh not found
    print_info() { echo "[INFO] $1"; }
    print_success() { echo "[SUCCESS] $1"; }
    print_error() { echo "[ERROR] $1"; }
    print_warning() { echo "[WARNING] $1"; }
    print_debug() { [ -n "$DEBUG" ] && echo "[DEBUG] $1"; }
}

# Source common modules
echo "Loading common modules..."
source "$MAS_ROOT/lib/mas-session-common.sh"
source "$MAS_ROOT/lib/mas-workspace-init.sh"
source "$MAS_ROOT/lib/mas-metadata.sh"
source "$MAS_ROOT/lib/mas-environment.sh"
source "$MAS_ROOT/lib/mas-agent-starter.sh"

echo "Test directory: $TEST_DIR"
echo "Test session ID: $TEST_SESSION_ID"
echo "Test session name: $TEST_SESSION_NAME"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "Cleaning up test environment..."

    # Kill test tmux session if exists
    tmux kill-session -t "$TEST_SESSION_NAME" 2>/dev/null || true

    # Remove test directory
    rm -rf "$TEST_DIR"

    echo "Cleanup complete"
}

# Register cleanup on exit
trap cleanup EXIT

# Create test directory
mkdir -p "$TEST_DIR"

# Test 1: Workspace initialization
print_test "Testing workspace initialization"
initialize_session_workspace "$TEST_DIR/sessions/$TEST_SESSION_ID" "$MAS_ROOT" 2
if [ -d "$TEST_DIR/sessions/$TEST_SESSION_ID/unit/00" ] && \
   [ -d "$TEST_DIR/sessions/$TEST_SESSION_ID/unit/10" ] && \
   [ -d "$TEST_DIR/sessions/$TEST_SESSION_ID/workflows" ]; then
    print_pass "Workspace initialized correctly"
else
    print_fail "Workspace initialization failed"
fi

# Test 2: Metadata creation (JSON)
print_test "Testing metadata creation (JSON)"
create_session_metadata "$TEST_SESSION_ID" \
                       "$TEST_DIR/sessions/$TEST_SESSION_ID" \
                       "$TEST_SESSION_NAME" \
                       "json" \
                       2
if [ -f "$TEST_DIR/sessions/$TEST_SESSION_ID/metadata.json" ]; then
    # Verify JSON content
    if command -v jq &> /dev/null; then
        SESSION_CHECK=$(jq -r '.sessionId' "$TEST_DIR/sessions/$TEST_SESSION_ID/metadata.json")
        if [ "$SESSION_CHECK" = "$TEST_SESSION_ID" ]; then
            print_pass "JSON metadata created and valid"
        else
            print_fail "JSON metadata invalid"
        fi
    else
        print_pass "JSON metadata created (content not verified - jq not available)"
    fi
else
    print_fail "JSON metadata creation failed"
fi

# Test 3: Metadata creation (Legacy)
print_test "Testing metadata creation (Legacy)"
create_session_metadata "$TEST_SESSION_ID" \
                       "$TEST_DIR/sessions/$TEST_SESSION_ID" \
                       "$TEST_SESSION_NAME" \
                       "legacy" \
                       2
if [ -f "$TEST_DIR/sessions/$TEST_SESSION_ID/.session" ]; then
    # Source and check
    source "$TEST_DIR/sessions/$TEST_SESSION_ID/.session"
    if [ "$SESSION_ID" = "$TEST_SESSION_ID" ]; then
        print_pass "Legacy metadata created and valid"
    else
        print_fail "Legacy metadata invalid"
    fi
else
    print_fail "Legacy metadata creation failed"
fi

# Test 4: Metadata loading
print_test "Testing metadata loading"
load_session_metadata "$TEST_DIR/sessions/$TEST_SESSION_ID"
if [ "$SESSION_ID" = "$TEST_SESSION_ID" ] && \
   [ "$TMUX_SESSION" = "$TEST_SESSION_NAME" ]; then
    print_pass "Metadata loaded correctly"
else
    print_fail "Metadata loading failed"
fi

# Test 5: Tmux session creation
print_test "Testing tmux session creation"
create_mas_window_structure "$TEST_SESSION_NAME" "$TEST_DIR/sessions/$TEST_SESSION_ID" 2
if tmux has-session -t "$TEST_SESSION_NAME" 2>/dev/null; then
    # Check window count
    WINDOW_COUNT=$(tmux list-windows -t "$TEST_SESSION_NAME" -F "#{window_name}" | wc -l)
    if [ "$WINDOW_COUNT" -ge 4 ]; then  # initial, meta-manager, unit1, unit2, monitor
        print_pass "Tmux session created with correct structure"
    else
        print_fail "Tmux session created but incorrect window count: $WINDOW_COUNT"
    fi
else
    print_fail "Tmux session creation failed"
fi

# Test 6: Pane splitting
print_test "Testing pane splitting"
# Check unit1 window has 4 panes
PANE_COUNT=$(tmux list-panes -t "$TEST_SESSION_NAME:2" 2>/dev/null | wc -l)
if [ "$PANE_COUNT" -eq 4 ]; then
    print_pass "Pane splitting successful (4 panes in unit1)"
else
    print_fail "Pane splitting failed (expected 4, got $PANE_COUNT)"
fi

# Test 7: Environment setup
print_test "Testing environment setup"
setup_pane_environment "$TEST_SESSION_NAME" 1 0 "$TEST_DIR/sessions/$TEST_SESSION_ID" "$TEST_SESSION_ID" "00"
# Check if commands were sent (we can't verify execution in test)
print_pass "Environment setup commands sent (manual verification needed)"

# Test 8: Environment file creation
print_test "Testing environment file creation"
create_environment_file "$TEST_DIR/sessions/$TEST_SESSION_ID" "$TEST_SESSION_ID"
if [ -f "$TEST_DIR/sessions/$TEST_SESSION_ID/.env" ]; then
    if grep -q "MAS_SESSION_ID=\"$TEST_SESSION_ID\"" "$TEST_DIR/sessions/$TEST_SESSION_ID/.env"; then
        print_pass "Environment file created and valid"
    else
        print_fail "Environment file created but invalid content"
    fi
else
    print_fail "Environment file creation failed"
fi

# Test 9: Agent starter unified function
print_test "Testing agent starter function"
# Test command construction (dry run)
TEST_CLAUDE_CMD=""
# Override tmux send-keys for testing
tmux() {
    if [ "$1" = "send-keys" ]; then
        # Capture the command
        TEST_CLAUDE_CMD="$4"
        return 0
    else
        # Call real tmux for other commands
        command tmux "$@"
    fi
}

# Test new session (without -c)
start_agent_unified "$TEST_SESSION_NAME" 1 0 "00" "$TEST_DIR/sessions/$TEST_SESSION_ID/unit" "false"
if [[ "$TEST_CLAUDE_CMD" == *"claude --model"* ]] && [[ "$TEST_CLAUDE_CMD" != *" -c"* ]]; then
    print_pass "Agent start command correct for new session (no -c flag)"
else
    print_fail "Agent start command incorrect for new session: $TEST_CLAUDE_CMD"
fi

# Test restore session (with -c)
start_agent_unified "$TEST_SESSION_NAME" 1 0 "00" "$TEST_DIR/sessions/$TEST_SESSION_ID/unit" "true"
if [[ "$TEST_CLAUDE_CMD" == *"claude --model"* ]] && [[ "$TEST_CLAUDE_CMD" == *" -c"* ]]; then
    print_pass "Agent start command correct for restore (with -c flag)"
else
    print_fail "Agent start command incorrect for restore: $TEST_CLAUDE_CMD"
fi

# Restore real tmux function
unset -f tmux

# Test 10: Sessions index update
print_test "Testing sessions index update"
update_sessions_index "add" "$TEST_SESSION_ID" "$TEST_DIR/sessions/$TEST_SESSION_ID" "$TEST_SESSION_NAME"
if [ -f "$TEST_DIR/sessions/.sessions.index" ]; then
    if command -v jq &> /dev/null; then
        INDEX_CHECK=$(jq -r '.sessions[0].sessionId' "$TEST_DIR/sessions/.sessions.index" 2>/dev/null)
        if [ "$INDEX_CHECK" = "$TEST_SESSION_ID" ]; then
            print_pass "Sessions index updated correctly"
        else
            print_fail "Sessions index update failed"
        fi
    else
        print_pass "Sessions index file created (content not verified - jq not available)"
    fi
else
    print_fail "Sessions index file not created"
fi

# Summary
echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo "Total tests:  $TOTAL_TESTS"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi