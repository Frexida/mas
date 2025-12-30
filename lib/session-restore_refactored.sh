#!/usr/bin/env bash
# session-restore_refactored.sh - Refactored session restoration using modular libraries

set +e  # Don't exit on error for library functions

# Load MAS root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAS_ROOT="$(dirname "$SCRIPT_DIR")"
export MAS_ROOT

# Load common libraries
source "$MAS_ROOT/lib/mas-session-common.sh"
source "$MAS_ROOT/lib/mas-agent-starter.sh"
source "$MAS_ROOT/lib/mas-workspace-init.sh"
source "$MAS_ROOT/lib/mas-metadata.sh"
source "$MAS_ROOT/lib/mas-environment.sh"

# Define print functions if not already defined
if ! command -v print_info &> /dev/null; then
    print_info() { echo "[INFO] $1"; }
    print_success() { echo "[SUCCESS] $1"; }
    print_error() { echo "[ERROR] $1" >&2; }
    print_warning() { echo "[WARNING] $1" >&2; }
    print_debug() { [ -n "$DEBUG" ] && echo "[DEBUG] $1"; }
fi

# Exit codes for structured error handling
readonly EXIT_SUCCESS=0
readonly EXIT_METADATA_NOT_FOUND=1
readonly EXIT_TMUX_EXISTS=2
readonly EXIT_TMUX_CREATION_FAILED=3
readonly EXIT_INVALID_SESSION_ID=4

# Restore a terminated session using common modules
restore_session() {
    local session_id="$1"
    local auto_start_agents="${2:-true}"  # Default to auto-start

    # Validate session ID format
    if [[ ! "$session_id" =~ ^[a-f0-9\-]{8,36}$ ]]; then
        print_error "Invalid session ID format: $session_id"
        return $EXIT_INVALID_SESSION_ID
    fi

    # Setup workspace root
    MAS_WORKSPACE_ROOT="${MAS_WORKSPACE_ROOT:-$(dirname "$MAS_ROOT")}"
    export MAS_WORKSPACE_ROOT

    # Check if session directory exists
    local session_dir="${MAS_WORKSPACE_ROOT}/sessions/${session_id}"
    if [[ ! -d "$session_dir" ]]; then
        print_error "Session directory not found: $session_dir"
        return $EXIT_METADATA_NOT_FOUND
    fi

    # Load session metadata
    print_info "Loading session metadata..."
    load_session_metadata "$session_dir"

    if [ -z "$SESSION_ID" ] || [ -z "$TMUX_SESSION" ]; then
        print_error "Failed to load session metadata"
        return $EXIT_METADATA_NOT_FOUND
    fi

    # Export loaded variables
    export MAS_SESSION_ID="$SESSION_ID"
    export MAS_SESSION_NAME="$TMUX_SESSION"
    export SESSION_DIR="$session_dir"

    # Check if tmux session already exists
    if tmux_session_exists "$TMUX_SESSION"; then
        print_warning "Session already exists: $TMUX_SESSION"
        print_info "Kill the existing session first with: tmux kill-session -t $TMUX_SESSION"
        return $EXIT_TMUX_EXISTS
    fi

    print_info "Restoring session: $SESSION_ID ($TMUX_SESSION)"
    print_info "Session directory: $session_dir"
    print_info "Unit count: ${UNIT_COUNT:-3}"

    # Validate workspace structure
    if ! validate_workspace "$session_dir"; then
        print_warning "Workspace validation failed, attempting repair..."
        initialize_minimal_workspace "$session_dir"
    fi

    # Create tmux session structure
    if ! tmux new-session -d -s "$TMUX_SESSION" -c "$session_dir" 2>/dev/null; then
        print_error "Failed to create tmux session: $TMUX_SESSION"
        return $EXIT_TMUX_CREATION_FAILED
    fi

    # Detect which agents/units exist by checking directories
    local has_unit1=false has_unit2=false has_unit3=false
    local unit1_agents=() unit2_agents=() unit3_agents=()

    # Check Unit 1 (10-13)
    for agent in 10 11 12 13; do
        if [ -d "$session_dir/unit/$agent" ]; then
            has_unit1=true
            unit1_agents+=($agent)
        fi
    done

    # Check Unit 2 (20-23)
    for agent in 20 21 22 23; do
        if [ -d "$session_dir/unit/$agent" ]; then
            has_unit2=true
            unit2_agents+=($agent)
        fi
    done

    # Check Unit 3 (30-33)
    for agent in 30 31 32 33; do
        if [ -d "$session_dir/unit/$agent" ]; then
            has_unit3=true
            unit3_agents+=($agent)
        fi
    done

    print_debug "Unit 1 agents: ${unit1_agents[*]}"
    print_debug "Unit 2 agents: ${unit2_agents[*]}"
    print_debug "Unit 3 agents: ${unit3_agents[*]}"

    # Create windows based on existing units
    tmux rename-window -t "$TMUX_SESSION:0" "initial"

    # Always create meta-manager window
    tmux new-window -t "$TMUX_SESSION:1" -n "meta-manager" -c "$session_dir"

    local window_idx=2

    # Create Unit 1 window if agents exist
    if $has_unit1; then
        tmux new-window -t "$TMUX_SESSION:$window_idx" -n "unit1" -c "$session_dir"

        # Split panes based on agent count
        local agent_count=${#unit1_agents[@]}
        if [ $agent_count -eq 2 ]; then
            tmux split-window -t "$TMUX_SESSION:$window_idx" -h -c "$session_dir"
        elif [ $agent_count -eq 3 ]; then
            tmux split-window -t "$TMUX_SESSION:$window_idx" -h -c "$session_dir"
            tmux split-window -t "$TMUX_SESSION:$window_idx.1" -v -c "$session_dir"
        elif [ $agent_count -eq 4 ]; then
            split_window_to_4panes "$TMUX_SESSION" "$window_idx"
        fi
        ((window_idx++))
    fi

    # Create Unit 2 window if agents exist
    if $has_unit2; then
        tmux new-window -t "$TMUX_SESSION:$window_idx" -n "unit2" -c "$session_dir"

        local agent_count=${#unit2_agents[@]}
        if [ $agent_count -eq 2 ]; then
            tmux split-window -t "$TMUX_SESSION:$window_idx" -h -c "$session_dir"
        elif [ $agent_count -eq 3 ]; then
            tmux split-window -t "$TMUX_SESSION:$window_idx" -h -c "$session_dir"
            tmux split-window -t "$TMUX_SESSION:$window_idx.1" -v -c "$session_dir"
        elif [ $agent_count -eq 4 ]; then
            split_window_to_4panes "$TMUX_SESSION" "$window_idx"
        fi
        ((window_idx++))
    fi

    # Create Unit 3 window if agents exist
    if $has_unit3; then
        tmux new-window -t "$TMUX_SESSION:$window_idx" -n "unit3" -c "$session_dir"

        local agent_count=${#unit3_agents[@]}
        if [ $agent_count -eq 2 ]; then
            tmux split-window -t "$TMUX_SESSION:$window_idx" -h -c "$session_dir"
        elif [ $agent_count -eq 3 ]; then
            tmux split-window -t "$TMUX_SESSION:$window_idx" -h -c "$session_dir"
            tmux split-window -t "$TMUX_SESSION:$window_idx.1" -v -c "$session_dir"
        elif [ $agent_count -eq 4 ]; then
            split_window_to_4panes "$TMUX_SESSION" "$window_idx"
        fi
        ((window_idx++))
    fi

    # Create monitor window
    tmux new-window -t "$TMUX_SESSION:$window_idx" -n "monitor" -c "$session_dir"

    # Setup environment variables for all panes
    setup_all_panes_environment "$TMUX_SESSION" "$session_dir" "$SESSION_ID"

    # Update session status to inactive (restored but agents not started)
    update_session_status "$session_dir" "inactive"

    # Start agents if requested
    if [[ "$auto_start_agents" == "true" ]]; then
        print_info "Starting agents in restore mode..."

        # Start Meta Manager with -c flag for restore
        if [ -d "$session_dir/unit/00" ]; then
            start_agent_unified "$TMUX_SESSION" 1 0 "00" "$session_dir/unit" "true"
            sleep 0.5
        fi

        # Start Unit 1 agents
        window_idx=2
        if $has_unit1; then
            local pane_idx=0
            for agent in "${unit1_agents[@]}"; do
                start_agent_unified "$TMUX_SESSION" "$window_idx" "$pane_idx" \
                                  "$agent" "$session_dir/unit" "true"
                ((pane_idx++))
                sleep 0.3
            done
            ((window_idx++))
        fi

        # Start Unit 2 agents
        if $has_unit2; then
            local pane_idx=0
            for agent in "${unit2_agents[@]}"; do
                start_agent_unified "$TMUX_SESSION" "$window_idx" "$pane_idx" \
                                  "$agent" "$session_dir/unit" "true"
                ((pane_idx++))
                sleep 0.3
            done
            ((window_idx++))
        fi

        # Start Unit 3 agents
        if $has_unit3; then
            local pane_idx=0
            for agent in "${unit3_agents[@]}"; do
                start_agent_unified "$TMUX_SESSION" "$window_idx" "$pane_idx" \
                                  "$agent" "$session_dir/unit" "true"
                ((pane_idx++))
                sleep 0.3
            done
        fi

        # Update status to active after starting agents
        update_session_status "$session_dir" "active"
    fi

    # Select first window
    tmux select-window -t "$TMUX_SESSION:1"

    print_success "Session restored: $TMUX_SESSION"
    print_info "Attach with: tmux attach -t $TMUX_SESSION"

    # Display restored configuration
    local total_agents=$((1 + ${#unit1_agents[@]} + ${#unit2_agents[@]} + ${#unit3_agents[@]}))
    print_info "Restored agents: $total_agents"

    return $EXIT_SUCCESS
}

# Sync session statuses with actual tmux sessions
sync_session_statuses() {
    local workspace_root="${MAS_WORKSPACE_ROOT:-$(dirname "$MAS_ROOT")}"
    local sessions_index="${workspace_root}/sessions/.sessions.index"

    if [[ ! -f "$sessions_index" ]]; then
        print_error "Sessions index not found"
        return 1
    fi

    print_info "Syncing session statuses..."

    # Get list of active tmux sessions
    local active_tmux_sessions=$(tmux list-sessions -F "#{session_name}" 2>/dev/null | grep "^mas-" || true)

    if command -v jq &> /dev/null; then
        local temp_file=$(mktemp)
        cp "$sessions_index" "$temp_file"

        # Check each session
        local num_sessions=$(jq '.sessions | length' "$temp_file")

        for i in $(seq 0 $((num_sessions - 1))); do
            local tmux_session=$(jq -r ".sessions[$i].tmuxSession" "$temp_file")
            local session_id=$(jq -r ".sessions[$i].sessionId" "$temp_file")

            if tmux has-session -t "$tmux_session" 2>/dev/null; then
                # Check if attached
                local is_attached=$(tmux list-sessions -F "#{session_name}:#{session_attached}" | \
                                  grep "^${tmux_session}:" | cut -d: -f2)
                if [[ "$is_attached" == "1" ]]; then
                    jq ".sessions[$i].status = \"active\"" "$temp_file" > "${temp_file}.tmp"
                else
                    jq ".sessions[$i].status = \"inactive\"" "$temp_file" > "${temp_file}.tmp"
                fi
            else
                jq ".sessions[$i].status = \"terminated\"" "$temp_file" > "${temp_file}.tmp"
            fi

            if [[ -f "${temp_file}.tmp" ]]; then
                mv "${temp_file}.tmp" "$temp_file"
            fi
        done

        # Update timestamp
        jq ".lastUpdated = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" "$temp_file" > "$sessions_index"
        rm -f "$temp_file" "${temp_file}.tmp"

        # Count statuses
        local active_count=$(jq '[.sessions[] | select(.status == "active")] | length' "$sessions_index")
        local inactive_count=$(jq '[.sessions[] | select(.status == "inactive")] | length' "$sessions_index")
        local terminated_count=$(jq '[.sessions[] | select(.status == "terminated")] | length' "$sessions_index")

        print_success "Session sync complete"
        print_info "Active: $active_count, Inactive: $inactive_count, Terminated: $terminated_count"
    else
        print_warning "jq not available, cannot sync session statuses"
    fi

    return 0
}

# Export functions
export -f restore_session
export -f sync_session_statuses