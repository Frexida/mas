#!/bin/bash

# MAS HTTPサーバーテストスクリプト
# HTTPサーバーのAPIエンドポイントテスト

set -uo pipefail

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# テスト設定
HTTP_PORT="${MAS_HTTP_PORT:-8765}"
BASE_URL="http://localhost:${HTTP_PORT}"
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

# テスト結果記録
record_test() {
    local test_name="$1"
    local result="$2"
    local details="${3:-}"

    TEST_RESULTS+=("${test_name}:${result}:${details}")

    if [ "$result" = "PASS" ]; then
        ((PASSED_TESTS++))
        echo -e "${GREEN}✓${NC} ${test_name}"
    else
        ((FAILED_TESTS++))
        echo -e "${RED}✗${NC} ${test_name}"
        if [ -n "$details" ]; then
            echo "  └─ ${details}"
        fi
    fi
}

# HTTPサーバーの起動確認
check_server_status() {
    log_info "HTTPサーバーの状態を確認中..."

    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" >/dev/null 2>&1; then
        log_info "HTTPサーバーは起動しています (port: ${HTTP_PORT})"
        return 0
    else
        log_error "HTTPサーバーが起動していません"
        log_info "サーバーを起動してください: ./mas.sh start"
        return 1
    fi
}

# テスト1: 正常なPOSTリクエスト
test_valid_post() {
    local test_name="正常なPOSTリクエスト"
    log_info "テスト: ${test_name}"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d '{"target":"00","message":"テストメッセージ"}' \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -q '"status":"acknowledged"'; then
            record_test "$test_name" "PASS"
        else
            record_test "$test_name" "FAIL" "不正なレスポンスボディ: $body"
        fi
    else
        record_test "$test_name" "FAIL" "HTTPステータス: $http_code"
    fi
}

# テスト2: executeフラグ付きリクエスト
test_with_execute_flag() {
    local test_name="executeフラグ付きリクエスト"
    log_info "テスト: ${test_name}"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d '{"target":"00","message":"実行テスト","execute":true}' \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "HTTPステータス: $http_code"
    fi
}

# テスト3: グループターゲット
test_group_target() {
    local test_name="グループターゲット (design)"
    log_info "テスト: ${test_name}"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d '{"target":"design","message":"デザインユニットテスト"}' \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ] && echo "$body" | grep -q '"target":"design"'; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "HTTPステータス: $http_code"
    fi
}

# テスト4: 不正なメソッド (GET)
test_invalid_method() {
    local test_name="不正なメソッド (GET)"
    log_info "テスト: ${test_name}"

    local response=$(curl -s -X GET "$BASE_URL/message" \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "400" ] && echo "$body" | grep -q "Only POST /message is supported"; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "期待と異なるレスポンス: $http_code"
    fi
}

# テスト5: 不正なパス
test_invalid_path() {
    local test_name="不正なパス (/invalid)"
    log_info "テスト: ${test_name}"

    local response=$(curl -s -X POST "$BASE_URL/invalid" \
        -H "Content-Type: application/json" \
        -d '{"target":"00","message":"test"}' \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "400" ]; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "HTTPステータス: $http_code"
    fi
}

# テスト6: 必須パラメータ欠落 (target)
test_missing_target() {
    local test_name="必須パラメータ欠落 (target)"
    log_info "テスト: ${test_name}"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d '{"message":"ターゲットなし"}' \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "400" ] && echo "$body" | grep -q "target and message required"; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "期待と異なるエラーメッセージ"
    fi
}

# テスト7: 必須パラメータ欠落 (message)
test_missing_message() {
    local test_name="必須パラメータ欠落 (message)"
    log_info "テスト: ${test_name}"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d '{"target":"00"}' \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "400" ]; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "HTTPステータス: $http_code"
    fi
}

# テスト8: 不正なJSON
test_invalid_json() {
    local test_name="不正なJSON"
    log_info "テスト: ${test_name}"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d 'invalid json}' \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "400" ]; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "HTTPステータス: $http_code"
    fi
}

# テスト9: 空のボディ
test_empty_body() {
    local test_name="空のボディ"
    log_info "テスト: ${test_name}"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d '' \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "400" ]; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "HTTPステータス: $http_code"
    fi
}

# テスト10: レスポンスのタイムスタンプ
test_response_timestamp() {
    local test_name="レスポンスのタイムスタンプ"
    log_info "テスト: ${test_name}"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d '{"target":"00","message":"timestamp test"}')

    if echo "$response" | grep -q '"timestamp"'; then
        # ISO 8601フォーマットのチェック
        if echo "$response" | grep -qE '"timestamp":"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z"'; then
            record_test "$test_name" "PASS"
        else
            record_test "$test_name" "FAIL" "不正なタイムスタンプフォーマット"
        fi
    else
        record_test "$test_name" "FAIL" "タイムスタンプが存在しません"
    fi
}

# テスト実行メイン
main() {
    echo "==================================="
    echo "MAS HTTPサーバー テストスイート"
    echo "==================================="
    echo ""

    # サーバー起動確認
    if ! check_server_status; then
        exit 1
    fi

    echo ""
    echo "テスト実行中..."
    echo "-----------------------------------"

    # 各テストを実行
    test_valid_post
    test_with_execute_flag
    test_group_target
    test_invalid_method
    test_invalid_path
    test_missing_target
    test_missing_message
    test_invalid_json
    test_empty_body
    test_response_timestamp

    # 結果サマリー
    echo ""
    echo "==================================="
    echo "テスト結果サマリー"
    echo "==================================="
    echo -e "${GREEN}成功:${NC} ${PASSED_TESTS} テスト"
    echo -e "${RED}失敗:${NC} ${FAILED_TESTS} テスト"
    echo "合計: $((PASSED_TESTS + FAILED_TESTS)) テスト"

    if [ ${FAILED_TESTS} -eq 0 ]; then
        echo ""
        echo -e "${GREEN}すべてのテストが成功しました！${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}いくつかのテストが失敗しました${NC}"
        exit 1
    fi
}

# スクリプト実行
main "$@"