#!/usr/bin/env bash

# lib/session.sh - セッション管理モジュール
# MAS (Multi-Agent System) のセッションライフサイクル管理

# 他のモジュールを読み込み
LIB_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -f "$LIB_DIR/tmux.sh" ]; then
    source "$LIB_DIR/tmux.sh"
fi

# =============================================================================
# セッション管理
# =============================================================================

# セッションIDを生成
generate_session_id() {
    local prefix="${1:-mas}"
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local random=$(head -c 4 /dev/urandom | xxd -p)

    echo "${prefix}-${timestamp}-${random}"
}

# セッション名を生成（プロジェクトモード対応）
generate_session_name() {
    local project_name="${1:-}"

    if [ -n "$project_name" ]; then
        # プロジェクト名をサニタイズ
        echo "mas-$(echo "$project_name" | sed 's/[^a-zA-Z0-9_-]/-/g')"
    else
        # デフォルトのセッション名
        echo "mas-tmux"
    fi
}

# セッション情報を保存
save_session_info() {
    local session_name="$1"
    local project_dir="${2:-$PWD}"

    local info_file="$project_dir/.mas_session"

    cat > "$info_file" << EOF
SESSION_NAME=$session_name
STARTED_AT="$(date +"%Y-%m-%d %H:%M:%S")"
PID=$$
PROJECT_DIR=$project_dir
UNIT_DIR=$project_dir/unit
WORKFLOWS_DIR=$project_dir/workflows
EOF

    print_info "Session info saved to $info_file"
    return 0
}

# セッション情報を読み込み
load_session_info() {
    local project_dir="${1:-$PWD}"
    local info_file="$project_dir/.mas_session"

    if [ -f "$info_file" ]; then
        source "$info_file"
        return 0
    else
        return 1
    fi
}

# アクティブなセッションを検索
find_active_session() {
    local project_dir="${1:-$PWD}"

    # まずプロジェクトのセッション情報を確認
    if load_session_info "$project_dir"; then
        if session_exists "$SESSION_NAME"; then
            echo "$SESSION_NAME"
            return 0
        fi
    fi

    # tmuxセッション一覧から検索
    local sessions=$(tmux ls 2>/dev/null | grep "^mas-" | cut -d: -f1)
    if [ -n "$sessions" ]; then
        echo "$sessions" | head -n 1
        return 0
    fi

    return 1
}

# =============================================================================
# HTTPサーバー管理
# =============================================================================

# HTTPサーバーを起動
start_http_server() {
    local session_name="$1"
    local port="${MAS_HTTP_PORT:-8765}"
    local host="${MAS_HTTP_HOST:-0.0.0.0}"
    local project_dir="${2:-$PWD}"

    # PIDファイルをチェック
    local pid_file="$project_dir/.mas_http.pid"
    if [ -f "$pid_file" ]; then
        local old_pid=$(cat "$pid_file")
        if kill -0 "$old_pid" 2>/dev/null; then
            print_warning "HTTP server is already running (PID: $old_pid)"
            return 0
        fi
    fi

    # HTTPサーバー起動
    local server_script="$LIB_DIR/../http_server.js"
    local api_server="$LIB_DIR/../api/server.ts"

    # 新しいAPIサーバーが存在すれば優先
    if [ -f "$api_server" ] && command -v tsx &> /dev/null; then
        print_info "Starting Hono API server on $host:$port..."
        cd "$LIB_DIR/../api" && \
        nohup tsx server.ts > "$project_dir/.mas_api.log" 2>&1 &
        local http_pid=$!
    elif [ -f "$server_script" ] && command -v node &> /dev/null; then
        print_info "Starting HTTP server on $host:$port..."
        nohup node "$server_script" > "$project_dir/.mas_http.log" 2>&1 &
        local http_pid=$!
    else
        print_warning "No HTTP server available"
        return 1
    fi

    # PID保存
    echo "$http_pid" > "$pid_file"
    print_success "HTTP server started (PID: $http_pid, Port: $port)"

    return 0
}

# HTTPサーバーを停止
stop_http_server() {
    local project_dir="${1:-$PWD}"
    local pid_file="$project_dir/.mas_http.pid"

    if [ -f "$pid_file" ]; then
        local http_pid=$(cat "$pid_file")
        if kill -0 "$http_pid" 2>/dev/null; then
            kill "$http_pid"
            print_success "HTTP server stopped (PID: $http_pid)"
        else
            print_warning "HTTP server process not found"
        fi
        rm -f "$pid_file"
    fi

    # ログファイルのクリーンアップ
    rm -f "$project_dir/.mas_http.log" "$project_dir/.mas_api.log"

    return 0
}

# HTTPサーバーの状態を確認
check_http_server() {
    local project_dir="${1:-$PWD}"
    local pid_file="$project_dir/.mas_http.pid"

    if [ -f "$pid_file" ]; then
        local http_pid=$(cat "$pid_file")
        if kill -0 "$http_pid" 2>/dev/null; then
            echo "running"
            return 0
        fi
    fi

    echo "stopped"
    return 1
}

# =============================================================================
# セッション状態管理
# =============================================================================

# セッション状態を取得
get_session_status() {
    local session_name="$1"

    if ! session_exists "$session_name"; then
        echo "stopped"
        return 1
    fi

    # tmuxセッションの詳細を取得
    local window_count=$(tmux list-windows -t "$session_name" 2>/dev/null | wc -l)
    local pane_count=$(tmux list-panes -t "$session_name" 2>/dev/null | wc -l)

    if [ "$window_count" -ge 4 ] && [ "$pane_count" -ge 13 ]; then
        echo "running"
    else
        echo "partial"
    fi

    return 0
}

# セッションの詳細情報を表示
show_session_details() {
    local session_name="$1"
    local project_dir="${2:-$PWD}"

    echo "Session: $session_name"
    echo "Status: $(get_session_status "$session_name")"
    echo ""

    # セッション情報
    if load_session_info "$project_dir"; then
        echo "Started at: $STARTED_AT"
        echo "Project directory: $PROJECT_DIR"
        echo ""
    fi

    # HTTPサーバー状態
    echo "HTTP Server: $(check_http_server "$project_dir")"
    if [ -f "$project_dir/.mas_http.pid" ]; then
        echo "  PID: $(cat "$project_dir/.mas_http.pid")"
        echo "  Port: ${MAS_HTTP_PORT:-8765}"
    fi
    echo ""

    # ウィンドウ情報
    if session_exists "$session_name"; then
        echo "Windows:"
        tmux list-windows -t "$session_name" 2>/dev/null | sed 's/^/  /'
    fi
}

# =============================================================================
# セッションクリーンアップ
# =============================================================================

# セッションをクリーンアップ
cleanup_session() {
    local session_name="$1"
    local project_dir="${2:-$PWD}"

    print_info "Cleaning up session $session_name..."

    # HTTPサーバー停止
    stop_http_server "$project_dir"

    # tmuxセッション終了
    if session_exists "$session_name"; then
        kill_session "$session_name"
    fi

    # セッション情報削除
    rm -f "$project_dir/.mas_session"

    # 一時ファイルのクリーンアップ
    rm -f "$project_dir/.mas_"*.{pid,log}

    print_success "Session cleanup completed"
    return 0
}

# 古いセッションをクリーンアップ
cleanup_old_sessions() {
    local max_age_hours="${1:-24}"

    # tmuxセッション一覧から古いものを検索
    local sessions=$(tmux ls 2>/dev/null | grep "^mas-" | cut -d: -f1)

    for session in $sessions; do
        # セッション作成時刻を取得（tmuxの場合は推定）
        local created=$(tmux display -p -t "$session" '#{session_created}' 2>/dev/null)
        if [ -n "$created" ]; then
            local now=$(date +%s)
            local age_hours=$(( (now - created) / 3600 ))

            if [ "$age_hours" -gt "$max_age_hours" ]; then
                print_info "Cleaning up old session: $session (age: ${age_hours}h)"
                kill_session "$session"
            fi
        fi
    done
}

# =============================================================================
# 設定ファイルサポート
# =============================================================================

# 設定ファイルからセッションを起動
start_session_from_config() {
    local config_file="$1"
    local session_name="$2"

    if [ ! -f "$config_file" ]; then
        print_error "Config file not found: $config_file"
        return 1
    fi

    # JSON設定を解析（jqが必要）
    if ! command -v jq &> /dev/null; then
        print_error "jq is required to parse config file"
        return 1
    fi

    # セッション作成
    create_session "$session_name"
    create_mas_windows "$session_name"

    # エージェント構成を読み込んで起動
    # （実装は設定ファイルの形式に依存）

    return 0
}

# =============================================================================
# ユーティリティ関数
# =============================================================================

# セッション使用統計を表示
show_session_stats() {
    local session_name="${1:-$SESSION_NAME}"

    if ! session_exists "$session_name"; then
        print_error "Session $session_name does not exist"
        return 1
    fi

    echo "Session Statistics for: $session_name"
    echo "========================="

    # ウィンドウ数
    local window_count=$(tmux list-windows -t "$session_name" 2>/dev/null | wc -l)
    echo "Windows: $window_count"

    # ペイン数
    local pane_count=$(tmux list-panes -t "$session_name" -a 2>/dev/null | wc -l)
    echo "Total panes: $pane_count"

    # アクティブなクライアント数
    local client_count=$(tmux list-clients -t "$session_name" 2>/dev/null | wc -l)
    echo "Active clients: $client_count"

    return 0
}

# モジュールロード完了メッセージ（デバッグ用）
if [ "${DEBUG_MODULES:-0}" = "1" ]; then
    print_info "Loaded session.sh module"
fi