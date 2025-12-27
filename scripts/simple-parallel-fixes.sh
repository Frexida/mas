#!/bin/bash

# 簡略版: MAS並列修正開発環境
# API側のみを起動（Webは手動で起動）

SESSION_NAME="fixes"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Worktreeベースパス（絶対パス）
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
WORKTREE_BASE="${BASE_DIR}/../mas-worktrees"

echo -e "${BLUE}Starting MAS Parallel Fixes Development Environment (API Only)${NC}"

# 既存セッションのチェック
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo -e "${YELLOW}Session '$SESSION_NAME' already exists. Killing old session...${NC}"
    tmux kill-session -t $SESSION_NAME
    sleep 1
fi

# 新しいセッション作成（概要ウィンドウ）
echo -e "${GREEN}Creating tmux session: $SESSION_NAME${NC}"
tmux new-session -d -s $SESSION_NAME -n overview

# Window 0: Overview
tmux send-keys -t $SESSION_NAME:overview 'clear && echo "=== MAS Parallel Fixes Development (API Services) ===" && echo "" && echo "Issue #7: Session Restore Fix (fix-session-restore)" && echo "  API: http://localhost:3001" && echo "  Web: http://localhost:5176 (manual start required)" && echo "" && echo "Issue #8: App Rename (refactor-app-rename)" && echo "  API: http://localhost:3004" && echo "  Web: http://localhost:5179 (manual start required)" && echo "" && echo "Issue #9: Docs Viewer Fix (fix-docs-viewer)" && echo "  API: http://localhost:3007" && echo "  Web: http://localhost:5182 (manual start required)" && echo "" && echo "Issue #10: UI Consistency Fix (fix-ui-consistency)" && echo "  API: http://localhost:3010" && echo "  Web: http://localhost:5185 (manual start required)" && echo "" && echo "Starting services..."' C-m

# Window 1: Issue #7 - Session Restore API
tmux new-window -t $SESSION_NAME:1 -n 'api-7-session'
tmux send-keys -t $SESSION_NAME:1 "cd ${WORKTREE_BASE}/fix-session-restore/api" C-m
tmux send-keys -t $SESSION_NAME:1 "clear && echo '=== Issue #7: Session Restore API ===' && echo 'Port: 3001' && echo ''" C-m
tmux send-keys -t $SESSION_NAME:1 "PORT=3001 MAS_API_PORT=3001 node --import tsx server.ts" C-m

# Window 2: Issue #8 - App Rename API
tmux new-window -t $SESSION_NAME:2 -n 'api-8-rename'
tmux send-keys -t $SESSION_NAME:2 "cd ${WORKTREE_BASE}/refactor-app-rename/api" C-m
tmux send-keys -t $SESSION_NAME:2 "clear && echo '=== Issue #8: App Rename API ===' && echo 'Port: 3004' && echo ''" C-m
tmux send-keys -t $SESSION_NAME:2 "PORT=3004 MAS_API_PORT=3004 node --import tsx server.ts" C-m

# Window 3: Issue #9 - Docs Viewer API
tmux new-window -t $SESSION_NAME:3 -n 'api-9-docs'
tmux send-keys -t $SESSION_NAME:3 "cd ${WORKTREE_BASE}/fix-docs-viewer/api" C-m
tmux send-keys -t $SESSION_NAME:3 "clear && echo '=== Issue #9: Docs Viewer API ===' && echo 'Port: 3007' && echo ''" C-m
tmux send-keys -t $SESSION_NAME:3 "PORT=3007 MAS_API_PORT=3007 node --import tsx server.ts" C-m

# Window 4: Issue #10 - UI Consistency API
tmux new-window -t $SESSION_NAME:4 -n 'api-10-ui'
tmux send-keys -t $SESSION_NAME:4 "cd ${WORKTREE_BASE}/fix-ui-consistency/api" C-m
tmux send-keys -t $SESSION_NAME:4 "clear && echo '=== Issue #10: UI Consistency API ===' && echo 'Port: 3010' && echo ''" C-m
tmux send-keys -t $SESSION_NAME:4 "PORT=3010 MAS_API_PORT=3010 node --import tsx server.ts" C-m

# Window 5: Web起動コマンド（手動実行用）
tmux new-window -t $SESSION_NAME:5 -n 'web-commands'
tmux send-keys -t $SESSION_NAME:5 "clear && echo '=== Web Frontend Commands ===' && echo '' && echo 'Run these commands in separate terminals:' && echo '' && echo '# Issue #7 - Session Restore Web (port 5176 configured via .env.local)' && echo 'cd ${WORKTREE_BASE}/fix-session-restore/web && npm run dev' && echo '' && echo '# Issue #8 - App Rename Web (port 5179 configured via .env.local)' && echo 'cd ${WORKTREE_BASE}/refactor-app-rename/web && npm run dev' && echo '' && echo '# Issue #9 - Docs Viewer Web (port 5182 configured via .env.local)' && echo 'cd ${WORKTREE_BASE}/fix-docs-viewer/web && npm run dev' && echo '' && echo '# Issue #10 - UI Consistency Web (port 5185 configured via .env.local)' && echo 'cd ${WORKTREE_BASE}/fix-ui-consistency/web && npm run dev'" C-m

# Window 6: Git操作
tmux new-window -t $SESSION_NAME:6 -n 'git'
tmux send-keys -t $SESSION_NAME:6 "clear && echo '=== Git Operations ===' && echo '' && echo 'Worktree locations:' && echo '  ${WORKTREE_BASE}/fix-session-restore' && echo '  ${WORKTREE_BASE}/refactor-app-rename' && echo '  ${WORKTREE_BASE}/fix-docs-viewer' && echo '  ${WORKTREE_BASE}/fix-ui-consistency'" C-m

# Window 7: Health Check
tmux new-window -t $SESSION_NAME:7 -n 'health'
tmux send-keys -t $SESSION_NAME:7 "watch -n 5 'echo \"=== API Service Status ===\"; echo \"\"; lsof -i:3001,3004,3007,3010 2>/dev/null | grep LISTEN || echo \"Waiting for services...\"; echo \"\"; echo \"=== API Health Checks ===\"; curl -s http://localhost:3001/health | head -1; curl -s http://localhost:3004/health | head -1; curl -s http://localhost:3007/health | head -1; curl -s http://localhost:3010/health | head -1'" C-m

# 最初のウィンドウを選択
tmux select-window -t $SESSION_NAME:overview

echo -e "${GREEN}✓ tmux session created successfully!${NC}"
echo ""
echo -e "${BLUE}=== Quick Reference ===${NC}"
echo -e "${YELLOW}API Services (running in tmux):${NC}"
echo -e "  Issue #7: http://localhost:3001/health"
echo -e "  Issue #8: http://localhost:3004/health"
echo -e "  Issue #9: http://localhost:3007/health"
echo -e "  Issue #10: http://localhost:3010/health"
echo ""
echo -e "${YELLOW}Web Frontends (manual start required):${NC}"
echo -e "  See window 'web-commands' for startup instructions"
echo ""
echo -e "${GREEN}Attaching to tmux session...${NC}"
echo -e "Use ${GREEN}Ctrl+b d${NC} to detach, ${GREEN}tmux attach -t fixes${NC} to reattach"
echo ""

# セッションにアタッチ
tmux attach-session -t $SESSION_NAME