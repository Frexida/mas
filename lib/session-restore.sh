#!/bin/bash
# Session restoration utilities

# Helper functions for output
print_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1" >&2
}

print_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1" >&2
}

print_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

# Exit codes for structured error handling
readonly EXIT_SUCCESS=0
readonly EXIT_METADATA_NOT_FOUND=1
readonly EXIT_TMUX_EXISTS=2
readonly EXIT_TMUX_CREATION_FAILED=3
readonly EXIT_INVALID_SESSION_ID=4

# Restore a terminated session
restore_session() {
    local session_id="$1"
    local auto_start_agents="${2:-false}"

    # Validate session ID format
    if [[ ! "$session_id" =~ ^[a-f0-9\-]{8,36}$ ]]; then
        print_error "Invalid session ID format: $session_id"
        return $EXIT_INVALID_SESSION_ID
    fi

    # Check if session metadata exists
    local session_dir="${MAS_WORKSPACE_ROOT}/sessions/${session_id}"
    local session_metadata="${session_dir}/.session"

    if [[ ! -f "$session_metadata" ]]; then
        print_error "Session metadata not found: $session_id"
        return $EXIT_METADATA_NOT_FOUND
    fi

    # Load session metadata
    source "$session_metadata"

    # Check if tmux session already exists
    if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        print_info "Session already exists: $TMUX_SESSION"
        return $EXIT_TMUX_EXISTS
    fi

    print_info "Restoring session: $session_id"

    # Create tmux session with proper structure
    if ! tmux new-session -d -s "$TMUX_SESSION" -c "$SESSION_DIR" 2>/dev/null; then
        print_error "Failed to create tmux session: $TMUX_SESSION"
        return $EXIT_TMUX_CREATION_FAILED
    fi

    # Create windows structure
    tmux rename-window -t "$TMUX_SESSION:0" "meta"
    tmux new-window -t "$TMUX_SESSION:1" -n "design" -c "$SESSION_DIR"
    tmux new-window -t "$TMUX_SESSION:2" -n "development" -c "$SESSION_DIR"
    tmux new-window -t "$TMUX_SESSION:3" -n "business" -c "$SESSION_DIR"
    tmux new-window -t "$TMUX_SESSION:4" -n "terminal" -c "$SESSION_DIR"
    tmux new-window -t "$TMUX_SESSION:5" -n "logs" -c "$SESSION_DIR"

    # Split windows into panes (4 panes each for main windows)
    for window in design development business; do
        # Get window index
        local window_idx=$(tmux list-windows -t "$TMUX_SESSION" -F "#{window_name}:#{window_index}" | grep "^${window}:" | cut -d: -f2)

        # Create 4 panes (2x2 layout)
        tmux split-window -t "$TMUX_SESSION:${window_idx}" -h -c "$SESSION_DIR"
        tmux split-window -t "$TMUX_SESSION:${window_idx}.0" -v -c "$SESSION_DIR"
        tmux split-window -t "$TMUX_SESSION:${window_idx}.2" -v -c "$SESSION_DIR"

        # Set even layout
        tmux select-layout -t "$TMUX_SESSION:${window_idx}" tiled
    done

    # Set environment variables in all panes
    local env_vars="
        export MAS_SESSION_ID='$SESSION_ID'
        export MAS_SESSION_DIR='$SESSION_DIR'
        export MAS_UNIT_DIR='$UNIT_DIR'
        export MAS_WORKFLOWS_DIR='$WORKFLOWS_DIR'
        export MAS_WORKSPACE_ROOT='$MAS_WORKSPACE_ROOT'
        export MAS_PROJECT_ROOT='$MAS_PROJECT_ROOT'
    "

    # Send environment setup to all panes
    for window_idx in {0..5}; do
        local pane_count=$(tmux list-panes -t "$TMUX_SESSION:${window_idx}" -F "#{pane_index}" | wc -l)
        for pane_idx in $(seq 0 $((pane_count - 1))); do
            tmux send-keys -t "$TMUX_SESSION:${window_idx}.${pane_idx}" "$env_vars" Enter
            tmux send-keys -t "$TMUX_SESSION:${window_idx}.${pane_idx}" "clear" Enter
        done
    done

    # Update session index status
    update_session_status "$session_id" "inactive"

    # Start agents if requested
    if [[ "$auto_start_agents" == "true" ]]; then
        print_info "Starting agents..."
        start_session_agents "$TMUX_SESSION"
    fi

    print_success "Session restored: $TMUX_SESSION"
    print_info "Attach with: tmux attach -t $TMUX_SESSION"

    return $EXIT_SUCCESS
}

# Sync session statuses with actual tmux sessions
sync_session_statuses() {
    local sessions_index="${MAS_WORKSPACE_ROOT}/sessions/.sessions.index"

    if [[ ! -f "$sessions_index" ]]; then
        print_error "Sessions index not found"
        return 1
    fi

    print_info "Syncing session statuses..."

    # Get list of active tmux sessions
    local active_tmux_sessions=$(tmux list-sessions -F "#{session_name}" 2>/dev/null | grep "^mas-" || true)

    # Read current index
    local temp_index=$(mktemp)
    cp "$sessions_index" "$temp_index"

    # Update statuses using jq
    local updated_index=$(jq '
        .sessions |= map(
            if .tmuxSession as $tmux |
               ($tmux | split("\n") | map(select(. == $tmux)) | length > 0)
            then .
            else .status = "terminated"
            end
        )' "$temp_index" <<< "{\"tmux\": \"$active_tmux_sessions\"}")

    # Check each session individually
    local num_sessions=$(jq '.sessions | length' "$temp_index")

    for i in $(seq 0 $((num_sessions - 1))); do
        local tmux_session=$(jq -r ".sessions[$i].tmuxSession" "$temp_index")
        local session_id=$(jq -r ".sessions[$i].sessionId" "$temp_index")

        if tmux has-session -t "$tmux_session" 2>/dev/null; then
            # Check if attached
            local is_attached=$(tmux list-sessions -F "#{session_name}:#{session_attached}" | grep "^${tmux_session}:" | cut -d: -f2)
            if [[ "$is_attached" == "1" ]]; then
                jq ".sessions[$i].status = \"active\"" "$temp_index" > "${temp_index}.tmp" 2>/dev/null
            else
                jq ".sessions[$i].status = \"inactive\"" "$temp_index" > "${temp_index}.tmp" 2>/dev/null
            fi
        else
            jq ".sessions[$i].status = \"terminated\"" "$temp_index" > "${temp_index}.tmp" 2>/dev/null
        fi

        # Only move if the tmp file exists and is not empty
        if [[ -f "${temp_index}.tmp" && -s "${temp_index}.tmp" ]]; then
            mv "${temp_index}.tmp" "$temp_index"
        else
            rm -f "${temp_index}.tmp"
        fi
    done

    # Update timestamp with error checking
    local final_temp=$(mktemp)
    if jq ".lastUpdated = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" "$temp_index" > "$final_temp" 2>/dev/null; then
        # Verify the file is not empty before moving
        if [[ -s "$final_temp" ]]; then
            mv "$final_temp" "$sessions_index"
        else
            rm -f "$final_temp"
            print_error "Failed to update sessions index: output was empty"
        fi
    else
        rm -f "$final_temp"
        print_error "Failed to update sessions index timestamp"
    fi

    rm -f "$temp_index" "${temp_index}.tmp"

    # Count statuses
    local active_count=$(jq '[.sessions[] | select(.status == "active")] | length' "$sessions_index")
    local inactive_count=$(jq '[.sessions[] | select(.status == "inactive")] | length' "$sessions_index")
    local terminated_count=$(jq '[.sessions[] | select(.status == "terminated")] | length' "$sessions_index")

    print_success "Session sync complete"
    print_info "Active: $active_count, Inactive: $inactive_count, Terminated: $terminated_count"

    return 0
}

# Update session status in index
update_session_status() {
    local session_id="$1"
    local new_status="$2"
    local sessions_index="${MAS_WORKSPACE_ROOT}/sessions/.sessions.index"

    if [[ ! -f "$sessions_index" ]]; then
        return 1
    fi

    # Update status using jq
    local temp_file=$(mktemp)

    # Use jq to update the status, with error checking
    if ! jq --arg sid "$session_id" --arg status "$new_status" '
        .sessions |= map(
            if .sessionId == $sid
            then .status = $status
            else .
            end
        ) |
        .lastUpdated = now | strftime("%Y-%m-%dT%H:%M:%SZ")
    ' "$sessions_index" > "$temp_file" 2>/dev/null; then
        rm -f "$temp_file"
        return 1
    fi

    # Verify the temp file is not empty before moving
    if [[ ! -s "$temp_file" ]]; then
        rm -f "$temp_file"
        return 1
    fi

    mv "$temp_file" "$sessions_index"
}

# Start agents in a restored session
start_session_agents() {
    local tmux_session="$1"
    local session_dir="${SESSION_DIR:-${MAS_WORKSPACE_ROOT}/sessions/${SESSION_ID}}"

    # Find all agent directories dynamically
    if [[ ! -d "${session_dir}/unit" ]]; then
        print_error "Unit directory not found: ${session_dir}/unit"
        return 1
    fi

    # Get list of actual agent directories
    local agent_dirs=$(ls -d "${session_dir}/unit/"*/ 2>/dev/null | sort)

    if [[ -z "$agent_dirs" ]]; then
        print_error "No agent directories found in ${session_dir}/unit"
        return 1
    fi

    # Process each agent directory
    for agent_path in $agent_dirs; do
        local agent_num=$(basename "$agent_path")

        # Determine window and pane based on agent number
        local window=""
        local pane=0

        if [[ "$agent_num" == "00" ]]; then
            window="meta"
            pane=0
        elif [[ "$agent_num" =~ ^1[0-9]$ ]]; then
            window="design"
            pane=$((10#$agent_num % 10))
        elif [[ "$agent_num" =~ ^2[0-9]$ ]]; then
            window="development"
            pane=$((10#$agent_num % 10))
        elif [[ "$agent_num" =~ ^3[0-9]$ ]]; then
            window="business"
            pane=$((10#$agent_num % 10))
        else
            print_info "Skipping unknown agent number: $agent_num"
            continue
        fi

        # Get window index
        local window_idx=$(tmux list-windows -t "$tmux_session" -F "#{window_name}:#{window_index}" | grep "^${window}:" | cut -d: -f2)

        if [[ -n "$window_idx" ]]; then
            # Check if pane exists
            local pane_exists=$(tmux list-panes -t "$tmux_session:${window_idx}" -F "#{pane_index}" | grep -c "^${pane}$")

            if [[ "$pane_exists" -gt 0 ]]; then
                # Navigate to agent directory
                tmux send-keys -t "${tmux_session}:${window_idx}.${pane}" "cd '$agent_path'" Enter
                sleep 0.2

                # Install specific version of claude-code and start claude with restore flag (-c)
                tmux send-keys -t "${tmux_session}:${window_idx}.${pane}" "npm install -g @anthropic-ai/claude-code@1.0.100 && claude --model sonnet --dangerously-skip-permissions -c" Enter

                print_info "Started agent $agent_num in window $window, pane $pane"
            else
                print_info "Pane $pane not found in window $window for agent $agent_num"
            fi
        else
            print_info "Window $window not found for agent $agent_num"
        fi
    done
}