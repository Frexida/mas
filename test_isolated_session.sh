#!/usr/bin/env bash

# Test script for isolated session mode
# This script tests the basic functionality of creating and managing isolated sessions

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Define print functions for testing
print_info() { echo "[INFO] $*"; }
print_error() { echo "[ERROR] $*" >&2; }
print_warning() { echo "[WARN] $*"; }
print_success() { echo "[SUCCESS] $*"; }

source "$SCRIPT_DIR/lib/session.sh"
source "$SCRIPT_DIR/lib/tmux.sh"

echo "=== Testing Isolated Session Mode ==="
echo

# Test 1: Generate UUID
echo "Test 1: UUID Generation"
test_uuid=$(generate_uuid)
echo "Generated UUID: $test_uuid"
if [[ "$test_uuid" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$ ]]; then
    echo "✓ UUID format is valid"
else
    echo "✗ UUID format is invalid"
    exit 1
fi
echo

# Test 2: Create session workspace
echo "Test 2: Create Session Workspace"
session_id=$(generate_uuid)
echo "Session ID: $session_id"

# Set MAS_ROOT for testing
export MAS_ROOT="$SCRIPT_DIR"

# Capture both stdout and result
session_dir=$(create_session_workspace "$session_id" 2>&1 | tail -1)

# Verify directory was created
expected_dir="$MAS_ROOT/sessions/$session_id"
if [ -d "$expected_dir" ]; then
    session_dir="$expected_dir"
    echo "✓ Session directory created: $session_dir"

    # Check subdirectories
    if [ -d "$session_dir/unit" ] && [ -d "$session_dir/workflows" ] && [ -d "$session_dir/logs" ]; then
        echo "✓ Subdirectories created"
    else
        echo "✗ Subdirectories not created properly"
        exit 1
    fi
else
    echo "✗ Session directory not created"
    exit 1
fi
echo

# Test 3: Initialize units
echo "Test 3: Initialize Session Units"
initialize_session_units "$session_dir"
if [ -d "$session_dir/unit/00" ]; then
    echo "✓ Units initialized successfully"
    ls -la "$session_dir/unit/" | head -5
else
    echo "✗ Units not initialized"
    exit 1
fi
echo

# Test 4: Create metadata
echo "Test 4: Create Session Metadata"
tmux_session="mas-${session_id:0:8}"
create_session_metadata "$session_id" "$session_dir" "$tmux_session" "active"
if [ -f "$session_dir/.session" ]; then
    echo "✓ Metadata file created"
    echo "Metadata contents:"
    cat "$session_dir/.session"
else
    echo "✗ Metadata file not created"
    exit 1
fi
echo

# Test 5: Load metadata
echo "Test 5: Load Session Metadata"
load_session_metadata "$session_id"
if [ "$SESSION_ID" = "$session_id" ]; then
    echo "✓ Metadata loaded successfully"
    echo "  SESSION_ID: $SESSION_ID"
    echo "  TMUX_SESSION: $TMUX_SESSION"
    echo "  UNIT_DIR: $UNIT_DIR"
else
    echo "✗ Metadata not loaded properly"
    exit 1
fi
echo

# Test 6: Find session by ID
echo "Test 6: Find Session by ID"
found_dir=$(find_session_by_id "$session_id")
if [ "$found_dir" = "$session_dir" ]; then
    echo "✓ Session found by ID"
else
    echo "✗ Session not found by ID"
    exit 1
fi
echo

# Test 7: Update sessions index
echo "Test 7: Update Sessions Index"
if command -v jq &> /dev/null; then
    update_sessions_index "add" "$session_id" "active"
    if [ -f "$SCRIPT_DIR/sessions/.sessions.index" ]; then
        echo "✓ Sessions index updated"
        echo "Index contents:"
        jq . "$SCRIPT_DIR/sessions/.sessions.index"
    else
        echo "✗ Sessions index not created"
    fi
else
    echo "⚠ jq not available, skipping index test"
fi
echo

# Cleanup
echo "Cleaning up test session..."
rm -rf "$session_dir"
if command -v jq &> /dev/null; then
    update_sessions_index "remove" "$session_id"
fi

echo
echo "=== All tests passed! ==="
echo
echo "To test with real tmux session creation, run:"
echo "  MAS_SESSION_MODE=isolated ./mas_refactored.sh start"