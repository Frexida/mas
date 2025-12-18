#!/usr/bin/env bash

# lib/session.sh - セッション管理モジュール
# MAS (Multi-Agent System) のセッションライフサイクル管理

# 他のモジュールを読み込み
LIB_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -f "$LIB_DIR/mas-tmux.sh" ]; then
    source "$LIB_DIR/mas-tmux.sh"
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

# Legacy function - removed (use create_session_metadata instead)

# Legacy function - removed (use load_session_metadata instead)

# アクティブなセッションを検索
find_active_session() {
    # 環境変数が設定されている場合は、それを優先
    if [ -n "$MAS_SESSION_NAME" ]; then
        if tmux has-session -t "$MAS_SESSION_NAME" 2>/dev/null; then
            echo "$MAS_SESSION_NAME"
            return 0
        fi
    fi

    # アタッチされているセッションを探す
    local attached_session=$(tmux ls 2>/dev/null | grep "^mas-.*attached" | cut -d: -f1 | head -n 1)
    if [ -n "$attached_session" ]; then
        echo "$attached_session"
        return 0
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

    # Legacy .mas_session file removed - no longer needed

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
    local session_name="${1:-$MAS_SESSION_NAME}"

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

# =============================================================================
# Session Workspace Isolation Functions
# =============================================================================

# Generate a full UUID v4
generate_uuid() {
    if [ -f /proc/sys/kernel/random/uuid ]; then
        cat /proc/sys/kernel/random/uuid
    else
        # Fallback method using /dev/urandom
        local uuid=""
        local bytes=$(head -c 16 /dev/urandom | xxd -p)

        # Format as UUID v4
        uuid="${bytes:0:8}-${bytes:8:4}-4${bytes:13:3}-"
        uuid="${uuid}$(printf '%x' $((0x8 | 0x$(echo ${bytes:16:1} | xxd -p))))"
        uuid="${uuid}${bytes:17:3}-${bytes:20:12}"

        echo "$uuid"
    fi
}

# Create an isolated session workspace
create_session_workspace() {
    local session_id="$1"
    local config_file="${2:-}"
    local mas_root="${MAS_ROOT:-$SCRIPT_DIR}"

    # Create session directory structure
    local session_dir="$mas_root/sessions/$session_id"

    if [ -d "$session_dir" ]; then
        print_error "Session workspace already exists: $session_dir" >&2
        return 1
    fi

    print_info "Creating session workspace: $session_dir" >&2

    # Create directories
    mkdir -p "$session_dir"/{unit,workflows,logs}

    # Save config if provided
    if [ -n "$config_file" ] && [ -f "$config_file" ]; then
        cp "$config_file" "$session_dir/config.json"
    fi

    echo "$session_dir"
    return 0
}

# Initialize session units from templates
initialize_session_units() {
    local session_dir="$1"
    local mas_root="${MAS_ROOT:-$SCRIPT_DIR}"
    local template_unit_dir="$mas_root/unit"
    local template_workflows_dir="$mas_root/workflows"

    if [ ! -d "$session_dir" ]; then
        print_error "Session directory does not exist: $session_dir" >&2
        return 1
    fi

    print_info "Initializing session units from templates..." >&2

    # Create unit directory if it doesn't exist
    mkdir -p "$session_dir/unit"

    # Copy unit directories
    for unit_num in 00 10 11 12 13 20 21 22 23 30 31 32 33; do
        if [ -d "$template_unit_dir/$unit_num" ]; then
            print_info "  Copying unit $unit_num..." >&2
            cp -r "$template_unit_dir/$unit_num" "$session_dir/unit/"
        fi
    done

    # Copy workflow files
    if [ -d "$template_workflows_dir" ]; then
        print_info "  Copying workflows..." >&2
        mkdir -p "$session_dir/workflows"
        cp -r "$template_workflows_dir"/* "$session_dir/workflows/" 2>/dev/null || true
    fi

    return 0
}

# Create session metadata file
create_session_metadata() {
    local session_id="$1"
    local session_dir="$2"
    local tmux_session="${3:-mas-${session_id:0:8}}"
    local status="${4:-active}"

    local metadata_file="$session_dir/.session"

    cat > "$metadata_file" << EOF
SESSION_ID=$session_id
TMUX_SESSION=$tmux_session
STATUS=$status
CREATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
UNIT_DIR=$session_dir/unit
WORKFLOWS_DIR=$session_dir/workflows
SESSION_DIR=$session_dir
EOF

    return 0
}

# Load session metadata
load_session_metadata() {
    local session_id="$1"
    local mas_root="${MAS_ROOT:-$SCRIPT_DIR}"
    local session_dir="$mas_root/sessions/$session_id"
    local metadata_file="$session_dir/.session"

    if [ ! -f "$metadata_file" ]; then
        print_error "Session metadata not found: $metadata_file"
        return 1
    fi

    source "$metadata_file"
    export SESSION_ID TMUX_SESSION STATUS CREATED_AT UNIT_DIR WORKFLOWS_DIR SESSION_DIR

    return 0
}

# Update sessions index
update_sessions_index() {
    local action="$1"  # add, update, remove
    local session_id="$2"
    local mas_root="${MAS_ROOT:-$SCRIPT_DIR}"
    local index_file="$mas_root/sessions/.sessions.index"

    # Ensure jq is available
    if ! command -v jq &> /dev/null; then
        print_warning "jq not found, sessions index not updated"
        return 1
    fi

    local temp_file="${index_file}.tmp"

    case "$action" in
        add)
            local session_dir="$mas_root/sessions/$session_id"
            local tmux_session="mas-${session_id:0:8}"
            local status="${3:-active}"

            if [ ! -f "$index_file" ]; then
                echo '{"version":"1.0","sessions":[],"lastUpdated":""}' > "$index_file"
            fi

            jq --arg id "$session_id" \
               --arg tmux "$tmux_session" \
               --arg status "$status" \
               --arg created "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
               --arg dir "$session_dir" \
               --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
               '.sessions += [{
                   sessionId: $id,
                   tmuxSession: $tmux,
                   status: $status,
                   createdAt: $created,
                   workingDir: $dir
               }] | .lastUpdated = $updated' \
               "$index_file" > "$temp_file" && mv "$temp_file" "$index_file"
            ;;

        update)
            local field="$3"
            local value="$4"

            jq --arg id "$session_id" \
               --arg field "$field" \
               --arg value "$value" \
               --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
               '(.sessions[] | select(.sessionId == $id) | .[$field]) = $value |
                .lastUpdated = $updated' \
               "$index_file" > "$temp_file" && mv "$temp_file" "$index_file"
            ;;

        remove)
            jq --arg id "$session_id" \
               --arg updated "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
               '.sessions = [.sessions[] | select(.sessionId != $id)] |
                .lastUpdated = $updated' \
               "$index_file" > "$temp_file" && mv "$temp_file" "$index_file"
            ;;
    esac

    return 0
}

# Find session by ID
find_session_by_id() {
    local session_id="$1"
    local mas_root="${MAS_ROOT:-$SCRIPT_DIR}"
    local session_dir="$mas_root/sessions/$session_id"

    if [ -d "$session_dir" ] && [ -f "$session_dir/.session" ]; then
        echo "$session_dir"
        return 0
    fi

    return 1
}

# Stop isolated session
stop_isolated_session() {
    local session_id="$1"
    local mas_root="${MAS_ROOT:-$SCRIPT_DIR}"
    local session_dir="$mas_root/sessions/$session_id"

    if [ ! -d "$session_dir" ]; then
        print_error "Session not found: $session_id"
        return 1
    fi

    # Load session metadata
    if [ -f "$session_dir/.session" ]; then
        source "$session_dir/.session"
    fi

    print_info "Stopping isolated session: $session_id"

    # Kill tmux session if exists
    if [ -n "$TMUX_SESSION" ] && session_exists "$TMUX_SESSION"; then
        kill_session "$TMUX_SESSION"
    fi

    # Update session status
    sed -i 's/^STATUS=.*/STATUS=stopped/' "$session_dir/.session"

    # Update sessions index
    update_sessions_index "update" "$session_id" "status" "stopped"

    print_success "Session stopped: $session_id"
    return 0
}

# モジュールロード完了メッセージ（デバッグ用）
if [ "${DEBUG_MODULES:-0}" = "1" ]; then
    print_info "Loaded session.sh module"
fi