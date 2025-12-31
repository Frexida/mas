#!/bin/bash
# Script to start all agents for restored session

SESSION_NAME="mas-f555abfc"
SESSION_DIR="/home/mtdnot/dev/anag/mas/sessions/f555abfc-cae3-4338-a2e8-5ca5e076d3ea"

echo "Starting agents for restored session..."

# Define agent configurations
declare -A AGENTS=(
    # Meta Manager
    ["0.0"]="00"
    # Design Unit
    ["1.0"]="10"
    ["1.1"]="11"
    ["1.2"]="12"
    ["1.3"]="13"
    # Development Unit
    ["2.0"]="20"
    ["2.1"]="21"
    ["2.2"]="22"
    ["2.3"]="23"
    # Business Unit
    ["3.0"]="30"
    ["3.1"]="31"
    ["3.2"]="32"
    ["3.3"]="33"
)

for pane_location in "${!AGENTS[@]}"; do
    AGENT_NUM="${AGENTS[$pane_location]}"
    AGENT_DIR="$SESSION_DIR/unit/$AGENT_NUM"

    if [ -d "$AGENT_DIR" ]; then
        echo "Starting agent $AGENT_NUM at window.pane: $pane_location"
        tmux send-keys -t "$SESSION_NAME:$pane_location" "cd '$AGENT_DIR'" C-m
        sleep 0.2
        tmux send-keys -t "$SESSION_NAME:$pane_location" "npm install -g @anthropic-ai/claude-code@1.0.100 && sleep 3 && claude --model sonnet --dangerously-skip-permissions -c" C-m
        sleep 0.5
    fi
done

echo "All agents started successfully!"
echo "Attach to session with: tmux attach -t $SESSION_NAME"