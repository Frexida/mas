#!/bin/bash

# MAS エンドツーエンド統合テストスクリプト
# HTTPサーバー → メッセージ送信 → tmux配信の完全なフローをテスト

set -uo pipefail

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# テスト設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAS_CMD="${SCRIPT_DIR}/mas.sh"
HTTP_PORT="${MAS_HTTP_PORT:-8765}"
BASE_URL="http://localhost:${HTTP_PORT}"
TEST_SESSION="mas-test-e2e"
TEST_RESULTS=()
FAILED_TESTS=0
PASSED_TESTS=0

# ログ出力
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

# テスト結果記録
record_test() {
    local test_name="$1"
    local result="$2"
    local details="${3:-}"

    TEST_RESULTS+=("${test_name}:${result}:${details}")

    if [ "$result" = "PASS" ]; then
        ((PASSED_TESTS++))
        echo -e "${GREEN}✓${NC} ${test_name}"
        if [ -n "$details" ]; then
            echo "  └─ ${details}"
        fi
    else
        ((FAILED_TESTS++))
        echo -e "${RED}✗${NC} ${test_name}"
        if [ -n "$details" ]; then
            echo "  └─ ${details}"
        fi
    fi
}

# テスト用tmuxセッションのセットアップ
setup_test_session() {
    log_info "テスト用tmuxセッションをセットアップ中..."

    # 既存のテストセッションを削除
    if tmux has-session -t "$TEST_SESSION" 2>/dev/null; then
        tmux kill-session -t "$TEST_SESSION" 2>/dev/null || true
    fi

    # テスト用セッション作成
    tmux new-session -d -s "$TEST_SESSION" -n "test"

    # ログファイルを作成して監視用にtail
    local log_file="/tmp/mas-test-e2e.log"
    > "$log_file"
    tmux send-keys -t "$TEST_SESSION:test" "tail -f $log_file" C-m

    log_info "テストセッション '$TEST_SESSION' を作成しました"
    return 0
}

# テストセッションのクリーンアップ
cleanup_test_session() {
    log_info "テストセッションをクリーンアップ中..."

    if tmux has-session -t "$TEST_SESSION" 2>/dev/null; then
        tmux kill-session -t "$TEST_SESSION" 2>/dev/null || true
    fi

    rm -f /tmp/mas-test-e2e.log
    rm -f /tmp/mas-test-*.tmp
}

# MASシステムの起動確認
check_mas_system() {
    log_info "MASシステムの状態を確認中..."

    # mas-tmuxセッションの確認
    if ! tmux has-session -t "mas-tmux" 2>/dev/null; then
        log_warning "mas-tmuxセッションが存在しません"
        log_info "MASシステムを起動してください: ./mas.sh start"
        return 1
    fi

    # HTTPサーバーの確認
    if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" >/dev/null 2>&1; then
        log_warning "HTTPサーバーが起動していません (port: ${HTTP_PORT})"
        log_info "HTTPサーバーを起動してください"
        return 1
    fi

    log_info "MASシステムは正常に動作しています"
    return 0
}

# テスト1: 基本的なHTTP→tmuxフロー
test_basic_flow() {
    local test_name="基本的なHTTP→tmuxフロー"
    log_test "$test_name"

    # テスト用メッセージ
    local test_id="$(date +%s)"
    local test_msg="E2Eテスト_${test_id}"

    # HTTPリクエスト送信
    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d "{\"target\":\"00\",\"message\":\"${test_msg}\"}" \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    if [ "$http_code" != "200" ]; then
        record_test "$test_name" "FAIL" "HTTPレスポンス: ${http_code}"
        return
    fi

    # レスポンス検証
    if ! echo "$body" | grep -q '"status":"acknowledged"'; then
        record_test "$test_name" "FAIL" "不正なレスポンス: ${body}"
        return
    fi

    # tmuxペインでメッセージが表示されるまで待機
    sleep 1

    # tmuxペインの内容を確認
    local pane_content=$(tmux capture-pane -t "mas-tmux:meta.0" -p 2>/dev/null || echo "")

    if echo "$pane_content" | grep -q "$test_msg"; then
        record_test "$test_name" "PASS" "メッセージがtmuxに配信されました"
    else
        record_test "$test_name" "FAIL" "メッセージがtmuxに表示されません"
    fi
}

# テスト2: 複数エージェントへの同時配信
test_multi_agent_delivery() {
    local test_name="複数エージェントへの同時配信"
    log_test "$test_name"

    local test_id="$(date +%s)"
    local test_msg="マルチ配信テスト_${test_id}"

    # デザインユニット全体に送信
    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d "{\"target\":\"design\",\"message\":\"${test_msg}\"}" \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" != "200" ]; then
        record_test "$test_name" "FAIL" "HTTPレスポンス: ${http_code}"
        return
    fi

    sleep 1

    # 各デザインエージェントのペインを確認
    local all_delivered=true
    local delivered_count=0

    for pane in 0 1 2 3; do
        local pane_content=$(tmux capture-pane -t "mas-tmux:design.${pane}" -p 2>/dev/null || echo "")
        if echo "$pane_content" | grep -q "$test_msg"; then
            ((delivered_count++))
        else
            all_delivered=false
        fi
    done

    if [ "$all_delivered" = true ]; then
        record_test "$test_name" "PASS" "全4エージェントに配信成功"
    else
        record_test "$test_name" "FAIL" "${delivered_count}/4 エージェントに配信"
    fi
}

# テスト3: executeフラグでの実行テスト
test_execute_flag_e2e() {
    local test_name="executeフラグでの実行"
    log_test "$test_name"

    # テスト用のechoコマンドを送信
    local test_id="$(date +%s)"
    local test_cmd="echo 'EXEC_TEST_${test_id}'"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d "{\"target\":\"00\",\"message\":\"${test_cmd}\",\"execute\":true}" \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" != "200" ]; then
        record_test "$test_name" "FAIL" "HTTPレスポンス: ${http_code}"
        return
    fi

    # コマンド実行を待つ
    sleep 2

    # 実行結果を確認
    local pane_content=$(tmux capture-pane -t "mas-tmux:meta.0" -p 2>/dev/null || echo "")

    if echo "$pane_content" | grep -q "EXEC_TEST_${test_id}"; then
        record_test "$test_name" "PASS" "コマンドが実行されました"
    else
        record_test "$test_name" "FAIL" "コマンドの実行結果が確認できません"
    fi
}

# テスト4: マネージャーグループへの配信
test_managers_group_e2e() {
    local test_name="マネージャーグループへの配信"
    log_test "$test_name"

    local test_id="$(date +%s)"
    local test_msg="マネージャー会議_${test_id}"

    # マネージャーグループに送信
    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d "{\"target\":\"managers\",\"message\":\"${test_msg}\"}" \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" != "200" ]; then
        record_test "$test_name" "FAIL" "HTTPレスポンス: ${http_code}"
        return
    fi

    sleep 1

    # 各マネージャーのペインを確認
    local managers_checked=0
    local managers_received=0

    # メタマネージャー (00)
    local pane_content=$(tmux capture-pane -t "mas-tmux:meta.0" -p 2>/dev/null || echo "")
    ((managers_checked++))
    if echo "$pane_content" | grep -q "$test_msg"; then
        ((managers_received++))
    fi

    # デザインマネージャー (10)
    pane_content=$(tmux capture-pane -t "mas-tmux:design.0" -p 2>/dev/null || echo "")
    ((managers_checked++))
    if echo "$pane_content" | grep -q "$test_msg"; then
        ((managers_received++))
    fi

    # 開発マネージャー (20)
    pane_content=$(tmux capture-pane -t "mas-tmux:development.0" -p 2>/dev/null || echo "")
    ((managers_checked++))
    if echo "$pane_content" | grep -q "$test_msg"; then
        ((managers_received++))
    fi

    # ビジネスマネージャー (30)
    pane_content=$(tmux capture-pane -t "mas-tmux:business.0" -p 2>/dev/null || echo "")
    ((managers_checked++))
    if echo "$pane_content" | grep -q "$test_msg"; then
        ((managers_received++))
    fi

    if [ "$managers_received" -eq 4 ]; then
        record_test "$test_name" "PASS" "全4マネージャーに配信成功"
    else
        record_test "$test_name" "FAIL" "${managers_received}/4 マネージャーに配信"
    fi
}

# テスト5: 並行リクエスト処理
test_concurrent_requests() {
    local test_name="並行リクエスト処理"
    log_test "$test_name"

    local test_id="$(date +%s)"
    local pids=()

    # 5つの並行リクエストを送信
    for i in {1..5}; do
        (
            curl -s -X POST "$BASE_URL/message" \
                -H "Content-Type: application/json" \
                -d "{\"target\":\"00\",\"message\":\"並行テスト_${test_id}_${i}\"}" \
                >/dev/null 2>&1
        ) &
        pids+=($!)
    done

    # すべてのリクエストが完了するまで待機
    local all_success=true
    for pid in "${pids[@]}"; do
        if ! wait $pid; then
            all_success=false
        fi
    done

    if [ "$all_success" = true ]; then
        sleep 2

        # メッセージがすべて配信されたか確認
        local pane_content=$(tmux capture-pane -t "mas-tmux:meta.0" -p 2>/dev/null || echo "")
        local delivered_count=0

        for i in {1..5}; do
            if echo "$pane_content" | grep -q "並行テスト_${test_id}_${i}"; then
                ((delivered_count++))
            fi
        done

        if [ "$delivered_count" -eq 5 ]; then
            record_test "$test_name" "PASS" "5つの並行リクエストすべて成功"
        else
            record_test "$test_name" "FAIL" "${delivered_count}/5 メッセージが配信"
        fi
    else
        record_test "$test_name" "FAIL" "並行リクエストの送信に失敗"
    fi
}

# テスト6: レスポンスタイムの測定
test_response_time() {
    local test_name="レスポンスタイム測定"
    log_test "$test_name"

    local total_time=0
    local request_count=10
    local max_time=0
    local min_time=999999

    for i in $(seq 1 $request_count); do
        local start_time=$(date +%s%N)

        curl -s -X POST "$BASE_URL/message" \
            -H "Content-Type: application/json" \
            -d "{\"target\":\"00\",\"message\":\"性能テスト_${i}\"}" \
            >/dev/null 2>&1

        local end_time=$(date +%s%N)
        local elapsed=$((($end_time - $start_time) / 1000000)) # ミリ秒に変換

        total_time=$((total_time + elapsed))

        if [ $elapsed -gt $max_time ]; then
            max_time=$elapsed
        fi

        if [ $elapsed -lt $min_time ]; then
            min_time=$elapsed
        fi
    done

    local avg_time=$((total_time / request_count))

    # 平均レスポンスタイムが100ms以下なら合格
    if [ $avg_time -le 100 ]; then
        record_test "$test_name" "PASS" "平均: ${avg_time}ms, 最小: ${min_time}ms, 最大: ${max_time}ms"
    else
        record_test "$test_name" "FAIL" "平均レスポンスタイムが遅い: ${avg_time}ms"
    fi
}

# テスト7: システム再起動後の動作確認
test_system_restart() {
    local test_name="システム再起動後の動作"
    log_test "$test_name"

    log_info "HTTPサーバーを再起動中..."

    # 現在のHTTPサーバーのPIDを取得
    local pid_file="${SCRIPT_DIR}/.mas_http.pid"
    if [ -f "$pid_file" ]; then
        local old_pid=$(cat "$pid_file")

        # HTTPサーバーを停止
        kill "$old_pid" 2>/dev/null || true
        sleep 1

        # 新しいHTTPサーバーを起動
        cd "$SCRIPT_DIR"
        nohup node http_server.js > .mas_http.log 2>&1 &
        local new_pid=$!
        echo "$new_pid" > "$pid_file"

        sleep 2

        # 再起動後にリクエストを送信
        local test_id="$(date +%s)"
        local response=$(curl -s -X POST "$BASE_URL/message" \
            -H "Content-Type: application/json" \
            -d "{\"target\":\"00\",\"message\":\"再起動テスト_${test_id}\"}" \
            -w "\n%{http_code}")

        local http_code=$(echo "$response" | tail -n1)

        if [ "$http_code" = "200" ]; then
            record_test "$test_name" "PASS" "再起動後も正常に動作"
        else
            record_test "$test_name" "FAIL" "再起動後のリクエストが失敗: ${http_code}"
        fi
    else
        record_test "$test_name" "SKIP" "HTTPサーバーのPIDファイルが見つかりません"
    fi
}

# クリーンアップハンドラー
cleanup_on_exit() {
    log_info "テスト環境をクリーンアップ中..."
    cleanup_test_session
}

# メイン実行
main() {
    echo "========================================="
    echo "MAS エンドツーエンド統合テストスイート"
    echo "========================================="
    echo ""

    # 終了時のクリーンアップを設定
    trap cleanup_on_exit EXIT

    # MASシステムの確認
    if ! check_mas_system; then
        log_error "MASシステムが起動していません"
        exit 1
    fi

    echo ""
    echo "テスト実行中..."
    echo "-----------------------------------------"

    # 各テストを実行
    test_basic_flow
    test_multi_agent_delivery
    test_execute_flag_e2e
    test_managers_group_e2e
    test_concurrent_requests
    test_response_time
    test_system_restart

    # 結果サマリー
    echo ""
    echo "========================================="
    echo "テスト結果サマリー"
    echo "========================================="
    echo -e "${GREEN}成功:${NC} ${PASSED_TESTS} テスト"
    echo -e "${RED}失敗:${NC} ${FAILED_TESTS} テスト"
    echo "合計: $((PASSED_TESTS + FAILED_TESTS)) テスト"

    # 詳細レポート
    if [ ${FAILED_TESTS} -gt 0 ]; then
        echo ""
        echo "失敗したテスト:"
        for result in "${TEST_RESULTS[@]}"; do
            IFS=':' read -r name status details <<< "$result"
            if [ "$status" = "FAIL" ]; then
                echo -e "  ${RED}●${NC} ${name}"
                if [ -n "$details" ]; then
                    echo "    └─ ${details}"
                fi
            fi
        done
    fi

    if [ ${FAILED_TESTS} -eq 0 ]; then
        echo ""
        echo -e "${GREEN}すべてのテストが成功しました！${NC}"
        echo "MASシステムは正常に動作しています。"
        exit 0
    else
        echo ""
        echo -e "${RED}一部のテストが失敗しました${NC}"
        echo "ログファイルを確認してください: .mas_http.log"
        exit 1
    fi
}

# スクリプト実行
main "$@"