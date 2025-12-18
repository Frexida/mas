#!/usr/bin/env bash

# test_modules.sh - Test shell script modules

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAS_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Load modules
source "$MAS_DIR/lib/tmux.sh"
source "$MAS_DIR/lib/agent.sh"
source "$MAS_DIR/lib/message.sh"
source "$MAS_DIR/lib/session.sh"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Color output
print_test_pass() {
    echo -e "\033[1;32m✓\033[0m $1"
    ((TESTS_PASSED++))
}

print_test_fail() {
    echo -e "\033[1;31m✗\033[0m $1"
    ((TESTS_FAILED++))
}

echo "=== Testing MAS Modules ==="
echo ""

# Test tmux.sh functions
echo "Testing tmux.sh module..."

# Test session name sanitization
test_name=$(sanitize_session_name "test/project@123")
if [ "$test_name" = "test-project-123" ]; then
    print_test_pass "sanitize_session_name works correctly"
else
    print_test_fail "sanitize_session_name failed"
fi

# Test agent.sh functions
echo ""
echo "Testing agent.sh module..."

# Test agent window/pane mapping
window_pane=$(get_agent_window_pane "11")
if [ "$window_pane" = "design.1" ]; then
    print_test_pass "get_agent_window_pane works for agent 11"
else
    print_test_fail "get_agent_window_pane failed for agent 11"
fi

# Test model assignment
model=$(get_agent_model "00")
if [ "$model" = "opus" ]; then
    print_test_pass "get_agent_model returns correct model for manager"
else
    print_test_fail "get_agent_model failed for manager"
fi

model=$(get_agent_model "11")
if [ "$model" = "sonnet" ]; then
    print_test_pass "get_agent_model returns correct model for worker"
else
    print_test_fail "get_agent_model failed for worker"
fi

# Test manager detection
if is_manager "00"; then
    print_test_pass "is_manager correctly identifies manager"
else
    print_test_fail "is_manager failed to identify manager"
fi

if ! is_manager "11"; then
    print_test_pass "is_manager correctly identifies non-manager"
else
    print_test_fail "is_manager incorrectly identified worker as manager"
fi

# Test message.sh functions
echo ""
echo "Testing message.sh module..."

# Test target expansion
targets=$(expand_target "design")
if [ "$targets" = "10 11 12 13" ]; then
    print_test_pass "expand_target works for unit name"
else
    print_test_fail "expand_target failed for unit name"
fi

targets=$(expand_target "managers")
if [ "$targets" = "00 10 20 30" ]; then
    print_test_pass "expand_target works for group"
else
    print_test_fail "expand_target failed for group"
fi

targets=$(expand_target "00")
if [ "$targets" = "00" ]; then
    print_test_pass "expand_target works for individual agent"
else
    print_test_fail "expand_target failed for individual agent"
fi

# Test unit manager retrieval
manager=$(get_unit_manager "design")
if [ "$manager" = "10" ]; then
    print_test_pass "get_unit_manager returns correct manager"
else
    print_test_fail "get_unit_manager failed"
fi

# Test session.sh functions
echo ""
echo "Testing session.sh module..."

# Test session name generation
session_name=$(generate_session_name "test-project")
if [[ "$session_name" =~ ^mas-test-project$ ]]; then
    print_test_pass "generate_session_name works correctly"
else
    print_test_fail "generate_session_name failed"
fi

# Summary
echo ""
echo "=== Test Summary ==="
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\033[1;32mAll tests passed!\033[0m"
    exit 0
else
    echo -e "\033[1;31mSome tests failed.\033[0m"
    exit 1
fi