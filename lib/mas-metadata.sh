#!/usr/bin/env bash
# mas-metadata.sh - Session metadata management functions
# Handles both JSON and legacy format metadata

set +e

# Define print functions if not already defined
if ! command -v print_info &> /dev/null; then
    print_info() { echo "[INFO] $1"; }
    print_success() { echo "[SUCCESS] $1"; }
    print_error() { echo "[ERROR] $1" >&2; }
    print_warning() { echo "[WARNING] $1" >&2; }
    print_debug() { [ -n "$DEBUG" ] && echo "[DEBUG] $1"; }
fi

# Create session metadata (unified format)
# Arguments:
#   $1: session_id - session ID
#   $2: session_dir - session directory path
#   $3: tmux_session - tmux session name
#   $4: format - metadata format (json|legacy|both) default: both
#   $5: unit_count - number of units (default: 3)
create_session_metadata() {
    local session_id="$1"
    local session_dir="$2"
    local tmux_session="$3"
    local format="${4:-both}"
    local unit_count="${5:-3}"

    print_info "Creating session metadata (format: $format)"

    case "$format" in
        json|both)
            create_metadata_json "$session_id" "$session_dir" "$tmux_session" "$unit_count"
            ;;
    esac

    case "$format" in
        legacy|both)
            create_metadata_legacy "$session_id" "$session_dir" "$tmux_session"
            ;;
    esac

    # Update sessions index
    update_sessions_index "add" "$session_id" "$session_dir" "$tmux_session"

    print_success "Metadata created"
}

# Create JSON format metadata
# Arguments:
#   $1: session_id - session ID
#   $2: session_dir - session directory path
#   $3: tmux_session - tmux session name
#   $4: unit_count - number of units
create_metadata_json() {
    local session_id="$1"
    local session_dir="$2"
    local tmux_session="$3"
    local unit_count="${4:-3}"
    local timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

    print_debug "Creating metadata.json"

    # Create units array
    local units_json="["
    for ((i=1; i<=unit_count; i++)); do
        if [ $i -gt 1 ]; then units_json+=","; fi
        local base=$((i * 10))
        units_json+='
    {
      "unitId": '$i',
      "agentCount": 4,
      "agents": ["'$(printf "%02d" $base)'","'$(printf "%02d" $((base+1)))'","'$(printf "%02d" $((base+2)))'","'$(printf "%02d" $((base+3)))'"]
    }'
    done
    units_json+="\n  ]"

    cat > "$session_dir/metadata.json" << EOF
{
  "sessionId": "$session_id",
  "sessionName": "$tmux_session",
  "workingDir": "$session_dir",
  "startedAt": "$timestamp",
  "status": "active",
  "format": "unified-v1",
  "unitCount": $unit_count,
  "hasMetaManager": true,
  "units": $units_json
}
EOF
}

# Create legacy format metadata (.session file)
# Arguments:
#   $1: session_id - session ID
#   $2: session_dir - session directory path
#   $3: tmux_session - tmux session name
create_metadata_legacy() {
    local session_id="$1"
    local session_dir="$2"
    local tmux_session="$3"
    local timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

    print_debug "Creating .session file"

    cat > "$session_dir/.session" << EOF
SESSION_ID=$session_id
TMUX_SESSION=$tmux_session
STATUS=active
CREATED_AT=$timestamp
UNIT_DIR=$session_dir/unit
WORKFLOWS_DIR=$session_dir/workflows
SESSION_DIR=$session_dir
EOF
}

# Load session metadata (both formats supported)
# Arguments:
#   $1: session_dir - session directory path
# Exports:
#   SESSION_ID, TMUX_SESSION, STATUS, SESSION_DIR, etc.
load_session_metadata() {
    local session_dir="$1"

    # Try JSON format first (if jq is available)
    if [ -f "$session_dir/metadata.json" ] && command -v jq &> /dev/null; then
        print_debug "Loading metadata from metadata.json"

        SESSION_ID=$(jq -r '.sessionId' "$session_dir/metadata.json")
        TMUX_SESSION=$(jq -r '.sessionName' "$session_dir/metadata.json")
        STATUS=$(jq -r '.status' "$session_dir/metadata.json")
        SESSION_DIR=$(jq -r '.workingDir' "$session_dir/metadata.json")
        UNIT_DIR="$SESSION_DIR/unit"
        WORKFLOWS_DIR="$SESSION_DIR/workflows"
        UNIT_COUNT=$(jq -r '.unitCount // 3' "$session_dir/metadata.json")

        export SESSION_ID TMUX_SESSION STATUS SESSION_DIR UNIT_DIR WORKFLOWS_DIR UNIT_COUNT
        return 0

    # Fall back to legacy format
    elif [ -f "$session_dir/.session" ]; then
        print_debug "Loading metadata from .session file"

        source "$session_dir/.session"

        # Set default unit count if not specified
        UNIT_COUNT="${UNIT_COUNT:-3}"

        export SESSION_ID TMUX_SESSION STATUS SESSION_DIR UNIT_DIR WORKFLOWS_DIR UNIT_COUNT
        return 0

    else
        print_error "No metadata found in $session_dir"
        return 1
    fi
}

# Update session status
# Arguments:
#   $1: session_dir - session directory path
#   $2: new_status - new status value
update_session_status() {
    local session_dir="$1"
    local new_status="$2"

    print_debug "Updating session status to: $new_status"

    # Update JSON metadata if exists
    if [ -f "$session_dir/metadata.json" ] && command -v jq &> /dev/null; then
        local temp_file=$(mktemp)
        jq --arg status "$new_status" '.status = $status' "$session_dir/metadata.json" > "$temp_file"
        mv "$temp_file" "$session_dir/metadata.json"
    fi

    # Update legacy metadata if exists
    if [ -f "$session_dir/.session" ]; then
        sed -i "s/^STATUS=.*/STATUS=$new_status/" "$session_dir/.session"
    fi

    # Update sessions index
    if [ -n "$SESSION_ID" ]; then
        update_sessions_index "update" "$SESSION_ID" "status" "$new_status"
    fi
}

# Update sessions index
# Arguments:
#   $1: action - add|update|remove
#   $2: session_id - session ID
#   $3: field/session_dir - field to update or session directory (for add)
#   $4: value/tmux_session - new value or tmux session name (for add)
update_sessions_index() {
    local action="$1"
    local session_id="$2"

    local workspace_root="${MAS_WORKSPACE_ROOT:-$(dirname "$(dirname "${BASH_SOURCE[0]}")")}"
    local index_file="$workspace_root/sessions/.sessions.index"

    print_debug "Updating sessions index: $action for $session_id"

    # Ensure sessions directory exists
    mkdir -p "$(dirname "$index_file")"

    # Initialize index if not exists
    if [ ! -f "$index_file" ]; then
        echo '{"version":"1.0","sessions":[],"lastUpdated":""}' > "$index_file"
    fi

    # Use jq if available for robust JSON handling
    if command -v jq &> /dev/null; then
        local temp_file=$(mktemp)
        local timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

        case "$action" in
            add)
                local session_dir="$3"
                local tmux_session="$4"

                # Add new session entry
                jq --arg id "$session_id" \
                   --arg tmux "$tmux_session" \
                   --arg dir "$session_dir" \
                   --arg time "$timestamp" \
                   '.sessions += [{
                      "sessionId": $id,
                      "tmuxSession": $tmux,
                      "status": "active",
                      "createdAt": $time,
                      "workingDir": $dir
                   }] | .lastUpdated = $time' \
                   "$index_file" > "$temp_file"
                ;;

            update)
                local field="$3"
                local value="$4"

                # Update existing session field
                jq --arg id "$session_id" \
                   --arg field "$field" \
                   --arg value "$value" \
                   --arg time "$timestamp" \
                   '(.sessions[] | select(.sessionId == $id) | .[$field]) = $value | .lastUpdated = $time' \
                   "$index_file" > "$temp_file"
                ;;

            remove)
                # Remove session entry
                jq --arg id "$session_id" \
                   --arg time "$timestamp" \
                   '.sessions = [.sessions[] | select(.sessionId != $id)] | .lastUpdated = $time' \
                   "$index_file" > "$temp_file"
                ;;
        esac

        # Atomic write
        mv "$temp_file" "$index_file"

    else
        print_warning "jq not available, sessions index update skipped"
    fi
}

# Get session info from index
# Arguments:
#   $1: session_id - session ID (can be partial)
# Returns:
#   JSON object of session info or empty if not found
get_session_from_index() {
    local session_id="$1"
    local workspace_root="${MAS_WORKSPACE_ROOT:-$(dirname "$(dirname "${BASH_SOURCE[0]}")")}"
    local index_file="$workspace_root/sessions/.sessions.index"

    if [ ! -f "$index_file" ]; then
        echo "{}"
        return 1
    fi

    if command -v jq &> /dev/null; then
        # Try exact match first
        local result=$(jq --arg id "$session_id" \
                         '.sessions[] | select(.sessionId == $id)' \
                         "$index_file" 2>/dev/null)

        # If no exact match, try prefix match
        if [ -z "$result" ]; then
            result=$(jq --arg id "$session_id" \
                       '.sessions[] | select(.sessionId | startswith($id))' \
                       "$index_file" 2>/dev/null | head -n1)
        fi

        if [ -n "$result" ]; then
            echo "$result"
            return 0
        fi
    fi

    echo "{}"
    return 1
}

# Validate metadata consistency
# Arguments:
#   $1: session_dir - session directory path
# Returns:
#   0 if consistent, 1 if inconsistent
validate_metadata() {
    local session_dir="$1"

    local has_json=false
    local has_legacy=false

    [ -f "$session_dir/metadata.json" ] && has_json=true
    [ -f "$session_dir/.session" ] && has_legacy=true

    if ! $has_json && ! $has_legacy; then
        print_error "No metadata files found"
        return 1
    fi

    # If both exist, check consistency
    if $has_json && $has_legacy && command -v jq &> /dev/null; then
        # Load from both sources
        local json_id=$(jq -r '.sessionId' "$session_dir/metadata.json")
        local legacy_id=$(grep '^SESSION_ID=' "$session_dir/.session" | cut -d= -f2)

        if [ "$json_id" != "$legacy_id" ]; then
            print_warning "Session ID mismatch: JSON=$json_id, Legacy=$legacy_id"
            return 1
        fi
    fi

    print_success "Metadata is valid"
    return 0
}

# Export functions
export -f create_session_metadata
export -f create_metadata_json
export -f create_metadata_legacy
export -f load_session_metadata
export -f update_session_status
export -f update_sessions_index
export -f get_session_from_index
export -f validate_metadata