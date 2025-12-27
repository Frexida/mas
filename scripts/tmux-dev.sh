#!/bin/bash

# MAS Multi-Version Development tmux Session Manager
# Orchestrates all services in a organized tmux session

SESSION_NAME="mas-dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

function start_all_services() {
    echo -e "${BLUE}Starting MAS Multi-Version Development Environment${NC}"

    # Check if session already exists
    if tmux has-session -t $SESSION_NAME 2>/dev/null; then
        echo -e "${YELLOW}Session '$SESSION_NAME' already exists. Attaching...${NC}"
        tmux attach-session -t $SESSION_NAME
        exit 0
    fi

    # Create new session with observer window
    echo -e "${GREEN}Creating tmux session: $SESSION_NAME${NC}"
    tmux new-session -d -s $SESSION_NAME -n observer

    # Window 0: Observer (Health monitoring)
    tmux send-keys -t $SESSION_NAME:observer 'pnpm health --watch' C-m

    # Window 1: API v1
    tmux new-window -t $SESSION_NAME:1 -n api-v1
    tmux send-keys -t $SESSION_NAME:api-v1 'pnpm dev:api:v1' C-m

    # Window 2: API v2
    tmux new-window -t $SESSION_NAME:2 -n api-v2
    tmux send-keys -t $SESSION_NAME:api-v2 'pnpm dev:api:v2' C-m

    # Window 3: API v3
    tmux new-window -t $SESSION_NAME:3 -n api-v3
    tmux send-keys -t $SESSION_NAME:api-v3 'pnpm dev:api:v3' C-m

    # Window 4: Frontend v1
    tmux new-window -t $SESSION_NAME:4 -n web-v1
    tmux send-keys -t $SESSION_NAME:web-v1 'pnpm dev:web:v1' C-m

    # Window 5: Frontend v2
    tmux new-window -t $SESSION_NAME:5 -n web-v2
    tmux send-keys -t $SESSION_NAME:web-v2 'pnpm dev:web:v2' C-m

    # Window 6: Frontend v3
    tmux new-window -t $SESSION_NAME:6 -n web-v3
    tmux send-keys -t $SESSION_NAME:web-v3 'pnpm dev:web:v3' C-m

    # Window 7: Shell for general commands
    tmux new-window -t $SESSION_NAME:7 -n shell
    tmux send-keys -t $SESSION_NAME:shell 'echo "General purpose shell"' C-m

    # Select the observer window
    tmux select-window -t $SESSION_NAME:observer

    echo -e "${GREEN}✓ All services started!${NC}"
    echo -e "${BLUE}Attaching to session...${NC}"

    # Attach to session
    tmux attach-session -t $SESSION_NAME
}

function start_version() {
    local version=$1
    local session_name="mas-${version}"

    echo -e "${BLUE}Starting MAS ${version} Development Environment${NC}"

    if tmux has-session -t $session_name 2>/dev/null; then
        echo -e "${YELLOW}Session '$session_name' already exists. Attaching...${NC}"
        tmux attach-session -t $session_name
        exit 0
    fi

    # Create session for specific version
    tmux new-session -d -s $session_name -n "api-${version}"
    tmux send-keys -t $session_name:api-${version} "pnpm dev:api:${version}" C-m

    tmux new-window -t $session_name:1 -n "web-${version}"
    tmux send-keys -t $session_name:web-${version} "pnpm dev:web:${version}" C-m

    tmux new-window -t $session_name:2 -n shell
    tmux send-keys -t $session_name:shell "echo 'Shell for ${version}'" C-m

    tmux select-window -t $session_name:api-${version}

    echo -e "${GREEN}✓ ${version} services started!${NC}"
    tmux attach-session -t $session_name
}

function stop_services() {
    echo -e "${YELLOW}Stopping all MAS development services...${NC}"

    # Kill tmux sessions
    tmux kill-session -t $SESSION_NAME 2>/dev/null
    tmux kill-session -t mas-v1 2>/dev/null
    tmux kill-session -t mas-v2 2>/dev/null
    tmux kill-session -t mas-v3 2>/dev/null

    # Kill processes on known ports
    for port in 3001 3002 3003 5173 5174 5175; do
        if lsof -i:$port >/dev/null 2>&1; then
            echo -e "${YELLOW}Stopping services on port $port${NC}"
            lsof -ti:$port | xargs -r kill -9
        fi
    done

    echo -e "${GREEN}✓ All services stopped${NC}"
}

function list_sessions() {
    echo -e "${BLUE}Active MAS tmux sessions:${NC}"
    tmux list-sessions 2>/dev/null | grep "^mas" || echo "No MAS sessions running"
}

function attach_session() {
    local session=${1:-$SESSION_NAME}

    if tmux has-session -t $session 2>/dev/null; then
        tmux attach-session -t $session
    else
        echo -e "${RED}Session '$session' not found${NC}"
        echo -e "${YELLOW}Available sessions:${NC}"
        list_sessions
    fi
}

# Command line interface
case "$1" in
    start)
        if [ -n "$2" ]; then
            start_version "$2"
        else
            start_all_services
        fi
        ;;
    stop)
        stop_services
        ;;
    list)
        list_sessions
        ;;
    attach)
        attach_session "$2"
        ;;
    restart)
        stop_services
        sleep 2
        start_all_services
        ;;
    *)
        echo "MAS Multi-Version tmux Manager"
        echo ""
        echo "Usage:"
        echo "  $0 start [version]  - Start all services or specific version (v1/v2/v3)"
        echo "  $0 stop            - Stop all services"
        echo "  $0 list            - List active sessions"
        echo "  $0 attach [name]   - Attach to a session"
        echo "  $0 restart         - Restart all services"
        echo ""
        echo "Examples:"
        echo "  $0 start          # Start all versions"
        echo "  $0 start v1       # Start only v1"
        echo "  $0 attach mas-v2  # Attach to v2 session"
        ;;
esac