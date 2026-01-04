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

# ワークスペースルートを取得
MAS_WORKSPACE_ROOT="${MAS_WORKSPACE_ROOT:-${PROJECT_ROOT:-$PWD}}"
mkdir -p "$MAS_WORKSPACE_ROOT/sessions"

# セッションワークスペースの作成
SESSION_DIR="$MAS_WORKSPACE_ROOT/sessions/$SESSION_ID"
mkdir -p "$SESSION_DIR/unit"
mkdir -p "$SESSION_DIR/workflows"

# 各エージェントのディレクトリを作成とopenspec初期化
for unit_num in 00 10 11 12 13 20 21 22 23 30 31 32 33; do
    mkdir -p "$SESSION_DIR/unit/$unit_num"

    # 各エージェントディレクトリでopenspec initを実行
    if command -v openspec &> /dev/null; then
        cd "$SESSION_DIR/unit/$unit_num"
        openspec init --tools claude > /dev/null 2>&1 || echo "Warning: openspec init failed for agent $unit_num"
        cd - > /dev/null
    else
        # openspecコマンドがない場合は手動でディレクトリを作成
        mkdir -p "$SESSION_DIR/unit/$unit_num/openspec"
    fi

    # 基本的なREADMEを作成
    cat > "$SESSION_DIR/unit/$unit_num/README.md" <<EOF
# Agent $unit_num Workspace

This is the workspace for agent $unit_num.
All agent-specific files and outputs will be stored here.
EOF

    # メタマネージャーには批判的思考版のワークフロー指示書をコピー
    if [ "$unit_num" = "00" ] && [ -f "$MAS_ROOT/unit/00/WORKFLOW_INSTRUCTIONS_CRITICAL.md" ]; then
        cp "$MAS_ROOT/unit/00/WORKFLOW_INSTRUCTIONS_CRITICAL.md" "$SESSION_DIR/unit/00/WORKFLOW_INSTRUCTIONS.md"
        echo "Copied critical thinking workflow for Meta Manager"
    fi
done

# テンプレートからワークフローをコピー
if [ -d "$MAS_ROOT/workflows" ]; then
    cp -r "$MAS_ROOT/workflows/"* "$SESSION_DIR/workflows/" 2>/dev/null || true
fi

# セッションメタデータを作成（metadata.jsonとして）
cat > "$SESSION_DIR/metadata.json" <<EOF
{
  "sessionId": "$SESSION_ID",
  "sessionName": "$MAS_SESSION_NAME",
  "workingDir": "$SESSION_DIR",
  "startedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "active"
}
EOF

# .sessionファイルも作成（後方互換性のため）
cat > "$SESSION_DIR/.session" <<EOF
SESSION_ID=$SESSION_ID
TMUX_SESSION=$MAS_SESSION_NAME
STATUS=active
CREATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
UNIT_DIR=$SESSION_DIR/unit
WORKFLOWS_DIR=$SESSION_DIR/workflows
SESSION_DIR=$SESSION_DIR
EOF

# セッションインデックスを更新（JSON形式で.sessions.indexに）
SESSIONS_INDEX="$MAS_WORKSPACE_ROOT/sessions/.sessions.index"
if [ ! -f "$SESSIONS_INDEX" ]; then
    echo '{"version":"1.0","sessions":[],"lastUpdated":""}' > "$SESSIONS_INDEX"
fi

# jqを使ってJSON形式で追加
if command -v jq &> /dev/null; then
    TEMP_FILE="${SESSIONS_INDEX}.tmp"
    jq --arg id "$SESSION_ID" \
       --arg tmux "$MAS_SESSION_NAME" \
       --arg status "active" \
       --arg created "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
       --arg dir "$SESSION_DIR" \
       --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
       '.sessions += [{
           sessionId: $id,
           tmuxSession: $tmux,
           status: $status,
           createdAt: $created,
           workingDir: $dir
       }] | .lastUpdated = $updated' \
       "$SESSIONS_INDEX" > "$TEMP_FILE" && mv "$TEMP_FILE" "$SESSIONS_INDEX"
else
    # フォールバック: 簡易形式で.indexに記録
    echo "$SESSION_ID:active:$(date +%s)" >> "$MAS_WORKSPACE_ROOT/sessions/.index"
fi

print_info "Creating session: $MAS_SESSION_NAME"
print_info "Session ID: $SESSION_ID"
print_info "Workspace: $SESSION_DIR"

# tmuxセッション作成
tmux new-session -d -s "$MAS_SESSION_NAME" -c "$SESSION_DIR"

# ウィンドウ作成（動的に必要なユニットのみ作成）
# メタマネージャーは常に作成（単一ユニット時でも品質管理のため）
tmux new-window -t "$MAS_SESSION_NAME:1" -n "meta-manager" -c "$SESSION_DIR"

# 各ユニットの存在をチェックして必要に応じてウィンドウを作成
WINDOW_NUM=2
if [ -d "$SESSION_DIR/unit/10" ] || [ -d "$SESSION_DIR/unit/11" ] || [ -d "$SESSION_DIR/unit/12" ] || [ -d "$SESSION_DIR/unit/13" ]; then
    tmux new-window -t "$MAS_SESSION_NAME:$WINDOW_NUM" -n "unit1" -c "$SESSION_DIR"
    ((WINDOW_NUM++))
fi

if [ -d "$SESSION_DIR/unit/20" ] || [ -d "$SESSION_DIR/unit/21" ] || [ -d "$SESSION_DIR/unit/22" ] || [ -d "$SESSION_DIR/unit/23" ]; then
    tmux new-window -t "$MAS_SESSION_NAME:$WINDOW_NUM" -n "unit2" -c "$SESSION_DIR"
    ((WINDOW_NUM++))
fi

if [ -d "$SESSION_DIR/unit/30" ] || [ -d "$SESSION_DIR/unit/31" ] || [ -d "$SESSION_DIR/unit/32" ] || [ -d "$SESSION_DIR/unit/33" ]; then
    tmux new-window -t "$MAS_SESSION_NAME:$WINDOW_NUM" -n "unit3" -c "$SESSION_DIR"
    ((WINDOW_NUM++))
fi

# モニターウィンドウは常に最後に作成
tmux new-window -t "$MAS_SESSION_NAME:$WINDOW_NUM" -n "monitor" -c "$SESSION_DIR"

# エージェント起動
print_info "Starting agents..."

# エージェントのモデル設定（デフォルト）
declare -A AGENT_MODELS=(
    ["00"]="sonnet"  # Meta Manager
    ["10"]="sonnet"  # Unit1 Manager
    ["11"]="sonnet"  # Unit1 Worker 1
    ["12"]="sonnet"  # Unit1 Worker 2
    ["13"]="sonnet"  # Unit1 Worker 3
    ["20"]="sonnet"  # Unit2 Manager
    ["21"]="sonnet"  # Unit2 Worker 1
    ["22"]="sonnet"  # Unit2 Worker 2
    ["23"]="sonnet"  # Unit2 Worker 3
    ["30"]="sonnet"  # Unit3 Manager
    ["31"]="sonnet"  # Unit3 Worker 1
    ["32"]="sonnet"  # Unit3 Worker 2
    ["33"]="sonnet"  # Unit3 Worker 3
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

    # エージェント環境初期化（mas コマンドを利用可能にする）
    tmux send-keys -t "$MAS_SESSION_NAME:$window.$pane" "source '$MAS_ROOT/lib/mas-agent_init.sh'" C-m
    sleep 0.2

    # claudeコマンドを起動
    tmux send-keys -t "$MAS_SESSION_NAME:$window.$pane" "claude --model $model --dangerously-skip-permissions" C-m
}

# バージョン固定関数
lock_claude_version() {
    print_info "Installing claude-code@1.0.100 (version lock)..."
    npm install -g @anthropic-ai/claude-code@1.0.100
}

# ユニット起動関数 (npm install -> 3秒待機 -> 4エージェント起動 -> 3秒待機)
start_unit() {
    local unit_name="$1"
    local window="$2"
    local agents=("${@:3}")  # 残りの引数はエージェントID

    print_info "=== Starting $unit_name ==="

    # Step 1: npm install でバージョン固定
    lock_claude_version

    # Step 2: 3秒待機
    print_info "Waiting 3 seconds before starting agents..."
    sleep 3

    # Step 3: エージェント起動 (4体まで)
    local pane=0
    for agent_id in "${agents[@]}"; do
        start_agent_in_pane "$window" "$pane" "$agent_id"
        ((pane++))
    done

    # Step 4: 3秒待機
    print_info "Waiting 3 seconds after starting $unit_name..."
    sleep 3
}

# Meta Manager (00) - Window 1 (1エージェントのみ)
print_info "=== Starting Meta Manager ==="
lock_claude_version
sleep 3
start_agent_in_pane 1 0 "00"
sleep 3

# Unit 1 - Window 2 (4エージェント)
tmux split-window -t "$MAS_SESSION_NAME:2" -h
tmux split-window -t "$MAS_SESSION_NAME:2.0" -v
tmux split-window -t "$MAS_SESSION_NAME:2.2" -v
start_unit "Unit 1" 2 "10" "11" "12" "13"

# Unit 2 - Window 3 (4エージェント)
tmux split-window -t "$MAS_SESSION_NAME:3" -h
tmux split-window -t "$MAS_SESSION_NAME:3.0" -v
tmux split-window -t "$MAS_SESSION_NAME:3.2" -v
start_unit "Unit 2" 3 "20" "21" "22" "23"

# Unit 3 - Window 4 (4エージェント)
tmux split-window -t "$MAS_SESSION_NAME:4" -h
tmux split-window -t "$MAS_SESSION_NAME:4.0" -v
tmux split-window -t "$MAS_SESSION_NAME:4.2" -v
start_unit "Unit 3" 4 "30" "31" "32" "33"

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