#!/usr/bin/env bash
# mas-environment.sh - Environment variable management functions
# Handles environment setup for tmux panes and sessions

set +e

# Define print functions if not already defined
if ! command -v print_info &> /dev/null; then
    print_info() { echo "[INFO] $1"; }
    print_success() { echo "[SUCCESS] $1"; }
    print_error() { echo "[ERROR] $1" >&2; }
    print_warning() { echo "[WARNING] $1" >&2; }
    print_debug() { [ -n "$DEBUG" ] && echo "[DEBUG] $1"; }
fi

# Setup environment variables for a single pane
# Arguments:
#   $1: session_name - tmux session name
#   $2: window - window index or name
#   $3: pane - pane index
#   $4: session_dir - session directory path
#   $5: session_id - session ID
#   $6: unit_num - agent unit number (optional)
setup_pane_environment() {
    local session_name="$1"
    local window="$2"
    local pane="$3"
    local session_dir="$4"
    local session_id="$5"
    local unit_num="${6:-}"

    local workspace_root="${MAS_WORKSPACE_ROOT:-$(dirname "$(dirname "${BASH_SOURCE[0]}")")}"
    local project_root="${MAS_PROJECT_ROOT:-$workspace_root}"

    print_debug "Setting up environment for window $window, pane $pane"

    # Build environment setup commands
    local env_commands=""

    # Core MAS environment variables
    env_commands+="export MAS_SESSION_ID='$session_id';"
    env_commands+="export MAS_SESSION_NAME='mas-${session_id:0:8}';"
    env_commands+="export MAS_SESSION_DIR='$session_dir';"
    env_commands+="export MAS_UNIT_DIR='$session_dir/unit';"
    env_commands+="export MAS_WORKFLOWS_DIR='$session_dir/workflows';"
    env_commands+="export MAS_WORKSPACE_ROOT='$workspace_root';"
    env_commands+="export MAS_PROJECT_ROOT='$project_root';"
    env_commands+="export MAS_ROOT='$workspace_root';"

    # Agent-specific variables
    if [ -n "$unit_num" ]; then
        env_commands+="export MAS_AGENT_ID='$unit_num';"
        env_commands+="export MAS_AGENT_DIR='$session_dir/unit/$unit_num';"

        # Determine unit type
        local unit_type=""
        case "$unit_num" in
            00) unit_type="meta" ;;
            1[0-3]) unit_type="design" ;;
            2[0-3]) unit_type="development" ;;
            3[0-3]) unit_type="business" ;;
        esac
        [ -n "$unit_type" ] && env_commands+="export MAS_UNIT_TYPE='$unit_type';"
    fi

    # Additional environment variables
    env_commands+="export TMUX_SESSION='$session_name';"
    env_commands+="export TMUX_WINDOW='$window';"
    env_commands+="export TMUX_PANE='$pane';"

    # Send environment setup commands to pane
    tmux send-keys -t "$session_name:$window.$pane" "$env_commands" C-m

    # Clear screen after setup
    tmux send-keys -t "$session_name:$window.$pane" "clear" C-m
}

# Setup environment for all panes in a session
# Arguments:
#   $1: session_name - tmux session name
#   $2: session_dir - session directory path
#   $3: session_id - session ID
setup_all_panes_environment() {
    local session_name="$1"
    local session_dir="$2"
    local session_id="$3"

    print_info "Setting up environment for all panes"

    # Get all windows
    local windows=$(tmux list-windows -t "$session_name" -F "#{window_index}" 2>/dev/null)

    for window_idx in $windows; do
        # Get pane count for this window
        local pane_count=$(tmux list-panes -t "$session_name:$window_idx" -F "#{pane_index}" 2>/dev/null | wc -l)

        for ((pane_idx=0; pane_idx<pane_count; pane_idx++)); do
            # Determine agent unit number based on window and pane
            local unit_num=""
            case "$window_idx" in
                1) [ "$pane_idx" -eq 0 ] && unit_num="00" ;;  # Meta Manager
                2) # Unit 1
                    case "$pane_idx" in
                        0) unit_num="10" ;;
                        1) unit_num="11" ;;
                        2) unit_num="12" ;;
                        3) unit_num="13" ;;
                    esac
                    ;;
                3) # Unit 2
                    case "$pane_idx" in
                        0) unit_num="20" ;;
                        1) unit_num="21" ;;
                        2) unit_num="22" ;;
                        3) unit_num="23" ;;
                    esac
                    ;;
                4) # Unit 3
                    case "$pane_idx" in
                        0) unit_num="30" ;;
                        1) unit_num="31" ;;
                        2) unit_num="32" ;;
                        3) unit_num="33" ;;
                    esac
                    ;;
            esac

            setup_pane_environment "$session_name" "$window_idx" "$pane_idx" \
                                  "$session_dir" "$session_id" "$unit_num"
        done
    done

    print_success "Environment setup complete"
}

# Export current shell environment to all panes
# Arguments:
#   $1: session_name - tmux session name
export_current_environment() {
    local session_name="$1"

    print_info "Exporting current environment to session"

    # Get important environment variables
    local env_vars=(
        "PATH"
        "HOME"
        "USER"
        "SHELL"
        "LANG"
        "LC_ALL"
        "TERM"
        "MAS_WORKSPACE_ROOT"
        "MAS_PROJECT_ROOT"
        "MAS_ROOT"
    )

    # Build export commands
    local export_commands=""
    for var in "${env_vars[@]}"; do
        if [ -n "${!var}" ]; then
            export_commands+="export $var='${!var}';"
        fi
    done

    # Send to all panes
    local windows=$(tmux list-windows -t "$session_name" -F "#{window_index}" 2>/dev/null)
    for window_idx in $windows; do
        local pane_count=$(tmux list-panes -t "$session_name:$window_idx" -F "#{pane_index}" 2>/dev/null | wc -l)
        for ((pane_idx=0; pane_idx<pane_count; pane_idx++)); do
            tmux send-keys -t "$session_name:$window_idx.$pane_idx" "$export_commands" C-m
        done
    done
}

# Setup PATH for agent tools
# Arguments:
#   $1: session_name - tmux session name
#   $2: session_dir - session directory path
setup_agent_path() {
    local session_name="$1"
    local session_dir="$2"

    local mas_bin="${MAS_ROOT:-$(dirname "$(dirname "${BASH_SOURCE[0]}")")}/bin"
    local workflows_bin="$session_dir/workflows/bin"

    # Add MAS and workflow bins to PATH if they exist
    local path_additions=""
    [ -d "$mas_bin" ] && path_additions="$mas_bin"
    [ -d "$workflows_bin" ] && path_additions="$path_additions:$workflows_bin"

    if [ -n "$path_additions" ]; then
        print_info "Adding to PATH: $path_additions"

        # Send PATH update to all panes
        local windows=$(tmux list-windows -t "$session_name" -F "#{window_index}" 2>/dev/null)
        for window_idx in $windows; do
            local pane_count=$(tmux list-panes -t "$session_name:$window_idx" -F "#{pane_index}" 2>/dev/null | wc -l)
            for ((pane_idx=0; pane_idx<pane_count; pane_idx++)); do
                tmux send-keys -t "$session_name:$window_idx.$pane_idx" \
                    "export PATH=\"$path_additions:\$PATH\"" C-m
            done
        done
    fi
}

# Load environment from metadata
# Arguments:
#   $1: session_dir - session directory path
# Exports:
#   Various MAS_* environment variables
load_environment_from_metadata() {
    local session_dir="$1"

    # Load metadata first
    if [ -f "$session_dir/.session" ]; then
        source "$session_dir/.session"
    fi

    # Set MAS environment variables
    export MAS_SESSION_ID="${SESSION_ID}"
    export MAS_SESSION_NAME="${TMUX_SESSION}"
    export MAS_SESSION_DIR="${SESSION_DIR}"
    export MAS_UNIT_DIR="${UNIT_DIR:-$SESSION_DIR/unit}"
    export MAS_WORKFLOWS_DIR="${WORKFLOWS_DIR:-$SESSION_DIR/workflows}"
    export MAS_WORKSPACE_ROOT="${MAS_WORKSPACE_ROOT:-$(dirname "$SESSION_DIR")}"
    export MAS_PROJECT_ROOT="${MAS_PROJECT_ROOT:-$MAS_WORKSPACE_ROOT}"
    export MAS_ROOT="${MAS_ROOT:-$MAS_WORKSPACE_ROOT}"

    print_success "Environment loaded from metadata"
}

# Create environment file for session
# Arguments:
#   $1: session_dir - session directory path
#   $2: session_id - session ID
create_environment_file() {
    local session_dir="$1"
    local session_id="$2"

    local env_file="$session_dir/.env"

    print_info "Creating environment file: $env_file"

    cat > "$env_file" << EOF
# MAS Session Environment Variables
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Session Information
MAS_SESSION_ID="$session_id"
MAS_SESSION_NAME="mas-${session_id:0:8}"
MAS_SESSION_DIR="$session_dir"

# Directory Structure
MAS_UNIT_DIR="$session_dir/unit"
MAS_WORKFLOWS_DIR="$session_dir/workflows"

# Workspace Paths
MAS_WORKSPACE_ROOT="${MAS_WORKSPACE_ROOT:-$(dirname "$session_dir")}"
MAS_PROJECT_ROOT="${MAS_PROJECT_ROOT:-\$MAS_WORKSPACE_ROOT}"
MAS_ROOT="\$MAS_WORKSPACE_ROOT"

# Additional Configuration
TMUX_SESSION="mas-${session_id:0:8}"
EOF

    print_success "Environment file created"
}

# Source environment file in pane
# Arguments:
#   $1: session_name - tmux session name
#   $2: window - window index or name
#   $3: pane - pane index
#   $4: env_file - environment file path
source_environment_in_pane() {
    local session_name="$1"
    local window="$2"
    local pane="$3"
    local env_file="$4"

    if [ -f "$env_file" ]; then
        tmux send-keys -t "$session_name:$window.$pane" "source '$env_file'" C-m
    fi
}

# Export functions
export -f setup_pane_environment
export -f setup_all_panes_environment
export -f export_current_environment
export -f setup_agent_path
export -f load_environment_from_metadata
export -f create_environment_file
export -f source_environment_in_pane