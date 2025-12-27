#!/bin/bash

# MAS Worktree Manager
# Manages git worktrees with automatic port assignment

WORKTREE_BASE="${MAS_WORKTREE_BASE:-../mas-worktrees}"
PORT_CONFIG_FILE=".worktree-ports"

# Port ranges
API_BASE_PORT=3001
FRONTEND_BASE_PORT=5173

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function create_worktree() {
    local branch_name=$1
    local worktree_path="${WORKTREE_BASE}/${branch_name}"

    # Check if worktree already exists
    if [ -d "$worktree_path" ]; then
        echo -e "${YELLOW}Worktree already exists at ${worktree_path}${NC}"
        return 1
    fi

    # Create worktree
    echo -e "${BLUE}Creating worktree for branch: ${branch_name}${NC}"
    git worktree add "$worktree_path" "$branch_name" || git worktree add -b "$branch_name" "$worktree_path"

    # Assign ports
    local api_port=$(find_next_available_port $API_BASE_PORT)
    local frontend_port=$(find_next_available_port $FRONTEND_BASE_PORT)

    # Save port configuration
    echo "${branch_name}:${api_port},${frontend_port}" >> "$PORT_CONFIG_FILE"

    # Create environment files
    echo -e "${BLUE}Configuring environment for ${branch_name}${NC}"

    # Configure API ports
    for version in v1 v2 v3; do
        local version_offset=$((${version:1} - 1))
        local api_env_file="${worktree_path}/api/${version}/.env"
        mkdir -p "$(dirname "$api_env_file")"
        echo "PORT=$((api_port + version_offset))" > "$api_env_file"
    done

    # Configure Frontend ports and API URLs
    for version in v1 v2 v3; do
        local version_offset=$((${version:1} - 1))
        local frontend_env_file="${worktree_path}/frontend/${version}/.env.local"
        mkdir -p "$(dirname "$frontend_env_file")"
        cat > "$frontend_env_file" <<EOF
VITE_API_BASE=http://localhost:$((api_port + version_offset))
VITE_API_VERSION=${version}
VITE_PORT=$((frontend_port + version_offset))
EOF
    done

    # Install dependencies
    echo -e "${BLUE}Installing dependencies...${NC}"
    cd "$worktree_path"
    pnpm install

    echo -e "${GREEN}✓ Worktree created successfully!${NC}"
    echo -e "  Path: ${worktree_path}"
    echo -e "  API Ports: $api_port-$((api_port + 2))"
    echo -e "  Frontend Ports: $frontend_port-$((frontend_port + 2))"
}

function list_worktrees() {
    echo -e "${BLUE}Active Worktrees:${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    git worktree list --porcelain | while IFS= read -r line; do
        if [[ $line == worktree* ]]; then
            path=${line#worktree }
            branch_name=$(basename "$path")

            # Get port assignment
            ports=$(grep "^${branch_name}:" "$PORT_CONFIG_FILE" 2>/dev/null | cut -d: -f2)
            if [ -n "$ports" ]; then
                api_port=$(echo "$ports" | cut -d, -f1)
                frontend_port=$(echo "$ports" | cut -d, -f2)

                echo -e "${GREEN}● ${branch_name}${NC}"
                echo -e "  Path: ${path}"
                echo -e "  API: localhost:${api_port}-$((api_port + 2))"
                echo -e "  Frontend: localhost:${frontend_port}-$((frontend_port + 2))"

                # Check if services are running
                if lsof -i:${api_port} >/dev/null 2>&1; then
                    echo -e "  Status: ${GREEN}Running${NC}"
                else
                    echo -e "  Status: ${YELLOW}Stopped${NC}"
                fi
            else
                echo -e "${GREEN}● ${branch_name}${NC}"
                echo -e "  Path: ${path}"
                echo -e "  Ports: ${YELLOW}Not configured${NC}"
            fi
            echo
        fi
    done
}

function remove_worktree() {
    local branch_name=$1
    local worktree_path="${WORKTREE_BASE}/${branch_name}"

    # Check if worktree exists
    if [ ! -d "$worktree_path" ]; then
        echo -e "${RED}Worktree not found: ${branch_name}${NC}"
        return 1
    fi

    # Check for running processes
    ports=$(grep "^${branch_name}:" "$PORT_CONFIG_FILE" 2>/dev/null | cut -d: -f2)
    if [ -n "$ports" ]; then
        api_port=$(echo "$ports" | cut -d, -f1)
        if lsof -i:${api_port} >/dev/null 2>&1; then
            echo -e "${YELLOW}Warning: Services are still running on this worktree${NC}"
            read -p "Stop services and continue? (y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                return 1
            fi
            # Stop services
            for port in $(seq $api_port $((api_port + 2))); do
                lsof -ti:$port | xargs -r kill -9
            done
        fi
    fi

    # Remove worktree
    echo -e "${BLUE}Removing worktree: ${branch_name}${NC}"
    git worktree remove "$worktree_path" --force

    # Remove port assignment
    sed -i "/^${branch_name}:/d" "$PORT_CONFIG_FILE"

    echo -e "${GREEN}✓ Worktree removed successfully${NC}"
}

function switch_worktree() {
    local branch_name=$1
    local worktree_path="${WORKTREE_BASE}/${branch_name}"

    if [ ! -d "$worktree_path" ]; then
        echo -e "${RED}Worktree not found: ${branch_name}${NC}"
        return 1
    fi

    cd "$worktree_path"
    echo -e "${GREEN}Switched to worktree: ${branch_name}${NC}"
    echo -e "Path: $(pwd)"

    # Show port configuration
    ports=$(grep "^${branch_name}:" "$PORT_CONFIG_FILE" 2>/dev/null | cut -d: -f2)
    if [ -n "$ports" ]; then
        api_port=$(echo "$ports" | cut -d, -f1)
        frontend_port=$(echo "$ports" | cut -d, -f2)
        echo -e "API Ports: ${api_port}-$((api_port + 2))"
        echo -e "Frontend Ports: ${frontend_port}-$((frontend_port + 2))"
    fi
}

function find_next_available_port() {
    local base_port=$1
    local port=$base_port

    # Check existing assignments
    while grep -q ":${port}," "$PORT_CONFIG_FILE" 2>/dev/null || \
          grep -q ",${port}$" "$PORT_CONFIG_FILE" 2>/dev/null || \
          lsof -i:${port} >/dev/null 2>&1; do
        port=$((port + 3))  # Skip by 3 for version ranges
    done

    echo $port
}

# Main command handler
case "$1" in
    create)
        create_worktree "$2"
        ;;
    list)
        list_worktrees
        ;;
    remove)
        remove_worktree "$2"
        ;;
    switch)
        switch_worktree "$2"
        ;;
    *)
        echo "MAS Worktree Manager"
        echo ""
        echo "Usage:"
        echo "  $0 create <branch>   - Create a new worktree"
        echo "  $0 list             - List all worktrees"
        echo "  $0 remove <branch>  - Remove a worktree"
        echo "  $0 switch <branch>  - Switch to a worktree"
        ;;
esac