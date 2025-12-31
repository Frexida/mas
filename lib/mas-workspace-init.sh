#!/usr/bin/env bash
# mas-workspace-init.sh - Workspace initialization functions
# Handles session workspace setup for new sessions

set +e

# Define print functions if not already defined
if ! command -v print_info &> /dev/null; then
    print_info() { echo "[INFO] $1"; }
    print_success() { echo "[SUCCESS] $1"; }
    print_error() { echo "[ERROR] $1" >&2; }
    print_warning() { echo "[WARNING] $1" >&2; }
    print_debug() { [ -n "$DEBUG" ] && echo "[DEBUG] $1"; }
fi

# Initialize session workspace
# Arguments:
#   $1: session_dir - session directory path
#   $2: templates_dir - templates source directory (optional)
#   $3: unit_count - number of units to create (default: 3)
initialize_session_workspace() {
    local session_dir="$1"
    local templates_dir="${2:-$(dirname "$(dirname "${BASH_SOURCE[0]}")")}"
    local unit_count="${3:-3}"

    print_info "Initializing session workspace: $session_dir"

    # Create base directories
    mkdir -p "$session_dir"/{unit,workflows}

    # Define all possible agent unit numbers
    local all_units=(00)  # Meta Manager
    for ((unit_num=1; unit_num<=unit_count; unit_num++)); do
        local base=$((unit_num * 10))
        for ((offset=0; offset<4; offset++)); do
            all_units+=($(printf "%02d" $((base + offset))))
        done
    done

    # Initialize each agent directory
    for unit_num in "${all_units[@]}"; do
        initialize_agent_directory "$session_dir/unit/$unit_num" \
                                  "$unit_num" \
                                  "$templates_dir"
    done

    # Copy workflow templates if available
    if [ -d "$templates_dir/workflows" ]; then
        print_info "Copying workflow templates"
        cp -r "$templates_dir/workflows/"* "$session_dir/workflows/" 2>/dev/null || true
    fi

    # Copy unit templates if available
    if [ -d "$templates_dir/unit" ]; then
        # Special handling for meta manager templates
        if [ -f "$templates_dir/unit/00/WORKFLOW_INSTRUCTIONS_CRITICAL.md" ]; then
            cp "$templates_dir/unit/00/WORKFLOW_INSTRUCTIONS_CRITICAL.md" \
               "$session_dir/unit/00/WORKFLOW_INSTRUCTIONS.md" 2>/dev/null || true
        fi
    fi

    print_success "Workspace initialized"
}

# Initialize individual agent directory
# Arguments:
#   $1: agent_dir - agent directory path
#   $2: unit_num - agent unit number
#   $3: templates_dir - templates source directory (optional)
initialize_agent_directory() {
    local agent_dir="$1"
    local unit_num="$2"
    local templates_dir="${3:-$(dirname "$(dirname "${BASH_SOURCE[0]}")")}"

    print_debug "Initializing agent directory: $agent_dir (unit $unit_num)"

    # Create agent directory
    mkdir -p "$agent_dir"

    # Initialize openspec if available
    if command -v openspec &> /dev/null; then
        print_debug "Initializing openspec for agent $unit_num"
        (
            cd "$agent_dir"
            openspec init --tools claude > /dev/null 2>&1
        ) || print_warning "Failed to initialize openspec for agent $unit_num"
    else
        # Create openspec directory structure manually
        mkdir -p "$agent_dir/openspec"
    fi

    # Create README for agent
    create_agent_readme "$agent_dir" "$unit_num"

    # Copy agent-specific templates if available
    if [ -d "$templates_dir/unit/$unit_num" ]; then
        # Copy any additional templates (excluding the critical workflow file)
        find "$templates_dir/unit/$unit_num" -type f \
             ! -name "WORKFLOW_INSTRUCTIONS_CRITICAL.md" \
             -exec cp {} "$agent_dir/" \; 2>/dev/null || true
    fi
}

# Create README for agent
# Arguments:
#   $1: agent_dir - agent directory path
#   $2: unit_num - agent unit number
create_agent_readme() {
    local agent_dir="$1"
    local unit_num="$2"

    # Determine agent role
    local agent_role=""
    case "$unit_num" in
        00) agent_role="Meta Manager - Orchestrates all units" ;;
        10) agent_role="Design Manager - Leads design unit" ;;
        11) agent_role="UI Designer - User interface design" ;;
        12) agent_role="UX Designer - User experience design" ;;
        13) agent_role="Visual Designer - Visual and graphic design" ;;
        20) agent_role="Development Manager - Leads development unit" ;;
        21) agent_role="Frontend Developer - Client-side development" ;;
        22) agent_role="Backend Developer - Server-side development" ;;
        23) agent_role="DevOps Engineer - Infrastructure and operations" ;;
        30) agent_role="Business Manager - Leads business unit" ;;
        31) agent_role="Accounting - Financial management" ;;
        32) agent_role="Strategy - Business strategy" ;;
        33) agent_role="Analytics - Data analysis" ;;
        *) agent_role="Agent $unit_num" ;;
    esac

    cat > "$agent_dir/README.md" << EOF
# Agent $unit_num Workspace

## Role
$agent_role

## Directory Structure
- \`./\` - Agent workspace root
- \`./openspec/\` - OpenSpec configurations
- \`./outputs/\` - Generated outputs (created as needed)
- \`./docs/\` - Documentation (created as needed)

## Files
- \`README.md\` - This file
- \`WORKFLOW_INSTRUCTIONS.md\` - Workflow instructions (if applicable)
- Additional files will be created during agent operations

## Usage
This directory is the dedicated workspace for Agent $unit_num.
All agent-specific files, configurations, and outputs will be stored here.

## Session Information
- Session ID: \${MAS_SESSION_ID}
- Created: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF
}

# Initialize minimal workspace (for restore or light setup)
# Arguments:
#   $1: session_dir - session directory path
initialize_minimal_workspace() {
    local session_dir="$1"

    print_info "Initializing minimal workspace: $session_dir"

    # Just ensure directories exist
    mkdir -p "$session_dir"/{unit,workflows}

    # Create minimal agent directories
    for unit_num in 00 10 11 12 13 20 21 22 23 30 31 32 33; do
        mkdir -p "$session_dir/unit/$unit_num"
    done

    print_success "Minimal workspace initialized"
}

# Validate workspace structure
# Arguments:
#   $1: session_dir - session directory path
# Returns:
#   0 if valid, 1 if invalid
validate_workspace() {
    local session_dir="$1"

    # Check essential directories
    local required_dirs=("unit" "workflows")
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$session_dir/$dir" ]; then
            print_error "Missing required directory: $session_dir/$dir"
            return 1
        fi
    done

    # Check for at least meta manager
    if [ ! -d "$session_dir/unit/00" ]; then
        print_error "Missing meta manager directory: $session_dir/unit/00"
        return 1
    fi

    print_success "Workspace structure is valid"
    return 0
}

# Clean workspace (remove generated files but keep structure)
# Arguments:
#   $1: session_dir - session directory path
clean_workspace() {
    local session_dir="$1"

    print_info "Cleaning workspace: $session_dir"

    # Remove generated files but keep directories
    find "$session_dir" -type f \
         -name "*.log" -o \
         -name "*.tmp" -o \
         -name ".DS_Store" \
         -delete 2>/dev/null || true

    print_success "Workspace cleaned"
}

# Copy workflows from template
# Arguments:
#   $1: session_dir - session directory path
#   $2: templates_dir - templates source directory
copy_workflow_templates() {
    local session_dir="$1"
    local templates_dir="$2"

    if [ ! -d "$templates_dir/workflows" ]; then
        print_warning "No workflow templates found in $templates_dir/workflows"
        return 0
    fi

    print_info "Copying workflow templates"

    # Create workflows directory if not exists
    mkdir -p "$session_dir/workflows"

    # Copy MAS common rules file only
    if [ -f "$templates_dir/workflows/mas_common_rules.md" ]; then
        cp "$templates_dir/workflows/mas_common_rules.md" "$session_dir/workflows/" 2>/dev/null || {
            print_warning "Failed to copy MAS common rules"
        }
        print_success "Copied MAS common rules"
    else
        # If not found in templates, check in the main workflows directory
        if [ -f "$templates_dir/../workflows/mas_common_rules.md" ]; then
            cp "$templates_dir/../workflows/mas_common_rules.md" "$session_dir/workflows/" 2>/dev/null || {
                print_warning "Failed to copy MAS common rules from main directory"
            }
            print_success "Copied MAS common rules from main directory"
        else
            print_warning "MAS common rules not found"
        fi
    fi

    # Make scripts executable if any exist
    find "$session_dir/workflows" -type f -name "*.sh" -exec chmod +x {} \; 2>/dev/null

    print_success "Workflow setup completed"
}

# Export functions
export -f initialize_session_workspace
export -f initialize_agent_directory
export -f create_agent_readme
export -f initialize_minimal_workspace
export -f validate_workspace
export -f clean_workspace
export -f copy_workflow_templates