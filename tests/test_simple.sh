#!/usr/bin/env bash

# Simple test for modules

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAS_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Loading modules..."
source "$MAS_DIR/lib/tmux.sh" || echo "Failed to load tmux.sh"
source "$MAS_DIR/lib/agent.sh" || echo "Failed to load agent.sh"
source "$MAS_DIR/lib/message.sh" || echo "Failed to load message.sh"
source "$MAS_DIR/lib/session.sh" || echo "Failed to load session.sh"

echo "Testing basic functions..."

# Test 1
echo -n "Test sanitize_session_name: "
result=$(sanitize_session_name "test/project@123")
if [ "$result" = "test-project-123" ]; then
    echo "PASS"
else
    echo "FAIL (got: $result)"
fi

# Test 2
echo -n "Test get_agent_window_pane: "
result=$(get_agent_window_pane "11")
if [ "$result" = "design.1" ]; then
    echo "PASS"
else
    echo "FAIL (got: $result)"
fi

# Test 3
echo -n "Test expand_target design: "
result=$(expand_target "design")
if [ "$result" = "10 11 12 13" ]; then
    echo "PASS"
else
    echo "FAIL (got: $result)"
fi

# Test 4
echo -n "Test get_agent_model 00: "
result=$(get_agent_model "00")
if [ "$result" = "opus" ]; then
    echo "PASS"
else
    echo "FAIL (got: $result)"
fi

echo "Tests completed"