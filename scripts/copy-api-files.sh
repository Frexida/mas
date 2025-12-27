#!/bin/bash

# WorktreeにAPIファイルをコピーするスクリプト

# 絶対パスを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
WORKTREE_BASE="${BASE_DIR}/../mas-worktrees"
SOURCE_API="${BASE_DIR}/api"

BRANCHES=("fix-session-restore" "refactor-app-rename" "fix-docs-viewer" "fix-ui-consistency")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Copying API files to all worktrees...${NC}"

for branch in "${BRANCHES[@]}"; do
    echo -e "\n${YELLOW}Processing: ${branch}${NC}"

    TARGET_API="${WORKTREE_BASE}/${branch}/api"

    if [ ! -d "$TARGET_API" ]; then
        echo -e "${RED}API directory not found: ${TARGET_API}${NC}"
        continue
    fi

    # Copy server.ts
    if [ -f "${SOURCE_API}/server.ts" ]; then
        cp "${SOURCE_API}/server.ts" "${TARGET_API}/"
        echo -e "${GREEN}✓ Copied server.ts${NC}"
    fi

    # Copy routes directory
    if [ -d "${SOURCE_API}/routes" ]; then
        cp -r "${SOURCE_API}/routes" "${TARGET_API}/"
        echo -e "${GREEN}✓ Copied routes directory${NC}"
    fi

    # Copy docs directory if exists
    if [ -d "${SOURCE_API}/docs" ]; then
        cp -r "${SOURCE_API}/docs" "${TARGET_API}/"
        echo -e "${GREEN}✓ Copied docs directory${NC}"
    fi

    # Copy package.json and package-lock.json
    if [ -f "${SOURCE_API}/package.json" ]; then
        cp "${SOURCE_API}/package.json" "${TARGET_API}/"
        echo -e "${GREEN}✓ Copied package.json${NC}"
    fi

    if [ -f "${SOURCE_API}/package-lock.json" ]; then
        cp "${SOURCE_API}/package-lock.json" "${TARGET_API}/"
        echo -e "${GREEN}✓ Copied package-lock.json${NC}"
    fi

    # Copy README files
    if [ -f "${SOURCE_API}/README.md" ]; then
        cp "${SOURCE_API}/README.md" "${TARGET_API}/"
    fi

    if [ -f "${SOURCE_API}/README-SESSION-API.md" ]; then
        cp "${SOURCE_API}/README-SESSION-API.md" "${TARGET_API}/"
    fi

    echo -e "${BLUE}Installing dependencies for ${branch}/api...${NC}"
    (cd "${TARGET_API}" && npm install)

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to install dependencies${NC}"
    fi
done

echo -e "\n${GREEN}✓ All API files copied successfully!${NC}"