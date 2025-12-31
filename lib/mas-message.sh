#!/usr/bin/env bash

# lib/message.sh - メッセージルーティングモジュール
# MAS (Multi-Agent System) のメッセージ配信管理

# 他のモジュールを読み込み
LIB_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -f "$LIB_DIR/mas-tmux.sh" ]; then
    source "$LIB_DIR/mas-tmux.sh"
fi
if [ -f "$LIB_DIR/mas-agent.sh" ]; then
    source "$LIB_DIR/mas-agent.sh"
fi

# =============================================================================
# メッセージルーティング
# =============================================================================

# メッセージをルーティング
route_message() {
    local target="$1"
    local message="$2"
    local execute="${3:-false}"
    local sender="${4:-}"
    local session_name="${SESSION_NAME:-mas-tmux}"

    # ターゲットを展開
    local expanded_targets=$(expand_target "$target")
    if [ -z "$expanded_targets" ]; then
        print_error "Invalid target: $target"
        return 1
    fi

    # 各ターゲットに送信
    local success_count=0
    local total_count=0

    for agent in $expanded_targets; do
        total_count=$((total_count + 1))
        if [ "$agent" != "$sender" ]; then  # 送信者自身には送らない
            if send_to_agent "$session_name" "$agent" "$message" "$execute"; then
                success_count=$((success_count + 1))
            fi
        else
            print_info "Skipping sender: $agent"
        fi
    done

    print_success "Message sent to $success_count/$total_count agents"
    return 0
}

# ターゲットを展開
expand_target() {
    local target="$1"

    case "$target" in
        # 個別エージェント（00-33）
        [0-3][0-3])
            echo "$target"
            ;;
        # ウィンドウ名（window0-3形式）
        window[0-3])
            local window_num="${target#window}"
            case "$window_num" in
                0) echo "00" ;;
                1) echo "10 11 12 13" ;;
                2) echo "20 21 22 23" ;;
                3) echo "30 31 32 33" ;;
                *) ;;
            esac
            ;;
        # エージェント名（agent-00形式）
        agent-[0-3][0-3])
            echo "${target#agent-}"
            ;;
        # ユニット名
        meta|0)
            echo "00"
            ;;
        design|1)
            echo "10 11 12 13"
            ;;
        development|2)
            echo "20 21 22 23"
            ;;
        business|3)
            echo "30 31 32 33"
            ;;
        # グループ
        managers)
            echo "00 10 20 30"
            ;;
        workers)
            echo "11 12 13 21 22 23 31 32 33"
            ;;
        all)
            echo "00 10 11 12 13 20 21 22 23 30 31 32 33"
            ;;
        # カンマ区切りの複数ターゲット
        *,*)
            local targets=""
            IFS=',' read -ra TARGET_ARRAY <<< "$target"
            for t in "${TARGET_ARRAY[@]}"; do
                local expanded=$(expand_target "$(echo "$t" | xargs)")  # trim spaces
                if [ -n "$expanded" ]; then
                    targets="$targets $expanded"
                fi
            done
            echo "$targets" | xargs  # remove extra spaces
            ;;
        *)
            # 不明なターゲット
            echo ""
            ;;
    esac
}

# =============================================================================
# メッセージ送信
# =============================================================================

# 個別エージェントへメッセージ送信
send_to_agent() {
    local session_name="$1"
    local agent_id="$2"
    local message="$3"
    local execute="$4"

    # ウィンドウとペインを取得
    local window_pane=$(get_agent_window_pane "$agent_id")
    if [ -z "$window_pane" ]; then
        print_error "Invalid agent ID: $agent_id"
        return 1
    fi

    local window="${window_pane%.*}"
    local pane="${window_pane#*.}"

    # メッセージ送信
    if [ "$execute" = "true" ] || [ "$execute" = "1" ]; then
        # メッセージを送信して実行
        send_to_pane "$session_name" "$window" "$pane" "$message"
    else
        # メッセージのみ送信（Enterなし）
        send_keys_to_pane "$session_name" "$window" "$pane" "$message"
    fi

    return $?
}

# ブロードキャストメッセージ
broadcast_message() {
    local message="$1"
    local execute="${2:-false}"
    local exclude="${3:-}"
    local session_name="${SESSION_NAME:-mas-tmux}"

    route_message "all" "$message" "$execute" "$exclude"
}

# ユニット間メッセージ
send_unit_to_unit() {
    local from_unit="$1"
    local to_unit="$2"
    local message="$3"
    local execute="${4:-false}"
    local session_name="${SESSION_NAME:-mas-tmux}"

    # from_unitのマネージャーから送信したことにする
    local sender=$(get_unit_manager "$from_unit")
    if [ -z "$sender" ]; then
        print_error "Invalid from_unit: $from_unit"
        return 1
    fi

    route_message "$to_unit" "$message" "$execute" "$sender"
}

# =============================================================================
# ヘルパー関数
# =============================================================================

# ユニットのマネージャーを取得
get_unit_manager() {
    local unit="$1"

    case "$unit" in
        meta) echo "00" ;;
        design) echo "10" ;;
        development) echo "20" ;;
        business) echo "30" ;;
        *) echo "" ;;
    esac
}

# メッセージをフォーマット
format_message() {
    local sender="$1"
    local target="$2"
    local message="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[${timestamp}] FROM: Unit-${sender} TO: ${target} | ${message}"
}

# プロンプトメッセージを生成
create_prompt_message() {
    local task="$1"
    local context="${2:-}"

    local prompt="タスク: $task"
    if [ -n "$context" ]; then
        prompt="$prompt\nコンテキスト: $context"
    fi
    prompt="$prompt\n実行してください。"

    echo -e "$prompt"
}

# =============================================================================
# バッチメッセージ送信
# =============================================================================

# 複数メッセージを順番に送信
send_batch_messages() {
    local session_name="${1:-$MAS_SESSION_NAME}"
    local target="$2"
    shift 2

    local delay="${BATCH_MESSAGE_DELAY:-1}"

    for message in "$@"; do
        route_message "$target" "$message" "false" "" "$session_name"
        sleep "$delay"
    done
}

# ファイルからメッセージを送信
send_messages_from_file() {
    local file="$1"
    local target="$2"
    local session_name="${3:-$MAS_SESSION_NAME}"

    if [ ! -f "$file" ]; then
        print_error "File not found: $file"
        return 1
    fi

    while IFS= read -r line; do
        if [ -n "$line" ] && [[ ! "$line" =~ ^# ]]; then  # 空行とコメント行をスキップ
            route_message "$target" "$line" "false" "" "$session_name"
            sleep 0.5
        fi
    done < "$file"
}

# =============================================================================
# メッセージ履歴（オプション）
# =============================================================================

# メッセージ履歴を記録
log_message() {
    local target="$1"
    local message="$2"
    local log_file="${MESSAGE_LOG_FILE:-/tmp/mas-messages.log}"

    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] TARGET: $target | MESSAGE: $message" >> "$log_file"
}

# メッセージ履歴を表示
show_message_history() {
    local lines="${1:-20}"
    local log_file="${MESSAGE_LOG_FILE:-/tmp/mas-messages.log}"

    if [ -f "$log_file" ]; then
        tail -n "$lines" "$log_file"
    else
        print_warning "No message history found"
    fi
}

# モジュールロード完了メッセージ（デバッグ用）
if [ "${DEBUG_MODULES:-0}" = "1" ]; then
    print_info "Loaded message.sh module"
fi