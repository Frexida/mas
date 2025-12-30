#!/usr/bin/env bash
# mas-session-common.sh - Common session management functions
# Shared tmux operations for start_session.sh and session-restore.sh

# Don't exit on error for library functions
set +e

# Define print functions if not already defined
if ! command -v print_info &> /dev/null; then
    print_info() { echo "[INFO] $1"; }
    print_success() { echo "[SUCCESS] $1"; }
    print_error() { echo "[ERROR] $1" >&2; }
    print_warning() { echo "[WARNING] $1" >&2; }
    print_debug() { [ -n "$DEBUG" ] && echo "[DEBUG] $1"; }
fi

# ウィンドウ構造定義（カスタマイズ可能）
declare -gA WINDOW_LAYOUTS=(
    ["meta"]="1:meta-manager:1"      # index:name:panes
    ["unit1"]="2:unit1:4"           # index:name:panes
    ["unit2"]="3:unit2:4"           # index:name:panes
    ["unit3"]="4:unit3:4"           # index:name:panes
    ["monitor"]="5:monitor:1"       # index:name:panes
)

# Alternative window names for backward compatibility
declare -gA WINDOW_ALIASES=(
    ["design"]="unit1"
    ["development"]="unit2"
    ["business"]="unit3"
    ["terminal"]="monitor"
    ["logs"]="monitor"
)

# Create tmux window structure
# Arguments:
#   $1: session_name - tmux session name
#   $2: session_dir - session directory path
#   $3: unit_count - number of units to create (default: 3)
create_mas_window_structure() {
    local session_name="$1"
    local session_dir="$2"
    local unit_count="${3:-3}"

    print_info "Creating tmux session: $session_name"

    # Create main session
    tmux new-session -d -s "$session_name" -c "$session_dir" 2>/dev/null || {
        print_error "Failed to create tmux session: $session_name"
        return 1
    }

    # Rename initial window to initial
    tmux rename-window -t "$session_name:0" "initial"

    # Create meta-manager window
    tmux new-window -t "$session_name:1" -n "meta-manager" -c "$session_dir"

    # Create unit windows based on unit_count
    local window_idx=2
    for ((unit_num=1; unit_num<=unit_count; unit_num++)); do
        local window_name="unit${unit_num}"

        # Check if unit directory exists (for dynamic creation)
        local unit_dir="$session_dir/unit/${unit_num}0"
        if [ -d "$unit_dir" ] || [ "$unit_count" -ge "$unit_num" ]; then
            tmux new-window -t "$session_name:$window_idx" -n "$window_name" -c "$session_dir"

            # Create 4 panes for unit windows
            split_window_to_4panes "$session_name" "$window_idx"

            ((window_idx++))
        fi
    done

    # Create monitor window
    tmux new-window -t "$session_name:$window_idx" -n "monitor" -c "$session_dir"

    # Select first window
    tmux select-window -t "$session_name:1"

    print_success "Tmux structure created successfully"
}

# Split window into 4 panes (2x2 layout)
# Arguments:
#   $1: session_name - tmux session name
#   $2: window - window index or name
split_window_to_4panes() {
    local session_name="$1"
    local window="$2"

    # Create 4 panes (2x2 layout)
    # Initial state: 1 pane
    # After first split (horizontal): 2 panes [0|1]
    # After second split (vertical on pane 0): 3 panes [0|1]
    #                                                   [2| ]
    # After third split (vertical on pane 1): 4 panes [0|2]
    #                                                  [1|3]

    tmux split-window -t "$session_name:$window" -h -c "$session_dir"
    tmux split-window -t "$session_name:$window.0" -v -c "$session_dir"
    tmux split-window -t "$session_name:$window.2" -v -c "$session_dir"

    # Optional: Apply tiled layout for even distribution
    # tmux select-layout -t "$session_name:$window" tiled
}

# Create restore-compatible window structure
# Used by session-restore.sh for backward compatibility
create_restore_window_structure() {
    local session_name="$1"
    local session_dir="$2"

    print_info "Creating restore-compatible tmux structure"

    # Create main session
    tmux new-session -d -s "$session_name" -c "$session_dir" 2>/dev/null || {
        print_error "Session already exists: $session_name"
        return 2
    }

    # Rename initial window to meta
    tmux rename-window -t "$session_name:0" "meta"

    # Create windows with alternative names
    local window_names=("design" "development" "business" "terminal" "logs")
    local window_idx=1

    for window_name in "${window_names[@]}"; do
        tmux new-window -t "$session_name:$window_idx" -n "$window_name" -c "$session_dir"

        # Create 4 panes for unit windows (design, development, business)
        if [[ "$window_name" == "design" ]] || [[ "$window_name" == "development" ]] || [[ "$window_name" == "business" ]]; then
            split_window_to_4panes "$session_name" "$window_idx"

            # Apply tiled layout for restore compatibility
            tmux select-layout -t "$session_name:$window_idx" tiled
        fi

        ((window_idx++))
    done

    print_success "Restore-compatible structure created"
}

# Get window index by name (handles aliases)
# Arguments:
#   $1: session_name - tmux session name
#   $2: window_name - window name or alias
get_window_index() {
    local session_name="$1"
    local window_name="$2"

    # Check if it's an alias
    if [[ -n "${WINDOW_ALIASES[$window_name]}" ]]; then
        window_name="${WINDOW_ALIASES[$window_name]}"
    fi

    # Get window index
    tmux list-windows -t "$session_name" -F "#{window_index}:#{window_name}" 2>/dev/null | \
        grep ":${window_name}$" | cut -d: -f1
}

# Check if tmux session exists
# Arguments:
#   $1: session_name - tmux session name
tmux_session_exists() {
    local session_name="$1"
    tmux has-session -t "$session_name" 2>/dev/null
}

# Kill tmux session if exists
# Arguments:
#   $1: session_name - tmux session name
kill_tmux_session() {
    local session_name="$1"

    if tmux_session_exists "$session_name"; then
        tmux kill-session -t "$session_name" 2>/dev/null || true
        print_info "Killed existing session: $session_name"
    fi
}

# Get pane count for a window
# Arguments:
#   $1: session_name - tmux session name
#   $2: window - window index or name
get_pane_count() {
    local session_name="$1"
    local window="$2"

    tmux list-panes -t "$session_name:$window" -F "#{pane_index}" 2>/dev/null | wc -l
}

# Send command to specific pane
# Arguments:
#   $1: session_name - tmux session name
#   $2: window - window index or name
#   $3: pane - pane index
#   $4: command - command to send
send_to_pane() {
    local session_name="$1"
    local window="$2"
    local pane="$3"
    local command="$4"

    tmux send-keys -t "$session_name:$window.$pane" "$command" C-m
}

# Clear all panes in session
# Arguments:
#   $1: session_name - tmux session name
clear_all_panes() {
    local session_name="$1"

    # Get all windows
    local windows=$(tmux list-windows -t "$session_name" -F "#{window_index}" 2>/dev/null)

    for window_idx in $windows; do
        local pane_count=$(get_pane_count "$session_name" "$window_idx")

        for ((pane_idx=0; pane_idx<pane_count; pane_idx++)); do
            send_to_pane "$session_name" "$window_idx" "$pane_idx" "clear"
        done
    done
}

# Export functions for use in other scripts
export -f create_mas_window_structure
export -f create_restore_window_structure
export -f split_window_to_4panes
export -f get_window_index
export -f tmux_session_exists
export -f kill_tmux_session
export -f get_pane_count
export -f send_to_pane
export -f clear_all_panes