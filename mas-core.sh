#!/usr/bin/env bash

# mas_refactored.sh - Multi-Agent System Manager (Refactored)
# モジュール化されたバージョン

set -e  # エラー時に即座に終了

# npm経由でインストールされた場合の処理
if [ -n "$MAS_NPM_VERSION" ] && [ -n "$MAS_HOME" ]; then
    # npm版の設定
    SCRIPT_DIR="$MAS_HOME"
    LIB_DIR="$MAS_HOME/lib"
    VERSION="${MAS_NPM_VERSION}"

    # ユーザーホームにデータディレクトリを作成
    MAS_DATA_DIR="${MAS_DATA_DIR:-$HOME/.mas}"
    if [ ! -d "$MAS_DATA_DIR" ]; then
        mkdir -p "$MAS_DATA_DIR/sessions"
        mkdir -p "$MAS_DATA_DIR/workflows"
        mkdir -p "$MAS_DATA_DIR/unit"
    fi

    # npm版のパスを設定
    export MAS_INSTALL_TYPE="npm"
else
    # 通常のインストール（git cloneなど）
    SCRIPT_PATH="${BASH_SOURCE[0]}"
    if [ -L "$SCRIPT_PATH" ]; then
        SCRIPT_PATH="$(readlink -f "$SCRIPT_PATH")"
    fi
    SCRIPT_DIR="$( cd "$( dirname "$SCRIPT_PATH" )" && pwd )"
    LIB_DIR="$SCRIPT_DIR/lib"
    MAS_DATA_DIR="${MAS_DATA_DIR:-$HOME/.mas}"  # データは ~/.mas に保存
    VERSION="2.1.0-refactored"
    export MAS_INSTALL_TYPE="local"
fi

# セッション名は動的に生成される（UUID ベース）
# SESSION_NAME は cmd_start() で設定

# =============================================================================
# モジュールのロード
# =============================================================================

# 必須モジュールをロード
source "$LIB_DIR/mas-tmux.sh"
source "$LIB_DIR/mas-agent.sh"
source "$LIB_DIR/mas-message.sh"
source "$LIB_DIR/mas-session.sh"

# プロジェクト管理モジュール（オプション）
if [ -f "$LIB_DIR/project.sh" ]; then
    source "$LIB_DIR/project.sh"
fi

# =============================================================================
# ヘルプ関数
# =============================================================================

usage() {
    cat << EOF
mas - Multi-Agent System Manager v${VERSION}

使い方:
    mas <command> [options]

コマンド:
    init [--name <name>]    新しいMASプロジェクトを初期化
    start                   WebUIとAPIサーバーを起動
    stop                    WebUIとAPIサーバーを停止
    send <target> <msg>     エージェントにメッセージを送信
    status [--detail]       セッション状態を表示
    help                    このヘルプを表示
    version                 バージョン情報を表示

sendオプション:
    -n, --no-execute        メッセージ送信のみ（Enterを送信しない）
    -e, --execute           メッセージ送信後にEnterを送信（デフォルト）

例:
    mas init                      # 現在のディレクトリでプロジェクトを初期化
    mas start                     # WebUIとAPIを起動
    mas send 00 "Hello"           # Meta Managerにメッセージ送信して実行
    mas send 00 "Hello" -n        # Meta Managerにメッセージ送信のみ
    mas send design "Task"        # Designユニット全体に送信して実行
    mas send all "Broadcast"      # 全エージェントに送信して実行
    mas status --detail           # 詳細な状態を表示
    mas stop                      # WebUIとAPIを停止
EOF
}

# =============================================================================
# コマンド実装
# =============================================================================

# initコマンド: プロジェクト初期化
cmd_init() {
    local project_name=""

    # オプション解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            --name)
                project_name="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    # プロジェクト名が指定されていない場合は対話的に取得
    if [ -z "$project_name" ]; then
        read -p "プロジェクト名を入力してください: " project_name
    fi

    if [ -z "$project_name" ]; then
        print_error "プロジェクト名が必要です"
        return 1
    fi

    print_info "MASプロジェクト '$project_name' を初期化中..."

    # ディレクトリ作成
    mkdir -p unit workflows .mas

    # .masrcファイル作成（プロジェクトマーカー）
    echo "# MAS Project Configuration" > .masrc
    echo "PROJECT_NAME=\"$project_name\"" >> .masrc

    # プロジェクト設定を保存
    if command -v save_project_config &> /dev/null; then
        save_project_config "$PWD" "$project_name"
    fi

    # unit初期化スクリプトを実行
    if [ -x "$SCRIPT_DIR/init_unit.sh" ]; then
        TARGET_UNIT_DIR="$PWD/unit" \
        TARGET_WORKFLOWS_DIR="$PWD/workflows" \
        "$SCRIPT_DIR/init_unit.sh"
    fi

    print_success "プロジェクト初期化完了"
    echo ""
    echo "次のステップ:"
    echo "  1. cd $PWD"
    echo "  2. mas start  # WebUIとAPIを起動"
}

# 設定ファイルからエージェントを初期化
initialize_agents_from_config() {
    local session_name="$1"
    local config_file="$2"

    # jqがインストールされているか確認
    if ! command -v jq &> /dev/null; then
        print_warning "jqがインストールされていません。エージェント初期化をスキップします。"
        return 1
    fi

    # 設定ファイルの内容を読み込み
    local config=$(cat "$config_file")

    # MAS_SESSION_NAMEをエクスポート（route_messageで使用）
    export MAS_SESSION_NAME="$session_name"

    # metaManagerがある場合
    if echo "$config" | jq -e '.agents.metaManager' > /dev/null 2>&1; then
        local meta_prompt=$(echo "$config" | jq -r '.agents.metaManager.prompt // empty')
        if [ -n "$meta_prompt" ]; then
            print_info "メタマネージャー (00) を初期化中..."
            route_message "00" "$meta_prompt" "true"
            sleep 0.5
        fi
    fi

    # 各ユニットを処理
    local unit_count=$(echo "$config" | jq '.units | length' 2>/dev/null || echo "0")
    for ((i=0; i<unit_count; i++)); do
        # マネージャーのプロンプトを送信
        local manager_id=$(echo "$config" | jq -r ".units[$i].manager.id // empty")
        local manager_prompt=$(echo "$config" | jq -r ".units[$i].manager.prompt // empty")

        if [ -n "$manager_id" ] && [ -n "$manager_prompt" ]; then
            print_info "マネージャー ($manager_id) を初期化中..."
            route_message "$manager_id" "$manager_prompt" "true"
            sleep 0.5
        fi

        # ワーカーのプロンプトを送信
        local worker_count=$(echo "$config" | jq ".units[$i].workers | length" 2>/dev/null || echo "0")
        for ((j=0; j<worker_count; j++)); do
            local worker_id=$(echo "$config" | jq -r ".units[$i].workers[$j].id // empty")
            local worker_prompt=$(echo "$config" | jq -r ".units[$i].workers[$j].prompt // empty")

            if [ -n "$worker_id" ] && [ -n "$worker_prompt" ]; then
                print_info "ワーカー ($worker_id) を初期化中..."
                route_message "$worker_id" "$worker_prompt" "true"
                sleep 0.5
            fi
        done
    done

    print_success "エージェント初期化完了"
}

# startコマンド: セッション開始
cmd_start() {
    print_info "=== MAS WebUI & API 起動 ==="

    # MAS_DATA_DIRを確認
    mkdir -p "$MAS_DATA_DIR"

    # APIサーバーを起動
    if [ -d "$SCRIPT_DIR/api" ]; then
        print_info "APIサーバーを起動中 (port 8765)..."
        cd "$SCRIPT_DIR/api"
        nohup npm start > "$MAS_DATA_DIR/api.log" 2>&1 &
        local api_pid=$!
        echo "$api_pid" > "$MAS_DATA_DIR/api.pid"
        cd - > /dev/null
    else
        print_error "APIディレクトリが見つかりません: $SCRIPT_DIR/api"
        return 1
    fi

    # WebUIを起動
    if [ -d "$SCRIPT_DIR/web" ]; then
        print_info "WebUIを起動中 (port 5173)..."
        cd "$SCRIPT_DIR/web"
        nohup npm run dev > "$MAS_DATA_DIR/web.log" 2>&1 &
        local web_pid=$!
        echo "$web_pid" > "$MAS_DATA_DIR/web.pid"
        cd - > /dev/null
    else
        print_error "Webディレクトリが見つかりません: $SCRIPT_DIR/web"
        return 1
    fi

    # 起動確認
    sleep 3
    if kill -0 $api_pid 2>/dev/null && kill -0 $web_pid 2>/dev/null; then
        print_success "MAS環境が起動しました:"
        print_info "  WebUI: http://localhost:5173"
        print_info "  API:   http://localhost:8765"
    else
        print_error "起動に失敗しました"
        print_info "詳細はログを確認してください:"
        print_info "  API: $MAS_DATA_DIR/api.log"
        print_info "  Web: $MAS_DATA_DIR/web.log"
    fi
}

# sendコマンド: メッセージ送信
cmd_send() {
    local target="$1"
    local message="$2"
    shift 2

    if [ -z "$target" ] || [ -z "$message" ]; then
        print_error "使用方法: mas send <target> <message> [-n|--no-execute]"
        return 1
    fi

    # オプション解析
    # デフォルトで実行する（execute=true）
    local execute=true
    while [[ $# -gt 0 ]]; do
        case $1 in
            -n|--no-execute)
                # 実行しない場合のオプション
                execute=false
                shift
                ;;
            -e|--execute)
                # 後方互換性のため残す
                execute=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    # セッションの優先順位:
    # 1. 現在のtmuxセッション（tmux内で実行している場合）
    # 2. MAS_SESSION_NAME環境変数
    # 3. find_active_sessionで検索

    if [ -n "$TMUX" ]; then
        # tmux内で実行されている場合、現在のセッションを最優先
        local current_session=$(tmux display-message -p '#S' 2>/dev/null)
        if [ -n "$current_session" ] && [[ "$current_session" == mas-* ]]; then
            SESSION_NAME="$current_session"
            # デバッグ情報（必要に応じてコメントアウト）
            # print_info "現在のtmuxセッションを使用: $SESSION_NAME"
        else
            # masセッションではない場合、環境変数またはfind_active_sessionを使用
            if [ -n "$MAS_SESSION_NAME" ]; then
                SESSION_NAME="$MAS_SESSION_NAME"
            else
                SESSION_NAME=$(find_active_session)
                if [ $? -ne 0 ] || [ -z "$SESSION_NAME" ]; then
                    print_error "アクティブなMASセッションが見つかりません"
                    print_info "まず 'mas start' でセッションを開始してください"
                    return 1
                fi
            fi
        fi
    elif [ -n "$MAS_SESSION_NAME" ]; then
        # tmux外から実行され、環境変数が設定されている場合
        SESSION_NAME="$MAS_SESSION_NAME"
    else
        # tmux外から実行され、環境変数もない場合、アクティブなセッションを検索
        SESSION_NAME=$(find_active_session)
        if [ $? -ne 0 ] || [ -z "$SESSION_NAME" ]; then
            print_error "アクティブなセッションが見つかりません"
            print_info "まず 'mas start' でセッションを開始してください"
            return 1
        fi
    fi

    # SESSION_NAMEをエクスポート（モジュールで使用するため）
    export MAS_SESSION_NAME="$SESSION_NAME"

    # メッセージ送信
    route_message "$target" "$message" "$execute"
}

# statusコマンド: 状態表示
cmd_status() {
    local detail=false

    # オプション解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            --detail)
                detail=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    # アクティブなセッションを検索
    if ! SESSION_NAME=$(find_active_session); then
        print_info "アクティブなセッションがありません"
        return 0
    fi

    # SESSION_NAMEをエクスポート（モジュールで使用するため）
    export MAS_SESSION_NAME="$SESSION_NAME"

    if [ "$detail" = true ]; then
        show_session_details "$SESSION_NAME"
        echo ""
        echo "エージェント状態:"
        get_all_agent_status "$SESSION_NAME"
    else
        echo "Session: $SESSION_NAME"
        echo "Status: $(get_session_status "$SESSION_NAME")"
        echo "HTTP Server: $(check_http_server)"
    fi
}

# stopコマンド: API & WebUI停止
cmd_stop() {
    print_info "MAS WebUI & APIを停止中..."

    # APIサーバーを停止
    if [ -f "$MAS_DATA_DIR/api.pid" ]; then
        local api_pid=$(cat "$MAS_DATA_DIR/api.pid")
        if ps -p "$api_pid" > /dev/null 2>&1; then
            print_info "APIサーバーを停止中..."
            kill "$api_pid" 2>/dev/null || true
        fi
        rm -f "$MAS_DATA_DIR/api.pid"
    fi

    # WebUIを停止
    if [ -f "$MAS_DATA_DIR/web.pid" ]; then
        local web_pid=$(cat "$MAS_DATA_DIR/web.pid")
        if ps -p "$web_pid" > /dev/null 2>&1; then
            print_info "WebUIを停止中..."
            kill "$web_pid" 2>/dev/null || true
        fi
        rm -f "$MAS_DATA_DIR/web.pid"
    fi

    print_success "MAS WebUI & APIを停止しました"
}

# attachコマンド: セッションアタッチ (tmux用 - 現在は使用しない)
# # cmd_attach() {
#     local window=""
# 
#     # オプション解析
#     while [[ $# -gt 0 ]]; do
#         case $1 in
#             -w|--window)
#                 window="$2"
#                 shift 2
#                 ;;
#             *)
#                 shift
#                 ;;
#         esac
#     done
# 
#     # アクティブなセッションを検索
#     if ! SESSION_NAME=$(find_active_session); then
#         print_error "アクティブなセッションが見つかりません"
#         print_info "まず 'mas start' でセッションを開始してください"
#         return 1
#     fi
# 
#     # SESSION_NAMEをエクスポート（モジュールで使用するため）
#     export MAS_SESSION_NAME="$SESSION_NAME"
# 
#     attach_session "$SESSION_NAME" "$window"
# }
# 
# # listコマンド: エージェント一覧表示
# cmd_list() {
#     local unit=""
# 
#     # オプション解析
#     while [[ $# -gt 0 ]]; do
#         case $1 in
#             -u|--unit)
#                 unit="$2"
#                 shift 2
#                 ;;
#             *)
#                 shift
#                 ;;
#         esac
#     done
# 
#     echo "=== MAS Agent List ==="
#     echo ""
# 
#     if [ -n "$unit" ]; then
#         # 特定ユニットのみ表示
#         local agents=$(expand_target "$unit")
#         for agent_id in $agents; do
#             local name="${AGENT_NAMES[$agent_id]}"
#             local model="${AGENT_MODELS[$agent_id]}"
#             printf "Unit %s: %-25s (Model: %s)\n" "$agent_id" "$name" "$model"
#         done
#     else
#         # 全エージェント表示
#         echo "Meta Unit:"
#         printf "  Unit 00: %-25s (Model: %s)\n" "${AGENT_NAMES[00]}" "${AGENT_MODELS[00]}"
#         echo ""
# 
#         echo "Design Unit:"
#         for i in 10 11 12 13; do
#             printf "  Unit %s: %-25s (Model: %s)\n" "$i" "${AGENT_NAMES[$i]}" "${AGENT_MODELS[$i]}"
#         done
#         echo ""
# 
#         echo "Development Unit:"
#         for i in 20 21 22 23; do
#             printf "  Unit %s: %-25s (Model: %s)\n" "$i" "${AGENT_NAMES[$i]}" "${AGENT_MODELS[$i]}"
#         done
#         echo ""
# 
#         echo "Business Unit:"
#         for i in 30 31 32 33; do
#             printf "  Unit %s: %-25s (Model: %s)\n" "$i" "${AGENT_NAMES[$i]}" "${AGENT_MODELS[$i]}"
#         done
#     fi
# }
# 
# helpコマンド: ヘルプ表示
cmd_help() {
    usage
}

# versionコマンド: バージョン表示
cmd_version() {
    echo "mas version $VERSION"
}

# =============================================================================
# メイン処理
# =============================================================================

main() {
    local cmd="${1:-}"

    # コマンドがない場合はヘルプを表示
    if [ -z "$cmd" ]; then
        usage
        exit 0
    fi

    shift || true

    # コマンド実行
    case "$cmd" in
        init)
            cmd_init "$@"
            ;;
        start)
            cmd_start "$@"
            ;;
        send)
            cmd_send "$@"
            ;;
        status)
            cmd_status "$@"
            ;;
        stop)
            cmd_stop "$@"
            ;;
        # attach)
        #     cmd_attach "$@"
        #     ;;
        # list)
        #     cmd_list "$@"
        #     ;;
        help)
            cmd_help
            ;;
        version)
            cmd_version
            ;;
        *)
            print_error "不明なコマンド: $cmd"
            usage
            exit 1
            ;;
    esac
}

# スクリプト実行
main "$@"