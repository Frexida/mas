#!/usr/bin/env bash
# start_session.sh - セッション作成専用スクリプト（API用）
# このスクリプトはAPIから呼び出されて、tmuxセッションとエージェントを起動します

set -e

# 引数チェック
if [ $# -lt 1 ]; then
    echo "Usage: $0 <config-file> [session-id]"
    exit 1
fi

CONFIG_FILE="$1"
SESSION_ID="${2:-$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "$(date +%s)-$$")}"

# 環境変数の設定
export MAS_SESSION_ID="$SESSION_ID"
export MAS_SESSION_NAME="mas-${SESSION_ID:0:8}"

# スクリプトのディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAS_ROOT="$(dirname "$SCRIPT_DIR")"

# ライブラリをロード
source "$MAS_ROOT/lib/mas-tmux.sh"
source "$MAS_ROOT/lib/mas-agent.sh"
source "$MAS_ROOT/lib/mas-session.sh"
source "$MAS_ROOT/lib/mas-message.sh"

# カラー出力関数（簡易版）
print_info() { echo "[INFO] $*"; }
print_error() { echo "[ERROR] $*" >&2; }
print_success() { echo "[SUCCESS] $*"; }

# MASデータディレクトリ
MAS_DATA_DIR="${MAS_DATA_DIR:-$HOME/.mas}"
mkdir -p "$MAS_DATA_DIR/sessions"

# セッションワークスペースの作成
SESSION_DIR="$MAS_DATA_DIR/sessions/$SESSION_ID"
mkdir -p "$SESSION_DIR/unit"
mkdir -p "$SESSION_DIR/workflows"

# テンプレートからユニットをコピー
if [ -d "$MAS_ROOT/unit" ]; then
    cp -r "$MAS_ROOT/unit/"* "$SESSION_DIR/unit/" 2>/dev/null || true
fi

# テンプレートからワークフローをコピー
if [ -d "$MAS_ROOT/workflows" ]; then
    cp -r "$MAS_ROOT/workflows/"* "$SESSION_DIR/workflows/" 2>/dev/null || true
fi

# セッションメタデータを作成
cat > "$SESSION_DIR/metadata.json" <<EOF
{
  "sessionId": "$SESSION_ID",
  "sessionName": "$MAS_SESSION_NAME",
  "workingDir": "$SESSION_DIR",
  "startedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "active"
}
EOF

# セッションインデックスを更新
SESSIONS_INDEX="$MAS_DATA_DIR/sessions/.index"
echo "$SESSION_ID:active:$(date +%s)" >> "$SESSIONS_INDEX"

print_info "Creating session: $MAS_SESSION_NAME"
print_info "Session ID: $SESSION_ID"
print_info "Workspace: $SESSION_DIR"

# tmuxセッション作成
tmux new-session -d -s "$MAS_SESSION_NAME" -c "$SESSION_DIR"

# ウィンドウ作成
tmux new-window -t "$MAS_SESSION_NAME:1" -n "meta-manager" -c "$SESSION_DIR"
tmux new-window -t "$MAS_SESSION_NAME:2" -n "design" -c "$SESSION_DIR"
tmux new-window -t "$MAS_SESSION_NAME:3" -n "development" -c "$SESSION_DIR"
tmux new-window -t "$MAS_SESSION_NAME:4" -n "business" -c "$SESSION_DIR"
tmux new-window -t "$MAS_SESSION_NAME:5" -n "monitor" -c "$SESSION_DIR"

# エージェント起動（簡易版）
print_info "Starting agents..."

# Meta Manager (00)
tmux send-keys -t "$MAS_SESSION_NAME:1.0" "echo 'Meta Manager (00) ready'" C-m

# Design Unit
tmux split-window -t "$MAS_SESSION_NAME:2" -h
tmux split-window -t "$MAS_SESSION_NAME:2.0" -v
tmux split-window -t "$MAS_SESSION_NAME:2.2" -v

# Development Unit
tmux split-window -t "$MAS_SESSION_NAME:3" -h
tmux split-window -t "$MAS_SESSION_NAME:3.0" -v
tmux split-window -t "$MAS_SESSION_NAME:3.2" -v

# Business Unit
tmux split-window -t "$MAS_SESSION_NAME:4" -h
tmux split-window -t "$MAS_SESSION_NAME:4.0" -v
tmux split-window -t "$MAS_SESSION_NAME:4.2" -v

print_success "Session $MAS_SESSION_NAME created successfully"

# 設定ファイルがある場合は初期化メッセージを送信
if [ -f "$CONFIG_FILE" ]; then
    print_info "Initializing agents from config..."
    sleep 2
    # ここでは設定ファイルの処理はスキップ（API側で処理）
fi

# セッション情報を出力
echo "Session: $MAS_SESSION_NAME"
echo "SessionID: $SESSION_ID"
echo "Status: active"

exit 0