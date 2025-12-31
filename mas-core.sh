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

    # ワークスペースルートはプロジェクトディレクトリ
    # MAS_DATA_DIR は廃止、後方互換性のために空に設定
    MAS_DATA_DIR=""

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
    # MAS_DATA_DIR は廃止、後方互換性のために空に設定
    MAS_DATA_DIR=""
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
    start                   インフラ起動（APIとWebUI）
    stop                    インフラ停止（APIとWebUI）
    send <target> <msg>     エージェントにメッセージを送信（デバッグ用）
    status [--detail]       セッション状態を表示
    help                    このヘルプを表示
    version                 バージョン情報を表示

sendオプション:
    -n, --no-execute        メッセージ送信のみ（Enterを送信しない）
    -e, --execute           メッセージ送信後にEnterを送信（デフォルト）

    注意: Claude Code互換性のため、すべてのメッセージ送信の3秒後に
          自動的に"EOF"が送信されます

例:
    mas init                      # 現在のディレクトリでプロジェクト初期化
    mas start                     # APIとWebUIを起動
    mas stop                      # APIとWebUIを停止

    # WebUI (http://localhost:5173) からセッションを作成・管理

    # デバッグ用（通常はWebUIから操作）
    mas send 00 "Hello"           # Agent 00にメッセージ送信
    mas status --detail           # セッション状態を確認
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

    # プロジェクトディレクトリ構造を作成（.masプレフィックスなし）
    mkdir -p unit workflows sessions templates logs config

    # config.jsonを作成（旧.mas/config.jsonの内容）
    cat > config.json <<EOF
{
  "version": "1.0.0",
  "projectName": "$project_name",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "workspaceRoot": "$PWD"
}
EOF

    # .masrcファイル作成（プロジェクトマーカー、互換性のため維持）
    echo "# MAS Project Configuration" > .masrc
    echo "PROJECT_NAME=\"$project_name\"" >> .masrc
    echo "WORKSPACE_ROOT=\"$PWD\"" >> .masrc

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
    echo "  2. mas start"
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

# startコマンド: インフラ起動（APIとWebUI）
cmd_start() {
    print_info "=== MAS Infrastructure Startup ==="

    # ワークスペースルートを取得
    local workspace_root="${MAS_WORKSPACE_ROOT:-${PROJECT_ROOT:-$PWD}}"

    # 後方互換性チェック: 旧構造の検出
    if [ -d "$HOME/.mas" ] && [ ! -f "$workspace_root/config.json" ]; then
        print_warning "Legacy ~/.mas directory detected. Consider migrating to new structure."
        print_info "Run 'mas init' in your project directory to use the new workspace structure."
    fi

    # ワークスペースが初期化されているか確認
    if [ ! -f "$workspace_root/.masrc" ] && [ ! -f "$workspace_root/config.json" ]; then
        print_error "No MAS project found in current directory."
        print_info "Run 'mas init --name <project-name>' to initialize a project."
        return 1
    fi

    mkdir -p "$workspace_root/logs"

    # APIサーバーを起動
    if [ -d "$SCRIPT_DIR/api" ]; then
        # Check if API is already running
        if [ -f "$workspace_root/api.pid" ]; then
            local api_pid=$(cat "$workspace_root/api.pid")
            if ps -p "$api_pid" > /dev/null 2>&1; then
                print_info "API server is already running (PID: $api_pid)"
            else
                rm -f "$workspace_root/api.pid"
                print_info "Starting API server (port 8765)..."
                cd "$SCRIPT_DIR/api"
                export MAS_WORKSPACE_ROOT="$workspace_root"
                export MAS_PROJECT_ROOT="$workspace_root"
                nohup npm start > "$workspace_root/api.log" 2>&1 &
                local api_pid=$!
                echo "$api_pid" > "$workspace_root/api.pid"
                cd - > /dev/null
            fi
        else
            print_info "Starting API server (port 8765)..."
            cd "$SCRIPT_DIR/api"
            export MAS_WORKSPACE_ROOT="$workspace_root"
            export MAS_PROJECT_ROOT="$workspace_root"
            nohup npm start > "$workspace_root/api.log" 2>&1 &
            local api_pid=$!
            echo "$api_pid" > "$workspace_root/api.pid"
            cd - > /dev/null
        fi
    else
        print_error "API directory not found: $SCRIPT_DIR/api"
        return 1
    fi

    # WebUIを起動
    if [ -d "$SCRIPT_DIR/web" ]; then
        # Check if WebUI is already running
        if [ -f "$workspace_root/web.pid" ]; then
            local web_pid=$(cat "$workspace_root/web.pid")
            if ps -p "$web_pid" > /dev/null 2>&1; then
                print_info "WebUI is already running (PID: $web_pid)"
            else
                rm -f "$workspace_root/web.pid"
                print_info "Starting WebUI (port 5173)..."
                cd "$SCRIPT_DIR/web"
                nohup npm run dev > "$workspace_root/web.log" 2>&1 &
                local web_pid=$!
                echo "$web_pid" > "$workspace_root/web.pid"
                cd - > /dev/null
            fi
        else
            print_info "Starting WebUI (port 5173)..."
            cd "$SCRIPT_DIR/web"
            nohup npm run dev > "$workspace_root/web.log" 2>&1 &
            local web_pid=$!
            echo "$web_pid" > "$workspace_root/web.pid"
            cd - > /dev/null
        fi
    else
        print_error "Web directory not found: $SCRIPT_DIR/web"
        return 1
    fi

    # 起動確認
    sleep 3

    # Check if processes are running
    local api_running=false
    local web_running=false

    if [ -f "$workspace_root/api.pid" ]; then
        local api_pid=$(cat "$workspace_root/api.pid")
        if kill -0 $api_pid 2>/dev/null; then
            api_running=true
        fi
    fi

    if [ -f "$workspace_root/web.pid" ]; then
        local web_pid=$(cat "$workspace_root/web.pid")
        if kill -0 $web_pid 2>/dev/null; then
            web_running=true
        fi
    fi

    if [ "$api_running" = true ] && [ "$web_running" = true ]; then
        print_success "MAS infrastructure is running:"
        print_info "  WebUI: http://localhost:5173"
        print_info "  API:   http://localhost:8765"
        print_info ""
        print_info "Use the WebUI to create and manage sessions."
    else
        print_error "Failed to start infrastructure"
        print_info "Check logs for details:"
        print_info "  API: $workspace_root/api.log"
        print_info "  Web: $workspace_root/web.log"
        return 1
    fi
}

# Legacy startコマンド: セッション開始（廃止予定）

# sendコマンド: メッセージ送信（送信元チェック付き）
cmd_send() {
    # 引数が2つの場合は旧形式（後方互換性）
    if [ $# -eq 2 ] || { [ $# -eq 3 ] && [[ "$3" == "-"* ]]; }; then
        # 旧形式: mas send <target> <message> [options]
        print_warning "警告: 旧形式のコマンドです。新形式を使用してください:"
        print_warning "  mas send <from> <to> <message> [options]"
        local target="$1"
        local message="$2"
        shift 2
    else
        # 新形式: mas send <from> <to> <message> [options]
        local from="$1"
        local target="$2"
        local message="$3"
        shift 3

        # 通信ルールチェック（ライブラリをロード）
        if [ -f "$SCRIPT_DIR/lib/mas-communication-rules.sh" ]; then
            source "$SCRIPT_DIR/lib/mas-communication-rules.sh"

            # 通信が許可されているかチェック
            if ! is_communication_allowed "$from" "$target"; then
                print_communication_error "$from" "$target"
                return 1
            fi

            # 許可された通信の場合、送信元情報をメッセージに追加
            message="[From: Agent $from] $message"
        fi
    fi

    if [ -z "$target" ] || [ -z "$message" ]; then
        print_error "使用方法:"
        print_error "  新形式: mas send <from> <to> <message> [options]"
        print_error "  旧形式: mas send <target> <message> [options]"
        print_error ""
        print_error "例:"
        print_error "  mas send 11 10 \"タスク完了しました\"  # 11→10への送信"
        print_error "  mas send 10 00 \"Unit 1から報告\" # 10→00への送信"
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

    # Claude Code互換性のため、3秒後にEOFを自動送信
    # バックグラウンドで実行して即座に制御を返す
    {
        sleep 3
        route_message "$target" "EOF" "true"
    } &
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

# stopコマンド: インフラ停止（APIとWebUI）
cmd_stop() {
    print_info "Stopping MAS infrastructure..."

    # ワークスペースルートを取得
    local workspace_root="${MAS_WORKSPACE_ROOT:-${PROJECT_ROOT:-$PWD}}"
    local stopped_something=false

    # Stop API server
    if [ -f "$workspace_root/api.pid" ]; then
        local api_pid=$(cat "$workspace_root/api.pid")
        if ps -p "$api_pid" > /dev/null 2>&1; then
            print_info "Stopping API server (PID: $api_pid)..."
            # プロセスグループ全体を終了
            kill -- -$(ps -o pgid= $api_pid | grep -o '[0-9]*') 2>/dev/null || kill "$api_pid" 2>/dev/null || true
            stopped_something=true
        fi
        rm -f "$workspace_root/api.pid"
    fi

    # Stop WebUI
    if [ -f "$workspace_root/web.pid" ]; then
        local web_pid=$(cat "$workspace_root/web.pid")
        if ps -p "$web_pid" > /dev/null 2>&1; then
            print_info "Stopping WebUI (PID: $web_pid)..."
            # プロセスグループ全体を終了
            kill -- -$(ps -o pgid= $web_pid | grep -o '[0-9]*') 2>/dev/null || kill "$web_pid" 2>/dev/null || true
            stopped_something=true
        fi
        rm -f "$workspace_root/web.pid"
    fi

    # 孤立したMAS関連のプロセスをクリーンアップ
    # APIサーバー関連
    local api_pids=$(ps aux | grep -E "node.*$SCRIPT_DIR/api/server" | grep -v grep | awk '{print $2}')
    if [ -n "$api_pids" ]; then
        print_info "Cleaning up orphaned API processes..."
        for pid in $api_pids; do
            kill "$pid" 2>/dev/null || true
        done
        stopped_something=true
    fi

    # WebUI関連（Viteプロセス）
    local web_pids=$(ps aux | grep -E "node.*$SCRIPT_DIR/web.*vite|npm run dev.*$SCRIPT_DIR/web" | grep -v grep | awk '{print $2}')
    if [ -n "$web_pids" ]; then
        print_info "Cleaning up orphaned WebUI processes..."
        for pid in $web_pids; do
            # プロセスグループ全体を終了
            kill -- -$(ps -o pgid= $pid | grep -o '[0-9]*') 2>/dev/null || kill "$pid" 2>/dev/null || true
        done
        stopped_something=true
    fi

    # PIDファイルをクリーンアップ
    rm -f "$workspace_root/api.pid" "$workspace_root/web.pid"

    if [ "$stopped_something" = true ]; then
        # 少し待って確実に終了させる
        sleep 1

        # それでも残っているプロセスを強制終了
        local remaining_pids=$(ps aux | grep -E "node.*$SCRIPT_DIR/(api|web)" | grep -v grep | awk '{print $2}')
        if [ -n "$remaining_pids" ]; then
            print_info "Force stopping remaining processes..."
            for pid in $remaining_pids; do
                kill -9 "$pid" 2>/dev/null || true
            done
        fi

        print_success "MAS infrastructure stopped"
    else
        print_info "No infrastructure processes were running"
    fi

    # Note: Sessions are managed via WebUI and are not affected by this command
}

# attachコマンド: セッションアタッチ
cmd_attach() {
    local window=""

    # オプション解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            -w|--window)
                window="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    # アクティブなセッションを検索
    if ! SESSION_NAME=$(find_active_session); then
        print_error "アクティブなセッションが見つかりません"
        print_info "まず 'mas start' でセッションを開始してください"
        return 1
    fi

    # SESSION_NAMEをエクスポート（モジュールで使用するため）
    export MAS_SESSION_NAME="$SESSION_NAME"

    attach_session "$SESSION_NAME" "$window"
}

# listコマンド: エージェント一覧表示
cmd_list() {
    local unit=""

    # オプション解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--unit)
                unit="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    echo "=== MAS Agent List ==="
    echo ""

    if [ -n "$unit" ]; then
        # 特定ユニットのみ表示
        local agents=$(expand_target "$unit")
        for agent_id in $agents; do
            local name="${AGENT_NAMES[$agent_id]}"
            local model="${AGENT_MODELS[$agent_id]}"
            printf "Unit %s: %-25s (Model: %s)\n" "$agent_id" "$name" "$model"
        done
    else
        # 全エージェント表示
        echo "Meta Unit:"
        printf "  Unit 00: %-25s (Model: %s)\n" "${AGENT_NAMES[00]}" "${AGENT_MODELS[00]}"
        echo ""

        echo "Unit 1:"
        for i in 10 11 12 13; do
            printf "  Unit %s: %-25s (Model: %s)\n" "$i" "${AGENT_NAMES[$i]}" "${AGENT_MODELS[$i]}"
        done
        echo ""

        echo "Unit 2:"
        for i in 20 21 22 23; do
            printf "  Unit %s: %-25s (Model: %s)\n" "$i" "${AGENT_NAMES[$i]}" "${AGENT_MODELS[$i]}"
        done
        echo ""

        echo "Unit 3:"
        for i in 30 31 32 33; do
            printf "  Unit %s: %-25s (Model: %s)\n" "$i" "${AGENT_NAMES[$i]}" "${AGENT_MODELS[$i]}"
        done
    fi
}

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
        attach)
            cmd_attach "$@"
            ;;
        list)
            cmd_list "$@"
            ;;
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