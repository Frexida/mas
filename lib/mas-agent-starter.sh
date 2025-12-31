#!/usr/bin/env bash
# mas-agent-starter.sh - Unified agent startup functions
# Handles agent initialization for both new sessions and restore

set +e

# Define print functions if not already defined
if ! command -v print_info &> /dev/null; then
    print_info() { echo "[INFO] $1"; }
    print_success() { echo "[SUCCESS] $1"; }
    print_error() { echo "[ERROR] $1" >&2; }
    print_warning() { echo "[WARNING] $1" >&2; }
    print_debug() { [ -n "$DEBUG" ] && echo "[DEBUG] $1"; }
fi

# Load agent models configuration if not already loaded
if [ -z "${AGENT_MODELS+x}" ]; then
    source "$(dirname "${BASH_SOURCE[0]}")/mas-agent.sh" 2>/dev/null || true
fi

# Default agent models (fallback if mas-agent.sh not found)
declare -gA DEFAULT_AGENT_MODELS=(
    ["00"]="sonnet"  # Meta Manager
    ["10"]="sonnet"  # Design Manager
    ["11"]="sonnet"  # UI Designer
    ["12"]="sonnet"  # UX Designer
    ["13"]="sonnet"  # Visual Designer
    ["20"]="sonnet"  # Dev Manager
    ["21"]="sonnet"  # Frontend Dev
    ["22"]="sonnet"  # Backend Dev
    ["23"]="sonnet"  # DevOps
    ["30"]="sonnet"  # Business Manager
    ["31"]="sonnet"  # Accounting
    ["32"]="sonnet"  # Strategy
    ["33"]="sonnet"  # Analytics
)

# Use existing AGENT_MODELS or fallback to defaults
if [ -z "${AGENT_MODELS+x}" ]; then
    declare -gA AGENT_MODELS
    for key in "${!DEFAULT_AGENT_MODELS[@]}"; do
        AGENT_MODELS["$key"]="${DEFAULT_AGENT_MODELS[$key]}"
    done
fi

# Agent names for reference
declare -gA AGENT_NAMES=(
    ["00"]="Meta Manager"
    ["10"]="Design Manager"
    ["11"]="UI Designer"
    ["12"]="UX Designer"
    ["13"]="Visual Designer"
    ["20"]="Development Manager"
    ["21"]="Frontend Developer"
    ["22"]="Backend Developer"
    ["23"]="DevOps Engineer"
    ["30"]="Business Manager"
    ["31"]="Accounting"
    ["32"]="Strategy"
    ["33"]="Analytics"
)

# Window-Unit mapping
declare -gA WINDOW_UNIT_MAP=(
    ["1"]="00"      # Window 1: Meta Manager
    ["2"]="10,11,12,13"  # Window 2: Unit 1 (Design)
    ["3"]="20,21,22,23"  # Window 3: Unit 2 (Development)
    ["4"]="30,31,32,33"  # Window 4: Unit 3 (Business)
)

# Start a single agent in specified pane
# Arguments:
#   $1: session_name - tmux session name
#   $2: window - window index or name
#   $3: pane - pane index
#   $4: unit_num - agent unit number (00, 10, 11, etc.)
#   $5: unit_dir - base unit directory
#   $6: is_restore - true for restore (adds -c flag), false for new
start_agent_unified() {
    local session_name="$1"
    local window="$2"
    local pane="$3"
    local unit_num="$4"
    local unit_dir="$5"
    local is_restore="${6:-false}"

    local model="${AGENT_MODELS[$unit_num]:-sonnet}"
    local name="${AGENT_NAMES[$unit_num]:-Agent $unit_num}"
    local agent_dir="$unit_dir/$unit_num"

    print_info "Starting $name ($unit_num) in window $window, pane $pane"

    # Change to agent directory
    tmux send-keys -t "$session_name:$window.$pane" "cd '$agent_dir'" C-m
    sleep 0.2

    # Source agent initialization script if exists
    local init_script="${MAS_ROOT:-$(dirname "$(dirname "${BASH_SOURCE[0]}")")}/lib/mas-agent_init.sh"
    if [ -f "$init_script" ]; then
        tmux send-keys -t "$session_name:$window.$pane" "source '$init_script'" C-m
        sleep 0.2
    fi

    # Display agent info
    tmux send-keys -t "$session_name:$window.$pane" "echo '=== Starting $name ($unit_num) ==='" C-m
    tmux send-keys -t "$session_name:$window.$pane" "echo 'Model: $model'" C-m
    tmux send-keys -t "$session_name:$window.$pane" "echo 'Directory: $agent_dir'" C-m
    tmux send-keys -t "$session_name:$window.$pane" "echo ''" C-m
    sleep 0.2

    # Build claude command with version-pinned install
    local claude_cmd="npm install -g @anthropic-ai/claude-code@1.0.100 && claude --model $model --dangerously-skip-permissions"

    # Add -c flag for restore/continue mode
    if [[ "$is_restore" == "true" ]]; then
        claude_cmd="$claude_cmd -c"
        print_debug "Using continue mode (-c) for restore"
    fi

    # Install claude-code and start agent
    tmux send-keys -t "$session_name:$window.$pane" "$claude_cmd" C-m

    print_success "Started $name ($unit_num)"
}

# Start agent in pane (legacy compatibility)
# Arguments:
#   $1: window - window index
#   $2: pane - pane index
#   $3: unit_num - agent unit number
start_agent_in_pane() {
    local window="$1"
    local pane="$2"
    local unit_num="$3"

    # Use global session variables
    local session_name="${MAS_SESSION_NAME:-$TMUX_SESSION}"
    local unit_dir="${MAS_UNIT_DIR:-$SESSION_DIR/unit}"

    start_agent_unified "$session_name" "$window" "$pane" "$unit_num" "$unit_dir" "false"
}

# Start all agents for a session
# Arguments:
#   $1: session_name - tmux session name
#   $2: session_dir - session directory
#   $3: is_restore - true for restore, false for new
#   $4: unit_count - number of units to start (default: 3)
start_all_agents() {
    local session_name="$1"
    local session_dir="$2"
    local is_restore="${3:-false}"
    local unit_count="${4:-3}"
    local unit_dir="$session_dir/unit"

    print_info "Starting all agents (restore mode: $is_restore, units: $unit_count)"

    # Start Meta Manager (window 1, pane 0)
    if [ -d "$unit_dir/00" ]; then
        start_agent_unified "$session_name" 1 0 "00" "$unit_dir" "$is_restore"
    fi

    # Start agents for each unit
    for ((unit_num=1; unit_num<=unit_count; unit_num++)); do
        local window_idx=$((unit_num + 1))  # Windows 2, 3, 4 for units 1, 2, 3
        local base_unit=$((unit_num * 10))  # 10, 20, 30

        # Check if window exists
        if ! tmux list-windows -t "$session_name" -F "#{window_index}" | grep -q "^${window_idx}$"; then
            print_warning "Window $window_idx does not exist, skipping unit $unit_num"
            continue
        fi

        # Start 4 agents per unit (manager + 3 workers)
        for ((offset=0; offset<4; offset++)); do
            local agent_num=$(printf "%02d" $((base_unit + offset)))
            local pane_idx=$offset

            if [ -d "$unit_dir/$agent_num" ]; then
                start_agent_unified "$session_name" "$window_idx" "$pane_idx" \
                                  "$agent_num" "$unit_dir" "$is_restore"
                sleep 0.3  # Small delay between agents
            fi
        done
    done

    print_success "All agents started"
}

# Start agents by window name (for restore compatibility)
# Arguments:
#   $1: session_name - tmux session name
#   $2: session_dir - session directory
#   $3: is_restore - true for restore, false for new
start_agents_by_window_name() {
    local session_name="$1"
    local session_dir="$2"
    local is_restore="${3:-false}"
    local unit_dir="$session_dir/unit"

    # Window name to unit mapping for restore
    declare -A window_units=(
        ["meta"]="00"
        ["design"]="10,11,12,13"
        ["development"]="20,21,22,23"
        ["business"]="30,31,32,33"
    )

    for window_name in "${!window_units[@]}"; do
        # Get window index by name
        local window_idx=$(tmux list-windows -t "$session_name" -F "#{window_index}:#{window_name}" 2>/dev/null | \
                          grep ":${window_name}$" | cut -d: -f1)

        if [ -z "$window_idx" ]; then
            print_warning "Window '$window_name' not found"
            continue
        fi

        # Parse unit numbers
        IFS=',' read -ra units <<< "${window_units[$window_name]}"

        # Start agents in window
        local pane_idx=0
        for unit_num in "${units[@]}"; do
            if [ -d "$unit_dir/$unit_num" ]; then
                start_agent_unified "$session_name" "$window_idx" "$pane_idx" \
                                  "$unit_num" "$unit_dir" "$is_restore"
                ((pane_idx++))
                sleep 0.3
            fi
        done
    done
}

# Stop all agents in a session
# Arguments:
#   $1: session_name - tmux session name
stop_all_agents() {
    local session_name="$1"

    print_info "Stopping all agents in session: $session_name"

    # Send Ctrl-C to all panes
    local windows=$(tmux list-windows -t "$session_name" -F "#{window_index}" 2>/dev/null)

    for window_idx in $windows; do
        local pane_count=$(tmux list-panes -t "$session_name:$window_idx" -F "#{pane_index}" 2>/dev/null | wc -l)

        for ((pane_idx=0; pane_idx<pane_count; pane_idx++)); do
            # Send Ctrl-C to stop claude
            tmux send-keys -t "$session_name:$window_idx.$pane_idx" C-c
            sleep 0.1
        done
    done

    print_success "All agents stopped"
}

# Export functions
export -f start_agent_unified
export -f start_agent_in_pane
export -f start_all_agents
export -f start_agents_by_window_name
export -f stop_all_agents