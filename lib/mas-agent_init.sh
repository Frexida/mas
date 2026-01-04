#!/usr/bin/env bash

# agent_init.sh - エージェント環境初期化スクリプト
# このスクリプトはエージェントが起動時に実行し、必要なコマンドパスを設定します

# MASプロジェクトルートディレクトリを取得
MAS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# mas コマンドへのエイリアスを設定
alias mas="${MAS_ROOT}/mas"

# npm global binをPATHに追加（claude コマンド用）
NPM_GLOBAL_BIN="${HOME}/.local/npm-global/bin"
if [ -d "$NPM_GLOBAL_BIN" ]; then
    export PATH="${NPM_GLOBAL_BIN}:${PATH}"
fi

# 代替: npm prefix から取得
if ! command -v claude &> /dev/null; then
    NPM_PREFIX_BIN="$(npm config get prefix 2>/dev/null)/bin"
    if [ -d "$NPM_PREFIX_BIN" ]; then
        export PATH="${NPM_PREFIX_BIN}:${PATH}"
    fi
fi

# mas コマンドをPATHに追加
export PATH="${MAS_ROOT}:${PATH}"

# デバッグ情報出力（必要に応じてコメントアウト）
echo "MAS environment initialized:"
echo "  - MAS command available at: ${MAS_ROOT}/mas"
echo "  - claude command: $(command -v claude 2>/dev/null || echo 'not found')"
echo ""