#!/usr/bin/env bash
# start_session_refactored.sh - Refactored session creation script using modular libraries
# Supports flexible unit/agent configuration

set -e

# Arguments check
if [ $# -lt 1 ]; then
    echo "Usage: $0 <config-file> [session-id] [unit-count] [agents-per-unit]"
    echo "  config-file: Configuration file path"
    echo "  session-id: Optional session ID (auto-generated if not provided)"
    echo "  unit-count: Number of units to create (1-3, default: 3)"
    echo "  agents-per-unit: Agents per unit (1-4, default: 4)"
    exit 1
fi

CONFIG_FILE="$1"
SESSION_ID="${2:-$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "$(date +%s)-$$")}"
UNIT_COUNT="${3:-3}"
AGENTS_PER_UNIT="${4:-4}"

# Validate unit count and agents per unit
if [ "$UNIT_COUNT" -lt 1 ] || [ "$UNIT_COUNT" -gt 3 ]; then
    echo "Error: unit-count must be between 1 and 3"
    exit 1
fi

if [ "$AGENTS_PER_UNIT" -lt 1 ] || [ "$AGENTS_PER_UNIT" -gt 4 ]; then
    echo "Error: agents-per-unit must be between 1 and 4"
    exit 1
fi

# Setup environment
export MAS_SESSION_ID="$SESSION_ID"
export MAS_SESSION_NAME="mas-${SESSION_ID:0:8}"

# Get script directory and MAS root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAS_ROOT="$(dirname "$SCRIPT_DIR")"
export MAS_ROOT

# Load common libraries
source "$MAS_ROOT/lib/mas-session-common.sh"
source "$MAS_ROOT/lib/mas-agent-starter.sh"
source "$MAS_ROOT/lib/mas-workspace-init.sh"
source "$MAS_ROOT/lib/mas-metadata.sh"
source "$MAS_ROOT/lib/mas-environment.sh"

# Color output functions (if not already defined)
if ! command -v print_info &> /dev/null; then
    print_info() { echo "[INFO] $*"; }
    print_error() { echo "[ERROR] $*" >&2; }
    print_success() { echo "[SUCCESS] $*"; }
    print_debug() { [ -n "$DEBUG" ] && echo "[DEBUG] $*"; }
fi

# Setup workspace root
MAS_WORKSPACE_ROOT="${MAS_WORKSPACE_ROOT:-${PROJECT_ROOT:-$PWD}}"
export MAS_WORKSPACE_ROOT
mkdir -p "$MAS_WORKSPACE_ROOT/sessions"

# Session directory
SESSION_DIR="$MAS_WORKSPACE_ROOT/sessions/$SESSION_ID"
export SESSION_DIR

print_info "Creating session: $MAS_SESSION_NAME"
print_info "Session ID: $SESSION_ID"
print_info "Workspace: $SESSION_DIR"
print_info "Unit count: $UNIT_COUNT"
print_info "Agents per unit: $AGENTS_PER_UNIT"

# Initialize session workspace with dynamic unit configuration
# We need to create only the needed agent directories based on configuration
mkdir -p "$SESSION_DIR"/{unit,workflows}

# Calculate which agents to create
declare -a AGENT_UNITS=()

# Always include meta manager
AGENT_UNITS+=(00)

# Add agents based on unit count and agents per unit
for ((unit_num=1; unit_num<=UNIT_COUNT; unit_num++)); do
    base=$((unit_num * 10))
    for ((agent_idx=0; agent_idx<AGENTS_PER_UNIT; agent_idx++)); do
        AGENT_UNITS+=($(printf "%02d" $((base + agent_idx))))
    done
done

print_debug "Creating agents: ${AGENT_UNITS[*]}"

# Initialize agent directories
for unit_num in "${AGENT_UNITS[@]}"; do
    initialize_agent_directory "$SESSION_DIR/unit/$unit_num" "$unit_num" "$MAS_ROOT"
done

# Copy workflow templates
copy_workflow_templates "$SESSION_DIR" "$MAS_ROOT"

# Copy critical workflow for meta manager if exists
if [ -f "$MAS_ROOT/unit/00/WORKFLOW_INSTRUCTIONS_CRITICAL.md" ]; then
    cp "$MAS_ROOT/unit/00/WORKFLOW_INSTRUCTIONS_CRITICAL.md" \
       "$SESSION_DIR/unit/00/WORKFLOW_INSTRUCTIONS.md" 2>/dev/null || true
    print_debug "Copied critical thinking workflow for Meta Manager"
fi

# Create session metadata (both JSON and legacy formats)
create_session_metadata "$SESSION_ID" "$SESSION_DIR" "$MAS_SESSION_NAME" "both" "$UNIT_COUNT"

# Create tmux session with dynamic window structure
if tmux_session_exists "$MAS_SESSION_NAME"; then
    print_warning "Session already exists: $MAS_SESSION_NAME"
    kill_tmux_session "$MAS_SESSION_NAME"
fi

# Create tmux structure based on unit count
tmux new-session -d -s "$MAS_SESSION_NAME" -c "$SESSION_DIR" || {
    print_error "Failed to create tmux session"
    exit 1
}

# Rename initial window and create meta-manager window
tmux rename-window -t "$MAS_SESSION_NAME:0" "initial"
tmux new-window -t "$MAS_SESSION_NAME:1" -n "meta-manager" -c "$SESSION_DIR"

# Create windows for each unit
WINDOW_IDX=2
for ((unit_num=1; unit_num<=UNIT_COUNT; unit_num++)); do
    tmux new-window -t "$MAS_SESSION_NAME:$WINDOW_IDX" -n "unit${unit_num}" -c "$SESSION_DIR"

    # Split panes based on agents per unit (not fixed at 4)
    if [ "$AGENTS_PER_UNIT" -eq 2 ]; then
        # Split into 2 panes (vertical)
        tmux split-window -t "$MAS_SESSION_NAME:$WINDOW_IDX" -h -c "$SESSION_DIR"
    elif [ "$AGENTS_PER_UNIT" -eq 3 ]; then
        # Split into 3 panes (1 left, 2 right)
        tmux split-window -t "$MAS_SESSION_NAME:$WINDOW_IDX" -h -c "$SESSION_DIR"
        tmux split-window -t "$MAS_SESSION_NAME:$WINDOW_IDX.1" -v -c "$SESSION_DIR"
    elif [ "$AGENTS_PER_UNIT" -eq 4 ]; then
        # Split into 4 panes (2x2)
        split_window_to_4panes "$MAS_SESSION_NAME" "$WINDOW_IDX"
    fi
    # If AGENTS_PER_UNIT is 1, no splitting needed

    ((WINDOW_IDX++))
done

# Create monitor window
tmux new-window -t "$MAS_SESSION_NAME:$WINDOW_IDX" -n "monitor" -c "$SESSION_DIR"

# Setup environment variables for all panes
setup_all_panes_environment "$MAS_SESSION_NAME" "$SESSION_DIR" "$SESSION_ID"

# Start agents
print_info "Starting agents..."

# Start Meta Manager
if [ -d "$SESSION_DIR/unit/00" ]; then
    start_agent_unified "$MAS_SESSION_NAME" 1 0 "00" "$SESSION_DIR/unit" "false"
fi

# Start agents for each unit
WINDOW_IDX=2
for ((unit_num=1; unit_num<=UNIT_COUNT; unit_num++)); do
    base=$((unit_num * 10))

    for ((agent_idx=0; agent_idx<AGENTS_PER_UNIT; agent_idx++)); do
        agent_num=$(printf "%02d" $((base + agent_idx)))

        if [ -d "$SESSION_DIR/unit/$agent_num" ]; then
            start_agent_unified "$MAS_SESSION_NAME" "$WINDOW_IDX" "$agent_idx" \
                              "$agent_num" "$SESSION_DIR/unit" "false"
            sleep 0.3  # Small delay between agents
        fi
    done

    ((WINDOW_IDX++))
done

# Select first window
tmux select-window -t "$MAS_SESSION_NAME:1"

print_success "Session $MAS_SESSION_NAME created successfully"
print_info "Active agents: ${#AGENT_UNITS[@]} (${AGENT_UNITS[*]})"

# Process config file if provided
if [ -f "$CONFIG_FILE" ]; then
    print_info "Configuration file provided: $CONFIG_FILE"
    # Configuration processing handled by API
fi

# Output session information
echo "Session: $MAS_SESSION_NAME"
echo "SessionID: $SESSION_ID"
echo "Status: active"
echo "Units: $UNIT_COUNT"
echo "AgentsPerUnit: $AGENTS_PER_UNIT"
echo "TotalAgents: ${#AGENT_UNITS[@]}"

exit 0