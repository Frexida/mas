#!/usr/bin/env bash

# agent_init.sh - エージェント環境初期化スクリプト
# このスクリプトはエージェントが起動時に実行し、必要なコマンドパスを設定します

# MASプロジェクトルートディレクトリを取得
MAS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# mas コマンドへのエイリアスを設定
alias mas="${MAS_ROOT}/mas"

# mas コマンドをPATHに追加（エイリアスの代替案）
export PATH="${MAS_ROOT}:${PATH}"

# デバッグ情報出力（必要に応じてコメントアウト）
echo "MAS environment initialized:"
echo "  - MAS command available at: ${MAS_ROOT}/mas"
echo ""