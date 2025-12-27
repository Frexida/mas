#!/bin/bash

# Worktree依存関係セットアップスクリプト

# 絶対パスを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
WORKTREE_BASE="${BASE_DIR}/../mas-worktrees"

BRANCHES=("fix-session-restore" "refactor-app-rename" "fix-docs-viewer" "fix-ui-consistency")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Setting up dependencies for all worktrees...${NC}"
echo -e "${BLUE}Worktree base: ${WORKTREE_BASE}${NC}"

for branch in "${BRANCHES[@]}"; do
    echo -e "\n${YELLOW}Processing: ${branch}${NC}"

    WORKTREE_PATH="${WORKTREE_BASE}/${branch}"

    if [ ! -d "$WORKTREE_PATH" ]; then
        echo -e "${RED}Worktree not found: ${WORKTREE_PATH}${NC}"
        continue
    fi

    # API dependencies
    if [ -d "${WORKTREE_PATH}/api" ]; then
        echo -e "${BLUE}Installing API dependencies for ${branch}...${NC}"
        (cd "${WORKTREE_PATH}/api" && npm install)
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ API dependencies installed${NC}"
        else
            echo -e "${RED}✗ API dependencies installation failed${NC}"
        fi
    fi

    # Web dependencies
    if [ -d "${WORKTREE_PATH}/web" ]; then
        echo -e "${BLUE}Installing Web dependencies for ${branch}...${NC}"
        (cd "${WORKTREE_PATH}/web" && npm install)
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Web dependencies installed${NC}"
        else
            echo -e "${RED}✗ Web dependencies installation failed${NC}"
        fi
    fi
done

echo -e "\n${GREEN}✓ All worktree dependencies setup complete!${NC}"