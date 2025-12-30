#!/usr/bin/env bash

# lib/agent.sh - エージェント管理モジュール
# MAS (Multi-Agent System) のエージェントライフサイクル管理

# tmuxモジュールを読み込み（必須）
LIB_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -f "$LIB_DIR/mas-tmux.sh" ]; then
    source "$LIB_DIR/mas-tmux.sh"
fi

# =============================================================================
# エージェント設定
# =============================================================================

# エージェントモデル設定
declare -gA AGENT_MODELS
AGENT_MODELS=(
    ["00"]="opus"   # Meta Manager
    ["10"]="opus"   # Design Manager
    ["11"]="sonnet" # UI Designer
    ["12"]="sonnet" # UX Designer
    ["13"]="sonnet" # Visual Designer
    ["20"]="opus"   # Development Manager
    ["21"]="sonnet" # Frontend Developer
    ["22"]="sonnet" # Backend Developer
    ["23"]="sonnet" # DevOps
    ["30"]="opus"   # Business Manager
    ["31"]="sonnet" # Accounting
    ["32"]="sonnet" # Strategy
    ["33"]="sonnet" # Analytics
)

# エージェント名設定
declare -gA AGENT_NAMES
AGENT_NAMES=(
    ["00"]="Meta Manager"
    ["10"]="Design Manager"
    ["11"]="UI Designer"
    ["12"]="UX Designer"
    ["13"]="Visual Designer"
    ["20"]="Development Manager"
    ["21"]="Frontend Developer"
    ["22"]="Backend Developer"
    ["23"]="DevOps"
    ["30"]="Business Manager"
    ["31"]="Accounting"
    ["32"]="Strategy"
    ["33"]="Analytics"
)

# ユニット設定
declare -gA UNIT_NAMES
UNIT_NAMES=(
    ["meta"]="00"
    ["design"]="10 11 12 13"
    ["development"]="20 21 22 23"
    ["business"]="30 31 32 33"
)

# =============================================================================
# エージェント初期化
# =============================================================================

# エージェントディレクトリを初期化
init_agent_directory() {
    local unit_dir="$1"
    local unit_num="$2"
    local workflows_dir="${3:-$LIB_DIR/../workflows}"

    # ディレクトリ作成
    mkdir -p "$unit_dir/$unit_num"

    # エージェントタイプの判定
    local role_type="worker"
    if [[ "$unit_num" =~ ^[0-3]0$ ]]; then
        role_type="manager"
    fi

    # ワークフロー指示書をコピー
    if [ -f "$workflows_dir/${role_type}_workflow.md" ]; then
        cp "$workflows_dir/${role_type}_workflow.md" "$unit_dir/$unit_num/WORKFLOW_INSTRUCTIONS.md"
    fi

    # READMEを作成
    local agent_name="${AGENT_NAMES[$unit_num]}"
    cat > "$unit_dir/$unit_num/README.md" << EOF
# Unit $unit_num - $agent_name

Role: $role_type
Model: ${AGENT_MODELS[$unit_num]}

## Responsibilities
$(get_agent_responsibilities "$unit_num")
EOF

    return 0
}

# エージェントの責任を取得
get_agent_responsibilities() {
    local unit_num="$1"

    case "$unit_num" in
        "00") echo "- Overall system coordination
- Unit synchronization
- Strategic decision making" ;;
        "10") echo "- Design team management
- Design quality assurance
- Design strategy" ;;
        "11") echo "- User interface design
- Component design
- Visual implementation" ;;
        "12") echo "- User experience design
- User flow optimization
- Usability testing" ;;
        "13") echo "- Visual branding
- Design systems
- Visual assets" ;;
        "20") echo "- Development team management
- Technical architecture
- Code quality" ;;
        "21") echo "- Frontend implementation
- UI component development
- Client-side logic" ;;
        "22") echo "- Backend implementation
- API development
- Server-side logic" ;;
        "23") echo "- Infrastructure management
- CI/CD pipelines
- Deployment automation" ;;
        "30") echo "- Business team management
- Budget oversight
- Business strategy" ;;
        "31") echo "- Financial analysis
- Budget management
- Cost optimization" ;;
        "32") echo "- Business strategy
- Market analysis
- Competitive intelligence" ;;
        "33") echo "- Data analytics
- KPI management
- Performance reporting" ;;
        *) echo "- Undefined role" ;;
    esac
}

# =============================================================================
# エージェント起動
# =============================================================================

# エージェントを起動
start_agent() {
    local session_name="$1"
    local window="$2"
    local pane="$3"
    local unit_num="$4"
    local unit_dir="${5:-./unit}"

    local model="${AGENT_MODELS[$unit_num]}"
    local name="${AGENT_NAMES[$unit_num]}"

    print_info "Starting $name (Unit $unit_num) with model $model"

    # ディレクトリに移動
    send_to_pane "$session_name" "$window" "$pane" "echo '=== Starting $name (Unit $unit_num) with $model ==='"
    sleep 0.3
    send_to_pane "$session_name" "$window" "$pane" "cd $unit_dir/$unit_num"
    sleep 0.3

    # ワークフロー指示確認メッセージ
    send_to_pane "$session_name" "$window" "$pane" \
        "if [ -f WORKFLOW_INSTRUCTIONS.md ]; then echo ''; echo '=== ワークフロー指示書を確認してください ==='; echo 'WORKFLOW_INSTRUCTIONS.mdに役割と責任が記載されています'; echo ''; fi"
    sleep 0.3

    # エージェント環境初期化（mas コマンドを利用可能にする）
    local init_script="${LIB_DIR}/mas-agent_init.sh"
    if [ -f "$init_script" ]; then
        send_to_pane "$session_name" "$window" "$pane" "source $init_script"
        sleep 0.3
    fi

    # claude起動（権限チェックをスキップ）
    send_to_pane "$session_name" "$window" "$pane" "claude --dangerously-skip-permissions --model $model"

    return 0
}

# 全エージェントを起動
start_all_agents() {
    local session_name="$1"
    local unit_dir="${2:-./unit}"

    # Meta Manager (00)
    start_agent "$session_name" "meta" 0 "00" "$unit_dir"

    # Design Unit (10-13)
    start_agent "$session_name" "design" 0 "10" "$unit_dir"
    start_agent "$session_name" "design" 1 "11" "$unit_dir"
    start_agent "$session_name" "design" 2 "12" "$unit_dir"
    start_agent "$session_name" "design" 3 "13" "$unit_dir"

    # Development Unit (20-23)
    start_agent "$session_name" "development" 0 "20" "$unit_dir"
    start_agent "$session_name" "development" 1 "21" "$unit_dir"
    start_agent "$session_name" "development" 2 "22" "$unit_dir"
    start_agent "$session_name" "development" 3 "23" "$unit_dir"

    # Business Unit (30-33)
    start_agent "$session_name" "business" 0 "30" "$unit_dir"
    start_agent "$session_name" "business" 1 "31" "$unit_dir"
    start_agent "$session_name" "business" 2 "32" "$unit_dir"
    start_agent "$session_name" "business" 3 "33" "$unit_dir"

    return 0
}

# =============================================================================
# エージェント停止
# =============================================================================

# エージェントを停止
stop_agent() {
    local session_name="$1"
    local window="$2"
    local pane="$3"

    # Ctrl+C送信
    tmux send-keys -t "$session_name:$window.$pane" C-c
    sleep 0.5
    return 0
}

# 全エージェントを停止
stop_all_agents() {
    local session_name="$1"

    print_info "Stopping all agents..."

    # 各ウィンドウの全ペインに停止シグナル送信
    for window in meta design development business; do
        local max_panes=0
        [ "$window" = "meta" ] && max_panes=1 || max_panes=4

        for ((pane=0; pane<$max_panes; pane++)); do
            stop_agent "$session_name" "$window" "$pane"
        done
    done

    return 0
}

# =============================================================================
# エージェント状態確認
# =============================================================================

# エージェント状態を取得
get_agent_status() {
    local session_name="$1"
    local unit_num="$2"

    local window_pane=$(get_agent_window_pane "$unit_num")
    if [ -z "$window_pane" ]; then
        echo "unknown"
        return 1
    fi

    local window="${window_pane%.*}"
    local pane="${window_pane#*.}"

    local cmd=$(get_pane_info "$session_name" "$window" "$pane" | awk '{print $2}')

    if [ "$cmd" = "clauded" ]; then
        echo "running"
    elif [ -n "$cmd" ]; then
        echo "stopped"
    else
        echo "unknown"
    fi
}

# 全エージェントの状態を取得
get_all_agent_status() {
    local session_name="$1"

    for unit_num in 00 10 11 12 13 20 21 22 23 30 31 32 33; do
        local status=$(get_agent_status "$session_name" "$unit_num")
        local name="${AGENT_NAMES[$unit_num]}"
        printf "  Unit %s %-25s: %s\n" "$unit_num" "($name)" "$status"
    done
}

# =============================================================================
# ユーティリティ関数
# =============================================================================

# ユニット番号からウィンドウ・ペイン番号を取得
get_agent_window_pane() {
    local unit_num="$1"

    case "$unit_num" in
        00) echo "meta.0" ;;
        10) echo "unit1.0" ;;
        11) echo "unit1.1" ;;
        12) echo "unit1.2" ;;
        13) echo "unit1.3" ;;
        20) echo "unit2.0" ;;
        21) echo "unit2.1" ;;
        22) echo "unit2.2" ;;
        23) echo "unit2.3" ;;
        30) echo "unit3.0" ;;
        31) echo "unit3.1" ;;
        32) echo "unit3.2" ;;
        33) echo "unit3.3" ;;
        *) echo "" ;;
    esac
}

# エージェントモデルを取得
get_agent_model() {
    local unit_num="$1"
    echo "${AGENT_MODELS[$unit_num]:-sonnet}"
}

# エージェントがマネージャーかどうか判定
is_manager() {
    local unit_num="$1"
    [[ "$unit_num" =~ ^[0-3]0$ ]]
}

# モジュールロード完了メッセージ（デバッグ用）
if [ "${DEBUG_MODULES:-0}" = "1" ]; then
    print_info "Loaded agent.sh module"
fi