#!/bin/bash

# MAS並列修正開発環境
# 4つの修正を同時に開発するためのtmuxセッション

SESSION_NAME="fixes"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Worktreeベースパス
WORKTREE_BASE="../mas-worktrees"

echo -e "${BLUE}Starting MAS Parallel Fixes Development Environment${NC}"

# 既存セッションのチェック
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo -e "${YELLOW}Session '$SESSION_NAME' already exists. Killing old session...${NC}"
    tmux kill-session -t $SESSION_NAME
    sleep 1
fi

# 新しいセッション作成（概要ウィンドウ）
echo -e "${GREEN}Creating tmux session: $SESSION_NAME${NC}"
tmux new-session -d -s $SESSION_NAME -n overview

# Window 0: Overview（ヘルスチェック）
tmux send-keys -t $SESSION_NAME:overview 'echo "=== MAS Parallel Fixes Development ===" && echo "" && echo "Issue #7: Session Restore Fix" && echo "  Branch: fix-session-restore" && echo "  Ports: API 3001-3003, Frontend 5176-5178" && echo "" && echo "Issue #8: App Rename" && echo "  Branch: refactor-app-rename" && echo "  Ports: API 3004-3006, Frontend 5179-5181" && echo "" && echo "Issue #9: Docs Viewer Fix" && echo "  Branch: fix-docs-viewer" && echo "  Ports: API 3007-3009, Frontend 5182-5184" && echo "" && echo "Issue #10: UI Consistency Fix" && echo "  Branch: fix-ui-consistency" && echo "  Ports: API 3010-3012, Frontend 5185-5187" && echo "" && echo "Starting health monitoring..." && sleep 3 && watch -n 5 "echo \"=== Service Status ===\"; echo \"\"; lsof -i:3001,3004,3007,3010,5176,5179,5182,5185 2>/dev/null | grep LISTEN || echo \"No services running yet\""' C-m

# Window 1: Session Restore修正 (Issue #7)
tmux new-window -t $SESSION_NAME:1 -n 'issue-7-session'
tmux send-keys -t $SESSION_NAME:1 "cd ${WORKTREE_BASE}/fix-session-restore" C-m
tmux send-keys -t $SESSION_NAME:1 'echo "=== Issue #7: Session Restore Fix ===" && echo "Branch: fix-session-restore" && echo "API Port: 3001, Frontend Port: 5176" && echo "" && echo "Starting development server..."' C-m
# APIとフロントエンドを別々のpaneで起動
tmux split-window -t $SESSION_NAME:1 -h
tmux send-keys -t $SESSION_NAME:1.0 "cd ${WORKTREE_BASE}/fix-session-restore/api && PORT=3001 MAS_API_PORT=3001 node --import tsx server.ts 2>&1 | sed 's/^/[API] /'" C-m
tmux send-keys -t $SESSION_NAME:1.1 "cd ${WORKTREE_BASE}/fix-session-restore/web && npm run dev -- --port 5176 2>&1 | sed 's/^/[WEB] /'" C-m

# Window 2: App Rename修正 (Issue #8)
tmux new-window -t $SESSION_NAME:2 -n 'issue-8-rename'
tmux send-keys -t $SESSION_NAME:2 "cd ${WORKTREE_BASE}/refactor-app-rename" C-m
tmux send-keys -t $SESSION_NAME:2 'echo "=== Issue #8: App Rename ===" && echo "Branch: refactor-app-rename" && echo "API Port: 3004, Frontend Port: 5179" && echo "" && echo "Starting development server..."' C-m
tmux split-window -t $SESSION_NAME:2 -h
tmux send-keys -t $SESSION_NAME:2.0 "cd ${WORKTREE_BASE}/refactor-app-rename/api && PORT=3004 MAS_API_PORT=3004 node --import tsx server.ts 2>&1 | sed 's/^/[API] /'" C-m
tmux send-keys -t $SESSION_NAME:2.1 "cd ${WORKTREE_BASE}/refactor-app-rename/web && npm run dev -- --port 5179 2>&1 | sed 's/^/[WEB] /'" C-m

# Window 3: Docs Viewer修正 (Issue #9)
tmux new-window -t $SESSION_NAME:3 -n 'issue-9-docs'
tmux send-keys -t $SESSION_NAME:3 "cd ${WORKTREE_BASE}/fix-docs-viewer" C-m
tmux send-keys -t $SESSION_NAME:3 'echo "=== Issue #9: Docs Viewer Fix ===" && echo "Branch: fix-docs-viewer" && echo "API Port: 3007, Frontend Port: 5182" && echo "" && echo "Starting development server..."' C-m
tmux split-window -t $SESSION_NAME:3 -h
tmux send-keys -t $SESSION_NAME:3.0 "cd ${WORKTREE_BASE}/fix-docs-viewer/api && PORT=3007 MAS_API_PORT=3007 node --import tsx server.ts 2>&1 | sed 's/^/[API] /'" C-m
tmux send-keys -t $SESSION_NAME:3.1 "cd ${WORKTREE_BASE}/fix-docs-viewer/web && npm run dev -- --port 5182 2>&1 | sed 's/^/[WEB] /'" C-m

# Window 4: UI Consistency修正 (Issue #10)
tmux new-window -t $SESSION_NAME:4 -n 'issue-10-ui'
tmux send-keys -t $SESSION_NAME:4 "cd ${WORKTREE_BASE}/fix-ui-consistency" C-m
tmux send-keys -t $SESSION_NAME:4 'echo "=== Issue #10: UI Consistency Fix ===" && echo "Branch: fix-ui-consistency" && echo "API Port: 3010, Frontend Port: 5185" && echo "" && echo "Starting development server..."' C-m
tmux split-window -t $SESSION_NAME:4 -h
tmux send-keys -t $SESSION_NAME:4.0 "cd ${WORKTREE_BASE}/fix-ui-consistency/api && PORT=3010 MAS_API_PORT=3010 node --import tsx server.ts 2>&1 | sed 's/^/[API] /'" C-m
tmux send-keys -t $SESSION_NAME:4.1 "cd ${WORKTREE_BASE}/fix-ui-consistency/web && npm run dev -- --port 5185 2>&1 | sed 's/^/[WEB] /'" C-m

# Window 5: Git操作用
tmux new-window -t $SESSION_NAME:5 -n 'git-ops'
tmux send-keys -t $SESSION_NAME:5 'echo "=== Git Operations ===" && echo "" && echo "Use this window for git commands across worktrees" && echo "" && echo "Quick commands:" && echo "  cd ../mas-worktrees/fix-session-restore" && echo "  cd ../mas-worktrees/refactor-app-rename" && echo "  cd ../mas-worktrees/fix-docs-viewer" && echo "  cd ../mas-worktrees/fix-ui-consistency" && echo ""' C-m

# Window 6: テスト実行用
tmux new-window -t $SESSION_NAME:6 -n 'testing'
tmux send-keys -t $SESSION_NAME:6 'echo "=== Testing Window ===" && echo "" && echo "Test endpoints:" && echo "  Session Restore: http://localhost:5176" && echo "  App Rename: http://localhost:5179" && echo "  Docs Viewer: http://localhost:5182" && echo "  UI Consistency: http://localhost:5185" && echo "" && echo "API endpoints:" && echo "  Session API: http://localhost:3001/health" && echo "  Rename API: http://localhost:3004/health" && echo "  Docs API: http://localhost:3007/health" && echo "  UI API: http://localhost:3010/health"' C-m

# 最初のウィンドウを選択
tmux select-window -t $SESSION_NAME:overview

echo -e "${GREEN}✓ tmux session created successfully!${NC}"
echo ""
echo -e "${BLUE}=== Quick Reference ===${NC}"
echo -e "Issue #7 (Session Restore): http://localhost:5176"
echo -e "Issue #8 (App Rename):      http://localhost:5179"
echo -e "Issue #9 (Docs Viewer):     http://localhost:5182"
echo -e "Issue #10 (UI Consistency): http://localhost:5185"
echo ""
echo -e "${YELLOW}Attaching to session...${NC}"
echo -e "Use ${GREEN}Ctrl+b d${NC} to detach, ${GREEN}tmux attach -t fixes${NC} to reattach"
echo ""

# セッションにアタッチ
tmux attach-session -t $SESSION_NAME