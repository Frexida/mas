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

# 各エージェントのディレクトリを作成
for unit_num in 00 10 11 12 13 20 21 22 23 30 31 32 33; do
    mkdir -p "$SESSION_DIR/unit/$unit_num"

    # openspecディレクトリも作成
    mkdir -p "$SESSION_DIR/unit/$unit_num/openspec"

    # 基本的なREADMEを作成
    cat > "$SESSION_DIR/unit/$unit_num/README.md" <<EOF
# Agent $unit_num Workspace

This is the workspace for agent $unit_num.
All agent-specific files and outputs will be stored here.
EOF
done

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

# エージェント起動
print_info "Starting agents..."

# エージェントのモデル設定（デフォルト）
declare -A AGENT_MODELS=(
    ["00"]="claude-3-5-sonnet-20241022"  # Meta Manager
    ["10"]="claude-3-5-sonnet-20241022"  # Design Manager
    ["11"]="claude-3-5-sonnet-20241022"  # UI Designer
    ["12"]="claude-3-5-sonnet-20241022"  # UX Designer
    ["13"]="claude-3-5-sonnet-20241022"  # Visual Designer
    ["20"]="claude-3-5-sonnet-20241022"  # Dev Manager
    ["21"]="claude-3-5-sonnet-20241022"  # Frontend Dev
    ["22"]="claude-3-5-sonnet-20241022"  # Backend Dev
    ["23"]="claude-3-5-sonnet-20241022"  # DevOps
    ["30"]="claude-3-5-sonnet-20241022"  # Business Manager
    ["31"]="claude-3-5-sonnet-20241022"  # Accounting
    ["32"]="claude-3-5-sonnet-20241022"  # Strategy
    ["33"]="claude-3-5-sonnet-20241022"  # Analytics
)

# エージェント起動関数
start_agent_in_pane() {
    local window="$1"
    local pane="$2"
    local unit_num="$3"
    local unit_dir="$SESSION_DIR/unit/$unit_num"
    local model="${AGENT_MODELS[$unit_num]}"

    # エージェントディレクトリに移動
    tmux send-keys -t "$MAS_SESSION_NAME:$window.$pane" "cd '$unit_dir'" C-m
    sleep 0.2

    # claudeコマンドを起動
    tmux send-keys -t "$MAS_SESSION_NAME:$window.$pane" "claude --model $model" C-m
}

# Meta Manager (00) - Window 1
start_agent_in_pane 1 0 "00"

# Design Unit - Window 2
tmux split-window -t "$MAS_SESSION_NAME:2" -h
tmux split-window -t "$MAS_SESSION_NAME:2.0" -v
tmux split-window -t "$MAS_SESSION_NAME:2.2" -v
start_agent_in_pane 2 0 "10"
start_agent_in_pane 2 1 "11"
start_agent_in_pane 2 2 "12"
start_agent_in_pane 2 3 "13"

# Development Unit - Window 3
tmux split-window -t "$MAS_SESSION_NAME:3" -h
tmux split-window -t "$MAS_SESSION_NAME:3.0" -v
tmux split-window -t "$MAS_SESSION_NAME:3.2" -v
start_agent_in_pane 3 0 "20"
start_agent_in_pane 3 1 "21"
start_agent_in_pane 3 2 "22"
start_agent_in_pane 3 3 "23"

# Business Unit - Window 4
tmux split-window -t "$MAS_SESSION_NAME:4" -h
tmux split-window -t "$MAS_SESSION_NAME:4.0" -v
tmux split-window -t "$MAS_SESSION_NAME:4.2" -v
start_agent_in_pane 4 0 "30"
start_agent_in_pane 4 1 "31"
start_agent_in_pane 4 2 "32"
start_agent_in_pane 4 3 "33"

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