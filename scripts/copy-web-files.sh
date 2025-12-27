#!/bin/bash

# WorktreeにWebファイルをコピーするスクリプト

# 絶対パスを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
WORKTREE_BASE="${BASE_DIR}/../mas-worktrees"
SOURCE_WEB="${BASE_DIR}/web"

BRANCHES=("fix-session-restore" "refactor-app-rename" "fix-docs-viewer" "fix-ui-consistency")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Copying Web files to all worktrees...${NC}"

for branch in "${BRANCHES[@]}"; do
    echo -e "\n${YELLOW}Processing: ${branch}${NC}"

    TARGET_WEB="${WORKTREE_BASE}/${branch}/web"

    if [ ! -d "${WORKTREE_BASE}/${branch}" ]; then
        echo -e "${RED}Worktree not found: ${WORKTREE_BASE}/${branch}${NC}"
        continue
    fi

    # Create web directory if it doesn't exist
    if [ ! -d "$TARGET_WEB" ]; then
        echo -e "${BLUE}Creating web directory...${NC}"
        mkdir -p "${TARGET_WEB}"
    fi

    # Copy all web files
    echo -e "${BLUE}Copying web files...${NC}"
    cp -r "${SOURCE_WEB}"/* "${TARGET_WEB}/" 2>/dev/null || true
    cp "${SOURCE_WEB}"/.npmrc "${TARGET_WEB}/" 2>/dev/null || true

    # Create .gitignore if not exists
    if [ ! -f "${TARGET_WEB}/.gitignore" ]; then
        echo "node_modules/" > "${TARGET_WEB}/.gitignore"
        echo "dist/" >> "${TARGET_WEB}/.gitignore"
        echo ".vite/" >> "${TARGET_WEB}/.gitignore"
    fi

    echo -e "${GREEN}✓ Copied web files${NC}"

    # Set different ports for each branch
    case "$branch" in
        "fix-session-restore")
            PORT="5176"
            API_PORT="3001"
            ;;
        "refactor-app-rename")
            PORT="5179"
            API_PORT="3004"
            ;;
        "fix-docs-viewer")
            PORT="5182"
            API_PORT="3007"
            ;;
        "fix-ui-consistency")
            PORT="5185"
            API_PORT="3010"
            ;;
    esac

    # Create .env.local with correct API port
    cat > "${TARGET_WEB}/.env.local" <<EOF
VITE_PORT=${PORT}
VITE_API_BASE=http://localhost:${API_PORT}
VITE_HMR_PORT=${PORT}
EOF
    echo -e "${GREEN}✓ Created .env.local (Web port: ${PORT}, API port: ${API_PORT})${NC}"

    echo -e "${BLUE}Installing dependencies for ${branch}/web...${NC}"
    (cd "${TARGET_WEB}" && npm install)

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Some warnings during installation (may be ok)${NC}"
    fi
done

echo -e "\n${GREEN}✓ All Web files copied successfully!${NC}"
echo ""
echo -e "${BLUE}Start Web frontends with:${NC}"
echo -e "  cd ${WORKTREE_BASE}/fix-session-restore/web && npm run dev"
echo -e "  cd ${WORKTREE_BASE}/refactor-app-rename/web && npm run dev"
echo -e "  cd ${WORKTREE_BASE}/fix-docs-viewer/web && npm run dev"
echo -e "  cd ${WORKTREE_BASE}/fix-ui-consistency/web && npm run dev"