#!/usr/bin/env bash

# Simple test for modules

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAS_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Loading modules..."
source "$MAS_DIR/lib/mas-tmux.sh" || echo "Failed to load mas-tmux.sh"
source "$MAS_DIR/lib/mas-agent.sh" || echo "Failed to load mas-agent.sh"
source "$MAS_DIR/lib/mas-message.sh" || echo "Failed to load mas-message.sh"
source "$MAS_DIR/lib/mas-session.sh" || echo "Failed to load mas-session.sh"

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