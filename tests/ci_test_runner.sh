#!/bin/bash

# CI/CD環境用のテストランナースクリプト
# AWS CodeBuild、GitHub Actions、その他のCI環境で使用

set -euo pipefail

# 環境変数
CI_MODE="${CI:-false}"
TEST_TIMEOUT="${TEST_TIMEOUT:-300}"  # 5分のタイムアウト
PARALLEL_TESTS="${PARALLEL_TESTS:-false}"
VERBOSE="${VERBOSE:-false}"

# 色付き出力（CI環境では無効化）
if [ "$CI_MODE" = "true" ]; then
    RED=""
    GREEN=""
    YELLOW=""
    BLUE=""
    NC=""
else
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
fi

# テスト結果
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# JUnit XML形式の結果ファイル
JUNIT_OUTPUT="${JUNIT_OUTPUT:-tests/results/junit.xml}"

# ログ関数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# JUnit XML開始
start_junit() {
    mkdir -p "$(dirname "$JUNIT_OUTPUT")"
    cat > "$JUNIT_OUTPUT" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="MAS Test Suite" time="0" tests="0" failures="0" errors="0">
EOF
}

# JUnit テストスイート追加
add_test_suite() {
    local suite_name="$1"
    local tests="$2"
    local failures="$3"
    local time="$4"
    local output="$5"

    cat >> "$JUNIT_OUTPUT" <<EOF
  <testsuite name="$suite_name" tests="$tests" failures="$failures" time="$time">
    $output
  </testsuite>
EOF
}

# JUnit テストケース追加
create_test_case() {
    local name="$1"
    local classname="$2"
    local time="$3"
    local status="$4"
    local message="${5:-}"

    if [ "$status" = "pass" ]; then
        echo "    <testcase name=\"$name\" classname=\"$classname\" time=\"$time\"/>"
    elif [ "$status" = "fail" ]; then
        echo "    <testcase name=\"$name\" classname=\"$classname\" time=\"$time\">"
        echo "      <failure message=\"$message\">$message</failure>"
        echo "    </testcase>"
    elif [ "$status" = "skip" ]; then
        echo "    <testcase name=\"$name\" classname=\"$classname\" time=\"$time\">"
        echo "      <skipped message=\"$message\"/>"
        echo "    </testcase>"
    fi
}

# JUnit XML終了
end_junit() {
    echo "</testsuites>" >> "$JUNIT_OUTPUT"
}

# システムチェック
check_requirements() {
    log_info "Checking system requirements..."

    local missing_deps=()

    # Node.js
    if ! command -v node >/dev/null 2>&1; then
        missing_deps+=("node")
    fi

    # tmux
    if ! command -v tmux >/dev/null 2>&1; then
        missing_deps+=("tmux")
    fi

    # curl
    if ! command -v curl >/dev/null 2>&1; then
        missing_deps+=("curl")
    fi

    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        return 1
    fi

    log_info "All requirements satisfied"
    return 0
}

# MASシステム起動
start_mas_system() {
    log_info "Starting MAS system for testing..."

    # 既存のセッションをクリーンアップ
    tmux kill-session -t mas-tmux-test 2>/dev/null || true

    # テスト用tmuxセッション作成
    tmux new-session -d -s mas-tmux-test

    # HTTPサーバー起動
    if [ -f "http_server.js" ]; then
        nohup node http_server.js > tests/results/http_server.log 2>&1 &
        echo $! > tests/results/http_server.pid

        # サーバー起動待機
        local max_wait=30
        local waited=0
        while [ $waited -lt $max_wait ]; do
            if curl -s http://localhost:8765 >/dev/null 2>&1; then
                log_info "HTTP server started successfully"
                return 0
            fi
            sleep 1
            waited=$((waited + 1))
        done

        log_error "HTTP server failed to start within ${max_wait} seconds"
        return 1
    else
        log_error "http_server.js not found"
        return 1
    fi
}

# MASシステム停止
stop_mas_system() {
    log_info "Stopping MAS system..."

    # HTTPサーバー停止
    if [ -f "tests/results/http_server.pid" ]; then
        kill $(cat tests/results/http_server.pid) 2>/dev/null || true
        rm -f tests/results/http_server.pid
    fi

    # tmuxセッション削除
    tmux kill-session -t mas-tmux-test 2>/dev/null || true
}

# 個別テスト実行
run_test_suite() {
    local test_name="$1"
    local test_script="$2"
    local start_time=$(date +%s)

    log_info "Running test suite: $test_name"

    local test_output=""
    local test_result=0
    local test_cases=""
    local suite_tests=0
    local suite_failures=0

    # テストスクリプト実行
    if [ -f "$test_script" ]; then
        if timeout "$TEST_TIMEOUT" bash "$test_script" > "tests/results/${test_name}.log" 2>&1; then
            test_result=0
            log_info "✅ $test_name: PASSED"
            ((PASSED_TESTS++))
        else
            test_result=$?
            if [ $test_result -eq 124 ]; then
                log_error "❌ $test_name: TIMEOUT"
                test_cases=$(create_test_case "$test_name" "timeout" "0" "fail" "Test timed out after ${TEST_TIMEOUT}s")
                suite_failures=1
            else
                log_error "❌ $test_name: FAILED (exit code: $test_result)"
                test_cases=$(create_test_case "$test_name" "failed" "0" "fail" "Test failed with exit code $test_result")
                suite_failures=1
            fi
            ((FAILED_TESTS++))
        fi
        suite_tests=1
    else
        log_warning "⚠️  $test_name: SKIPPED (script not found)"
        test_cases=$(create_test_case "$test_name" "skipped" "0" "skip" "Test script not found")
        ((SKIPPED_TESTS++))
        suite_tests=1
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    ((TOTAL_TESTS++))

    # JUnit形式で結果を追加
    add_test_suite "$test_name" "$suite_tests" "$suite_failures" "$duration" "$test_cases"

    return $test_result
}

# HTTPサーバーテスト
test_http_server() {
    run_test_suite "http_server" "tests/test_http_server.sh"
}

# メッセージ送信テスト
test_message_sending() {
    # send_message.shのドライランモードがないため、簡易テストを実行
    local test_name="message_sending"
    local start_time=$(date +%s)

    log_info "Running simplified message sending tests..."

    local test_cases=""
    local suite_failures=0

    # HTTPエンドポイント経由でテスト
    if curl -s -X POST http://localhost:8765/message \
        -H "Content-Type: application/json" \
        -d '{"target":"00","message":"CI test message"}' \
        > tests/results/message_test.log 2>&1; then

        log_info "✅ Message sending: PASSED"
        test_cases=$(create_test_case "send_message_http" "message" "1" "pass")
        ((PASSED_TESTS++))
    else
        log_error "❌ Message sending: FAILED"
        test_cases=$(create_test_case "send_message_http" "message" "1" "fail" "Failed to send message via HTTP")
        ((FAILED_TESTS++))
        suite_failures=1
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    ((TOTAL_TESTS++))
    add_test_suite "$test_name" "1" "$suite_failures" "$duration" "$test_cases"
}

# パフォーマンステスト
test_performance() {
    local test_name="performance"
    local start_time=$(date +%s)

    log_info "Running performance tests..."

    local test_cases=""
    local suite_tests=0
    local suite_failures=0

    # レスポンスタイムテスト
    local total_time=0
    local request_count=100

    for i in $(seq 1 $request_count); do
        local req_start=$(date +%s%N)
        curl -s -X POST http://localhost:8765/message \
            -H "Content-Type: application/json" \
            -d '{"target":"00","message":"perf test"}' \
            -o /dev/null 2>&1
        local req_end=$(date +%s%N)
        local req_time=$((($req_end - $req_start) / 1000000))  # ミリ秒
        total_time=$((total_time + req_time))
    done

    local avg_time=$((total_time / request_count))

    if [ $avg_time -lt 100 ]; then
        log_info "✅ Performance: PASSED (avg: ${avg_time}ms)"
        test_cases=$(create_test_case "response_time" "performance" "$avg_time" "pass")
        ((PASSED_TESTS++))
    else
        log_error "❌ Performance: FAILED (avg: ${avg_time}ms > 100ms)"
        test_cases=$(create_test_case "response_time" "performance" "$avg_time" "fail" "Average response time ${avg_time}ms exceeds 100ms limit")
        ((FAILED_TESTS++))
        suite_failures=1
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    ((TOTAL_TESTS++))
    suite_tests=1
    add_test_suite "$test_name" "$suite_tests" "$suite_failures" "$duration" "$test_cases"
}

# エラーハンドリングテスト
test_error_handling() {
    local test_name="error_handling"
    local start_time=$(date +%s)

    log_info "Running error handling tests..."

    local test_cases=""
    local suite_tests=0
    local suite_failures=0

    # 不正なJSONテスト
    local response=$(curl -s -X POST http://localhost:8765/message \
        -H "Content-Type: application/json" \
        -d 'invalid json' \
        -w "\n%{http_code}" 2>/dev/null | tail -n1)

    if [ "$response" = "400" ]; then
        log_info "✅ Error handling: Invalid JSON handled correctly"
        test_cases="${test_cases}$(create_test_case "invalid_json" "error_handling" "1" "pass")"
    else
        log_error "❌ Error handling: Invalid JSON not handled properly"
        test_cases="${test_cases}$(create_test_case "invalid_json" "error_handling" "1" "fail" "Expected 400, got $response")"
        suite_failures=$((suite_failures + 1))
    fi
    suite_tests=$((suite_tests + 1))

    # 必須パラメータ欠落テスト
    response=$(curl -s -X POST http://localhost:8765/message \
        -H "Content-Type: application/json" \
        -d '{"message":"no target"}' \
        -w "\n%{http_code}" 2>/dev/null | tail -n1)

    if [ "$response" = "400" ]; then
        log_info "✅ Error handling: Missing parameter handled correctly"
        test_cases="${test_cases}$(create_test_case "missing_param" "error_handling" "1" "pass")"
        ((PASSED_TESTS++))
    else
        log_error "❌ Error handling: Missing parameter not handled properly"
        test_cases="${test_cases}$(create_test_case "missing_param" "error_handling" "1" "fail" "Expected 400, got $response")"
        ((FAILED_TESTS++))
        suite_failures=$((suite_failures + 1))
    fi
    suite_tests=$((suite_tests + 1))

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    ((TOTAL_TESTS += 2))
    add_test_suite "$test_name" "$suite_tests" "$suite_failures" "$duration" "$test_cases"
}

# メイン実行
main() {
    log "========================================="
    log "MAS CI Test Runner"
    log "========================================="
    log "Environment: ${CI_MODE}"
    log "Timeout: ${TEST_TIMEOUT}s"
    log ""

    # 結果ディレクトリ作成
    mkdir -p tests/results

    # JUnit XML開始
    start_junit

    # システムチェック
    if ! check_requirements; then
        log_error "System requirements not met"
        exit 1
    fi

    # MASシステム起動
    if ! start_mas_system; then
        log_error "Failed to start MAS system"
        exit 1
    fi

    # テスト実行
    log ""
    log "Running test suites..."
    log "-----------------------------------------"

    # テストスイート実行（エラーがあっても続行）
    test_http_server || true
    test_message_sending || true
    test_performance || true
    test_error_handling || true

    # JUnit XML終了
    end_junit

    # クリーンアップ
    stop_mas_system

    # 結果サマリー
    log ""
    log "========================================="
    log "Test Results Summary"
    log "========================================="
    log_info "Total tests: $TOTAL_TESTS"
    log_info "Passed: $PASSED_TESTS"
    log_error "Failed: $FAILED_TESTS"
    log_warning "Skipped: $SKIPPED_TESTS"

    # CI環境用の追加出力
    if [ "$CI_MODE" = "true" ]; then
        echo "::set-output name=total::$TOTAL_TESTS"
        echo "::set-output name=passed::$PASSED_TESTS"
        echo "::set-output name=failed::$FAILED_TESTS"
        echo "::set-output name=skipped::$SKIPPED_TESTS"
    fi

    # 終了コード
    if [ $FAILED_TESTS -gt 0 ]; then
        log_error "Tests failed!"
        exit 1
    else
        log_info "All tests passed!"
        exit 0
    fi
}

# トラップ設定（異常終了時のクリーンアップ）
trap 'stop_mas_system' EXIT ERR

# スクリプト実行
main "$@"