#!/usr/bin/env bash
# Test script for refactored session management scripts

set +e  # Don't exit on error

# Setup test environment
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAS_ROOT="$(dirname "$SCRIPT_DIR")"
export MAS_ROOT
export MAS_WORKSPACE_ROOT="$MAS_ROOT"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_test() {
    echo -e "\n${YELLOW}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Clean up function
cleanup_test_session() {
    local session_name="$1"
    if tmux has-session -t "$session_name" 2>/dev/null; then
        tmux kill-session -t "$session_name" 2>/dev/null
    fi
}

# Test 1: Create minimal session (1 unit, 1 agent per unit)
test_minimal_session() {
    print_test "Creating minimal session (1 unit, 1 agent)"

    local test_id="test-minimal-$(date +%s)"
    local result

    # Create session with 1 unit and 1 agent
    result=$("$MAS_ROOT/scripts/start_session_refactored.sh" \
             "/dev/null" "$test_id" 1 1 2>&1)

    if echo "$result" | grep -q "Session: mas-${test_id:0:8}"; then
        local session_name="mas-${test_id:0:8}"

        # Verify tmux structure
        local window_count=$(tmux list-windows -t "$session_name" 2>/dev/null | wc -l)

        # Should have: initial(0), meta-manager(1), unit1(2), monitor(3) = 4 windows
        if [ "$window_count" -eq 4 ]; then
            print_pass "Minimal session created with correct structure"
            ((TESTS_PASSED++))
        else
            print_fail "Window count mismatch: expected 4, got $window_count"
            ((TESTS_FAILED++))
        fi

        cleanup_test_session "$session_name"
    else
        print_fail "Failed to create minimal session"
        ((TESTS_FAILED++))
    fi
}

# Test 2: Create medium session (2 units, 2 agents per unit)
test_medium_session() {
    print_test "Creating medium session (2 units, 2 agents)"

    local test_id="test-medium-$(date +%s)"
    local result

    result=$("$MAS_ROOT/scripts/start_session_refactored.sh" \
             "/dev/null" "$test_id" 2 2 2>&1)

    if echo "$result" | grep -q "Session: mas-${test_id:0:8}"; then
        local session_name="mas-${test_id:0:8}"

        # Verify tmux structure
        local window_count=$(tmux list-windows -t "$session_name" 2>/dev/null | wc -l)

        # Should have: initial(0), meta-manager(1), unit1(2), unit2(3), monitor(4) = 5 windows
        if [ "$window_count" -eq 5 ]; then
            # Check pane count in unit1
            local pane_count=$(tmux list-panes -t "$session_name:2" 2>/dev/null | wc -l)
            if [ "$pane_count" -eq 2 ]; then
                print_pass "Medium session created with correct structure"
                ((TESTS_PASSED++))
            else
                print_fail "Unit1 pane count mismatch: expected 2, got $pane_count"
                ((TESTS_FAILED++))
            fi
        else
            print_fail "Window count mismatch: expected 5, got $window_count"
            ((TESTS_FAILED++))
        fi

        cleanup_test_session "$session_name"
    else
        print_fail "Failed to create medium session"
        ((TESTS_FAILED++))
    fi
}

# Test 3: Create full session (3 units, 4 agents per unit)
test_full_session() {
    print_test "Creating full session (3 units, 4 agents)"

    local test_id="test-full-$(date +%s)"
    local result

    result=$("$MAS_ROOT/scripts/start_session_refactored.sh" \
             "/dev/null" "$test_id" 3 4 2>&1)

    if echo "$result" | grep -q "Session: mas-${test_id:0:8}"; then
        local session_name="mas-${test_id:0:8}"

        # Verify tmux structure
        local window_count=$(tmux list-windows -t "$session_name" 2>/dev/null | wc -l)

        # Should have: initial(0), meta-manager(1), unit1(2), unit2(3), unit3(4), monitor(5) = 6 windows
        if [ "$window_count" -eq 6 ]; then
            # Check pane count in unit1
            local pane_count=$(tmux list-panes -t "$session_name:2" 2>/dev/null | wc -l)
            if [ "$pane_count" -eq 4 ]; then
                print_pass "Full session created with correct structure"
                ((TESTS_PASSED++))
            else
                print_fail "Unit1 pane count mismatch: expected 4, got $pane_count"
                ((TESTS_FAILED++))
            fi
        else
            print_fail "Window count mismatch: expected 6, got $window_count"
            ((TESTS_FAILED++))
        fi

        cleanup_test_session "$session_name"
    else
        print_fail "Failed to create full session"
        ((TESTS_FAILED++))
    fi
}

# Test 4: Session restore
test_session_restore() {
    print_test "Testing session restore"

    # First create a session
    local test_id="test-restore-$(date +%s)"
    local result

    result=$("$MAS_ROOT/scripts/start_session_refactored.sh" \
             "/dev/null" "$test_id" 2 3 2>&1)

    if echo "$result" | grep -q "Session: mas-${test_id:0:8}"; then
        local session_name="mas-${test_id:0:8}"

        # Kill the session
        cleanup_test_session "$session_name"

        # Load restore library and restore
        source "$MAS_ROOT/lib/session-restore_refactored.sh"

        # Restore without auto-start
        if restore_session "$test_id" "false" 2>&1 | grep -q "Session restored"; then
            # Verify tmux structure
            local window_count=$(tmux list-windows -t "$session_name" 2>/dev/null | wc -l)

            if [ "$window_count" -gt 0 ]; then
                print_pass "Session restored successfully"
                ((TESTS_PASSED++))
            else
                print_fail "Restored session has no windows"
                ((TESTS_FAILED++))
            fi

            cleanup_test_session "$session_name"
        else
            print_fail "Failed to restore session"
            ((TESTS_FAILED++))
        fi
    else
        print_fail "Failed to create test session for restore"
        ((TESTS_FAILED++))
    fi
}

# Test 5: Validate configuration boundaries
test_configuration_boundaries() {
    print_test "Testing configuration boundaries"

    local test_id="test-boundary"
    local failed=false

    # Test invalid unit count (too low)
    if "$MAS_ROOT/scripts/start_session_refactored.sh" "/dev/null" "${test_id}-1" 0 2 2>&1 | \
       grep -q "unit-count must be between 1 and 3"; then
        print_pass "Correctly rejected unit count 0"
        ((TESTS_PASSED++))
    else
        print_fail "Did not reject unit count 0"
        ((TESTS_FAILED++))
        failed=true
    fi

    # Test invalid unit count (too high)
    if "$MAS_ROOT/scripts/start_session_refactored.sh" "/dev/null" "${test_id}-2" 4 2 2>&1 | \
       grep -q "unit-count must be between 1 and 3"; then
        print_pass "Correctly rejected unit count 4"
        ((TESTS_PASSED++))
    else
        print_fail "Did not reject unit count 4"
        ((TESTS_FAILED++))
        failed=true
    fi

    # Test invalid agents per unit (too high)
    if "$MAS_ROOT/scripts/start_session_refactored.sh" "/dev/null" "${test_id}-3" 2 5 2>&1 | \
       grep -q "agents-per-unit must be between 1 and 4"; then
        print_pass "Correctly rejected 5 agents per unit"
        ((TESTS_PASSED++))
    else
        print_fail "Did not reject 5 agents per unit"
        ((TESTS_FAILED++))
        failed=true
    fi
}

# Test 6: Check agent count calculation
test_agent_count() {
    print_test "Testing agent count calculation"

    local configs=(
        "1:1:2"   # 1 unit, 1 agent = 2 total (including meta)
        "1:2:3"   # 1 unit, 2 agents = 3 total
        "2:2:5"   # 2 units, 2 agents = 5 total
        "3:3:10"  # 3 units, 3 agents = 10 total
        "3:4:13"  # 3 units, 4 agents = 13 total
    )

    for config in "${configs[@]}"; do
        IFS=':' read -r units agents expected <<< "$config"
        local test_id="test-count-${units}x${agents}"

        local result=$("$MAS_ROOT/scripts/start_session_refactored.sh" \
                      "/dev/null" "$test_id" "$units" "$agents" 2>&1)

        if echo "$result" | grep -q "TotalAgents: $expected"; then
            print_pass "Correct agent count for ${units}x${agents}: $expected"
            ((TESTS_PASSED++))
        else
            print_fail "Wrong agent count for ${units}x${agents}: expected $expected"
            ((TESTS_FAILED++))
        fi

        # Cleanup
        local session_name="mas-${test_id:0:8}"
        cleanup_test_session "$session_name"
    done
}

# Main test execution
main() {
    echo "========================================="
    echo "Testing Refactored Session Management"
    echo "========================================="

    # Make scripts executable
    chmod +x "$MAS_ROOT/scripts/start_session_refactored.sh"

    # Run tests
    test_minimal_session
    test_medium_session
    test_full_session
    test_session_restore
    test_configuration_boundaries
    test_agent_count

    # Summary
    echo ""
    echo "========================================="
    echo "Test Results:"
    echo "  Passed: $TESTS_PASSED"
    echo "  Failed: $TESTS_FAILED"
    echo "========================================="

    if [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed.${NC}"
        exit 1
    fi
}

# Run main
main "$@"