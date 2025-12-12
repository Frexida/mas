#!/usr/bin/env bash

# mas-tmux HTTP Server
# POSTリクエストを受け取ってエージェントにメッセージを送信

set -euo pipefail

# 設定
PORT="${MAS_HTTP_PORT:-8765}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SEND_MESSAGE="$SCRIPT_DIR/send_message.sh"
LOG_FILE="${MAS_HTTP_LOG:-/tmp/mas_http_server.log}"
PID_FILE="${MAS_HTTP_PID:-/tmp/mas_http_server.pid}"

# ログ出力
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

# JSONパース（jqがある場合は使用、なければ簡易パース）
parse_json() {
    local json="$1"
    local key="$2"

    if command -v jq >/dev/null 2>&1; then
        echo "$json" | jq -r ".$key // empty" 2>/dev/null || echo ""
    else
        # 簡易パース（ダブルクォートで囲まれた値を取得）
        echo "$json" | sed -n "s/.*\"$key\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p"
    fi
}

# JSONパース（真偽値対応）
parse_json_bool() {
    local json="$1"
    local key="$2"

    if command -v jq >/dev/null 2>&1; then
        local val=$(echo "$json" | jq -r ".$key // empty" 2>/dev/null || echo "")
        [ "$val" = "true" ] && echo "true" || echo "false"
    else
        # 簡易パース（true/falseを探す）
        if echo "$json" | grep -q "\"$key\"[[:space:]]*:[[:space:]]*true"; then
            echo "true"
        else
            echo "false"
        fi
    fi
}

# HTTPレスポンス送信
send_response() {
    local status="$1"
    local body="$2"
    local content_length="${#body}"

    printf "HTTP/1.1 %s\r\n" "$status"
    printf "Content-Type: application/json\r\n"
    printf "Content-Length: %d\r\n" "$content_length"
    printf "Connection: close\r\n"
    printf "\r\n"
    printf "%s" "$body"
}

# リクエスト処理
handle_request() {
    local request=""
    local content_length=0
    local body=""
    local line=""
    local method=""
    local path=""

    # ヘッダーを読む
    while IFS= read -r line; do
        line="${line%$'\r'}"  # Remove CR if present

        # 最初の行でメソッドとパスを確認
        if [ -z "$request" ]; then
            request="$line"
            method=$(echo "$request" | cut -d' ' -f1)
            path=$(echo "$request" | cut -d' ' -f2)

            if [ "$method" != "POST" ] || [ "$path" != "/message" ]; then
                log "Invalid request: $request"
                send_response "400 Bad Request" '{"error":"Only POST /message is supported"}'
                return
            fi
        fi

        # Content-Lengthを探す
        if [[ "$line" =~ ^Content-Length:[[:space:]]*([0-9]+) ]]; then
            content_length="${BASH_REMATCH[1]}"
        fi

        # 空行でヘッダー終了
        if [ -z "$line" ]; then
            break
        fi
    done

    # ボディを読む
    if [ "$content_length" -gt 0 ]; then
        body=$(head -c "$content_length")
    fi

    log "Request received: $request"
    log "Body: $body"

    # JSONパース
    local target=$(parse_json "$body" "target")
    local message=$(parse_json "$body" "message")
    local execute=$(parse_json_bool "$body" "execute")

    # バリデーション
    if [ -z "$target" ] || [ -z "$message" ]; then
        log "Missing required fields: target=$target, message=$message"
        send_response "400 Bad Request" '{"error":"target and message are required"}'
        return
    fi

    # レスポンスを即座に返す（非同期処理のため）
    local timestamp=$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S%z')
    local response_body=$(cat <<EOF
{
  "status": "acknowledged",
  "message": "Message received and sent to agent",
  "target": "$target",
  "timestamp": "$timestamp"
}
EOF
)

    send_response "200 OK" "$response_body"

    # バックグラウンドでメッセージ送信
    (
        if [ "$execute" = "true" ]; then
            "$SEND_MESSAGE" -t "$target" -e "$message" >> "$LOG_FILE" 2>&1
        else
            "$SEND_MESSAGE" -t "$target" "$message" >> "$LOG_FILE" 2>&1
        fi
        log "Message sent to $target: $message"
    ) &
}

# サーバー起動
start_server() {
    log "Starting HTTP server on port $PORT"
    echo $$ > "$PID_FILE"

    # socatが利用可能か確認
    if command -v socat >/dev/null 2>&1; then
        log "Using socat for HTTP server"
        # socatを使用
        while true; do
            socat TCP-LISTEN:"$PORT",reuseaddr,fork EXEC:"$0 handle"
        done
    elif command -v nc >/dev/null 2>&1; then
        log "Using nc for HTTP server"
        # ncを使用（OpenBSD版とGNU版の両方に対応）
        while true; do
            # ncで接続を待機し、リクエストを処理
            ( handle_request ) | nc -l "$PORT" || nc -l -p "$PORT"
            sleep 0.1
        done
    else
        log "Error: Neither socat nor nc is installed"
        echo "Error: socat or nc (netcat) is required but not installed" >&2
        echo "Install with: nix-env -iA nixpkgs.socat or nix-env -iA nixpkgs.netcat" >&2
        exit 1
    fi
}

# シグナルハンドラー
cleanup() {
    log "Shutting down HTTP server"
    rm -f "$PID_FILE"
    exit 0
}

trap cleanup EXIT SIGINT SIGTERM

# メイン処理
main() {
    # 引数チェック（socat経由で呼ばれた場合）
    if [ "${1:-}" = "handle" ]; then
        handle_request
        exit 0
    fi

    # ログファイル作成
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"

    # send_message.shの存在確認
    if [ ! -f "$SEND_MESSAGE" ]; then
        log "Error: send_message.sh not found at $SEND_MESSAGE"
        echo "Error: send_message.sh not found" >&2
        exit 1
    fi

    # サーバー起動
    start_server
}

main "$@"