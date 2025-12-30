#!/usr/bin/env bash
# Demo script showing flexible unit/agent configuration capabilities

set +e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  MAS Flexible Configuration Demo${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Cleanup function
cleanup() {
    local session_name="$1"
    if tmux has-session -t "$session_name" 2>/dev/null; then
        tmux kill-session -t "$session_name" 2>/dev/null
    fi
}

# Demo 1: Single Unit with 1 Agent (Minimal Setup)
demo_minimal() {
    echo -e "${YELLOW}Demo 1: Single Unit with 1 Agent (Minimal Setup)${NC}"
    echo "  This configuration uses minimal resources - perfect for development/testing"
    echo "  Command: ./scripts/start_session_refactored.sh /dev/null demo-minimal 1 1"
    echo ""

    local session_id="demo-minimal-$(date +%s)"
    "$SCRIPT_DIR/scripts/start_session_refactored.sh" /dev/null "$session_id" 1 1

    local session_name="mas-${session_id:0:8}"

    echo -e "${GREEN}Created session: $session_name${NC}"
    echo "  - Meta Manager (00) + 1 Unit with 1 Agent = 2 total agents"
    echo "  - Windows: meta-manager, unit1, monitor"
    echo ""

    # Show structure
    tmux list-windows -t "$session_name" -F "  Window #{window_index}: #{window_name} (#{window_panes} pane(s))" 2>/dev/null

    echo ""
    read -p "Press Enter to continue..."
    cleanup "$session_name"
}

# Demo 2: Two Units with 2 Agents Each
demo_medium() {
    echo -e "${YELLOW}Demo 2: Two Units with 2 Agents Each${NC}"
    echo "  Balanced configuration for small teams"
    echo "  Command: ./scripts/start_session_refactored.sh /dev/null demo-medium 2 2"
    echo ""

    local session_id="demo-medium-$(date +%s)"
    "$SCRIPT_DIR/scripts/start_session_refactored.sh" /dev/null "$session_id" 2 2

    local session_name="mas-${session_id:0:8}"

    echo -e "${GREEN}Created session: $session_name${NC}"
    echo "  - Meta Manager (00) + 2 Units × 2 Agents = 5 total agents"
    echo "  - Unit 1: Design Manager (10) + UI Designer (11)"
    echo "  - Unit 2: Dev Manager (20) + Frontend Dev (21)"
    echo ""

    # Show structure
    tmux list-windows -t "$session_name" -F "  Window #{window_index}: #{window_name} (#{window_panes} pane(s))" 2>/dev/null

    echo ""
    read -p "Press Enter to continue..."
    cleanup "$session_name"
}

# Demo 3: Three Units with Different Agent Counts
demo_custom() {
    echo -e "${YELLOW}Demo 3: Custom Configuration Examples${NC}"
    echo ""

    # Example 1: 3 units with 3 agents
    echo "  3a. Three Units with 3 Agents Each"
    echo "      Command: ./scripts/start_session_refactored.sh /dev/null demo-custom 3 3"
    local session_id="demo-custom-$(date +%s)"
    "$SCRIPT_DIR/scripts/start_session_refactored.sh" /dev/null "$session_id" 3 3

    local session_name="mas-${session_id:0:8}"
    echo -e "${GREEN}  Created: $session_name (10 total agents)${NC}"
    cleanup "$session_name"

    # Example 2: Maximum configuration
    echo ""
    echo "  3b. Maximum Configuration (3 units × 4 agents)"
    echo "      Command: ./scripts/start_session_refactored.sh /dev/null demo-max 3 4"
    session_id="demo-max-$(date +%s)"
    "$SCRIPT_DIR/scripts/start_session_refactored.sh" /dev/null "$session_id" 3 4

    session_name="mas-${session_id:0:8}"
    echo -e "${GREEN}  Created: $session_name (13 total agents)${NC}"
    echo "  - Full team configuration with all roles"
    cleanup "$session_name"

    echo ""
    read -p "Press Enter to continue..."
}

# Demo 4: Session Restore with Dynamic Configuration
demo_restore() {
    echo -e "${YELLOW}Demo 4: Session Restore${NC}"
    echo "  Creating a session with custom configuration, then restoring it"
    echo ""

    # Create a session
    local session_id="demo-restore-$(date +%s)"
    echo "  Creating session with 2 units × 3 agents..."
    "$SCRIPT_DIR/scripts/start_session_refactored.sh" /dev/null "$session_id" 2 3

    local session_name="mas-${session_id:0:8}"
    echo -e "${GREEN}  Created session: $session_name${NC}"

    # Kill it
    echo "  Terminating session..."
    cleanup "$session_name"

    # Restore it
    echo "  Restoring session..."
    source "$SCRIPT_DIR/lib/session-restore_refactored.sh"

    if restore_session "$session_id" "false" 2>&1 | grep -q "Session restored"; then
        echo -e "${GREEN}  Session restored successfully!${NC}"
        echo "  - The session maintains its original 2×3 configuration"
        echo "  - All agent workspaces are preserved"

        # Show restored structure
        tmux list-windows -t "$session_name" -F "  Window #{window_index}: #{window_name} (#{window_panes} pane(s))" 2>/dev/null

        cleanup "$session_name"
    else
        echo -e "${RED}  Restore failed${NC}"
    fi

    echo ""
    read -p "Press Enter to continue..."
}

# Main menu
main() {
    while true; do
        clear
        echo -e "${BLUE}=========================================${NC}"
        echo -e "${BLUE}  MAS Flexible Configuration Demo${NC}"
        echo -e "${BLUE}=========================================${NC}"
        echo ""
        echo "Select a demo to run:"
        echo ""
        echo "  1) Minimal Setup (1 unit, 1 agent)"
        echo "  2) Medium Setup (2 units, 2 agents each)"
        echo "  3) Custom Configurations"
        echo "  4) Session Restore"
        echo "  5) Exit"
        echo ""
        read -p "Enter choice [1-5]: " choice

        case $choice in
            1) clear; demo_minimal ;;
            2) clear; demo_medium ;;
            3) clear; demo_custom ;;
            4) clear; demo_restore ;;
            5) echo "Exiting..."; exit 0 ;;
            *) echo "Invalid choice" ;;
        esac
    done
}

# Run main menu
main