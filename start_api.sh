#!/usr/bin/env bash

# start_api.sh - MAS API Server Startup Script

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 環境変数設定
export MAS_API_PORT="${MAS_API_PORT:-8765}"
export MAS_API_HOST="${MAS_API_HOST:-0.0.0.0}"
export NODE_ENV="${NODE_ENV:-production}"

# PIDファイル
PID_FILE="$SCRIPT_DIR/.mas_api.pid"

# 色付きメッセージ
print_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

# 既存のプロセスチェック
check_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# APIサーバー起動
start_server() {
    if check_running; then
        print_error "API server is already running (PID: $(cat "$PID_FILE"))"
        exit 1
    fi

    print_info "Starting MAS API Server..."
    print_info "  Host: $MAS_API_HOST"
    print_info "  Port: $MAS_API_PORT"

    # Node.jsが利用可能か確認
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi

    # APIディレクトリに移動
    cd "$SCRIPT_DIR/api"

    # 依存関係をインストール（初回のみ）
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        npm install
    fi

    # npx tsx を使用して起動
    print_info "Starting with npx tsx..."
    nohup npx tsx server.ts > "$SCRIPT_DIR/.mas_api.log" 2>&1 &

    local pid=$!
    echo "$pid" > "$PID_FILE"

    # 起動確認（3秒待機）
    sleep 3
    if kill -0 "$pid" 2>/dev/null; then
        print_success "API server started successfully (PID: $pid)"
        print_info "Logs: $SCRIPT_DIR/.mas_api.log"
        print_info "Health check: curl http://$MAS_API_HOST:$MAS_API_PORT/health"
    else
        print_error "Failed to start API server"
        rm -f "$PID_FILE"
        exit 1
    fi
}

# APIサーバー停止
stop_server() {
    if ! check_running; then
        print_info "API server is not running"
        return 0
    fi

    local pid=$(cat "$PID_FILE")
    print_info "Stopping API server (PID: $pid)..."

    kill "$pid"
    rm -f "$PID_FILE"

    print_success "API server stopped"
}

# ステータス表示
show_status() {
    if check_running; then
        local pid=$(cat "$PID_FILE")
        print_success "API server is running (PID: $pid)"

        # ヘルスチェック
        if command -v curl &> /dev/null; then
            echo ""
            print_info "Health check:"
            curl -s "http://$MAS_API_HOST:$MAS_API_PORT/health" | python3 -m json.tool 2>/dev/null || echo "Failed to get health status"
        fi
    else
        print_info "API server is not running"
    fi
}

# メイン処理
case "${1:-}" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        stop_server
        sleep 2
        start_server
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac