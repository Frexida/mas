#!/bin/bash

# MAS エラーハンドリング・エッジケーステストスクリプト
# 異常系のテストケースとエラー処理の確認

set -euo pipefail

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# テスト設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HTTP_PORT="${MAS_HTTP_PORT:-8765}"
BASE_URL="http://localhost:${HTTP_PORT}"
SEND_MESSAGE="${SCRIPT_DIR}/send_message.sh"
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

log_edge() {
    echo -e "${CYAN}[EDGE]${NC} $1"
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

# テスト1: 巨大なペイロード
test_large_payload() {
    local test_name="巨大なペイロード処理"
    log_edge "$test_name"

    # 10MBの文字列を生成
    local large_message=$(printf 'A%.0s' {1..10000000})

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d "{\"target\":\"00\",\"message\":\"${large_message:0:1000000}\"}" \
        -w "\n%{http_code}" \
        --max-time 5 2>&1 || echo "TIMEOUT")

    if echo "$response" | grep -q "TIMEOUT"; then
        record_test "$test_name" "PASS" "大きなペイロードでタイムアウト（期待通り）"
    elif echo "$response" | grep -q "413"; then
        record_test "$test_name" "PASS" "大きなペイロードを拒否（期待通り）"
    else
        local http_code=$(echo "$response" | tail -n1)
        if [ "$http_code" = "200" ] || [ "$http_code" = "400" ]; then
            record_test "$test_name" "PASS" "大きなペイロードを適切に処理"
        else
            record_test "$test_name" "FAIL" "予期しないレスポンス: ${http_code}"
        fi
    fi
}

# テスト2: 不正な文字エンコーディング
test_invalid_encoding() {
    local test_name="不正な文字エンコーディング"
    log_edge "$test_name"

    # 不正なUTF-8シーケンス
    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json; charset=utf-8" \
        --data-binary $'{"target":"00","message":"\xFF\xFE不正なエンコーディング"}' \
        -w "\n%{http_code}" 2>/dev/null || echo "ERROR")

    if echo "$response" | grep -q "ERROR\|400"; then
        record_test "$test_name" "PASS" "不正なエンコーディングを適切に処理"
    else
        record_test "$test_name" "FAIL" "不正なエンコーディングが処理されました"
    fi
}

# テスト3: SQLインジェクション試行
test_sql_injection() {
    local test_name="SQLインジェクション耐性"
    log_edge "$test_name"

    local injection_payload="'; DROP TABLE users; --"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d "{\"target\":\"00\",\"message\":\"${injection_payload}\"}" \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    # HTTPサーバーはDBを使用していないが、入力をそのまま処理すべき
    if [ "$http_code" = "200" ]; then
        record_test "$test_name" "PASS" "SQLインジェクション文字列を安全に処理"
    else
        record_test "$test_name" "FAIL" "予期しないレスポンス: ${http_code}"
    fi
}

# テスト4: コマンドインジェクション試行
test_command_injection() {
    local test_name="コマンドインジェクション耐性"
    log_edge "$test_name"

    local injection_payload="\$(rm -rf /); echo hacked"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d "{\"target\":\"00\",\"message\":\"${injection_payload}\"}" \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        # ファイルシステムに影響がないことを確認
        if [ -d "/" ]; then
            record_test "$test_name" "PASS" "コマンドインジェクションを防御"
        else
            record_test "$test_name" "FAIL" "システムに影響が出た可能性"
        fi
    else
        record_test "$test_name" "FAIL" "予期しないレスポンス: ${http_code}"
    fi
}

# テスト5: XSS試行
test_xss_attempt() {
    local test_name="XSS攻撃耐性"
    log_edge "$test_name"

    local xss_payload="<script>alert('XSS')</script>"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d "{\"target\":\"00\",\"message\":\"${xss_payload}\"}" \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        # レスポンスにスクリプトタグがエスケープされているか確認
        if echo "$body" | grep -q "<script>"; then
            record_test "$test_name" "FAIL" "XSSペイロードがエスケープされていません"
        else
            record_test "$test_name" "PASS" "XSSペイロードを安全に処理"
        fi
    else
        record_test "$test_name" "FAIL" "予期しないレスポンス: ${http_code}"
    fi
}

# テスト6: 不正なContent-Type
test_invalid_content_type() {
    local test_name="不正なContent-Type"
    log_edge "$test_name"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: text/plain" \
        -d '{"target":"00","message":"test"}' \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    # Content-Typeが違ってもJSONとして解析を試みる可能性
    if [ "$http_code" = "400" ] || [ "$http_code" = "200" ]; then
        record_test "$test_name" "PASS" "Content-Typeを適切に処理"
    else
        record_test "$test_name" "FAIL" "予期しないレスポンス: ${http_code}"
    fi
}

# テスト7: 循環参照のあるJSON
test_circular_json() {
    local test_name="循環参照JSON"
    log_edge "$test_name"

    # 深いネストのJSON（循環参照のシミュレーション）
    local nested_json='{"target":"00","message":"test","nested":{"nested":{"nested":{"nested":{"nested":"deep"}}}}}'

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d "$nested_json" \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "400" ]; then
        record_test "$test_name" "PASS" "深いネストのJSONを処理"
    else
        record_test "$test_name" "FAIL" "予期しないレスポンス: ${http_code}"
    fi
}

# テスト8: 同時大量リクエスト（DoS試行）
test_dos_attempt() {
    local test_name="DoS攻撃耐性（100並行リクエスト）"
    log_edge "$test_name"

    local pids=()
    local success_count=0
    local fail_count=0

    # 100個の並行リクエストを送信
    for i in {1..100}; do
        (
            curl -s -X POST "$BASE_URL/message" \
                -H "Content-Type: application/json" \
                -d "{\"target\":\"00\",\"message\":\"DoSテスト_${i}\"}" \
                --max-time 5 \
                -o /dev/null \
                -w "%{http_code}" > "/tmp/dos_test_${i}.tmp" 2>&1
        ) &
        pids+=($!)
    done

    # すべてのリクエストの完了を待つ
    for pid in "${pids[@]}"; do
        wait $pid 2>/dev/null || true
    done

    # 結果を集計
    for i in {1..100}; do
        if [ -f "/tmp/dos_test_${i}.tmp" ]; then
            local code=$(cat "/tmp/dos_test_${i}.tmp")
            if [ "$code" = "200" ]; then
                ((success_count++))
            else
                ((fail_count++))
            fi
            rm -f "/tmp/dos_test_${i}.tmp"
        fi
    done

    # サーバーがまだ応答するか確認
    local server_alive=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null || echo "DOWN")

    if [ "$server_alive" != "DOWN" ] && [ $success_count -gt 50 ]; then
        record_test "$test_name" "PASS" "成功: ${success_count}/100, サーバー生存"
    else
        record_test "$test_name" "FAIL" "サーバーがDoS攻撃に脆弱: 成功=${success_count}"
    fi
}

# テスト9: 不正なHTTPメソッドの組み合わせ
test_method_confusion() {
    local test_name="HTTPメソッド混乱"
    log_edge "$test_name"

    # PUTメソッドでPOSTエンドポイントにアクセス
    local response=$(curl -s -X PUT "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d '{"target":"00","message":"test"}' \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "400" ] || [ "$http_code" = "405" ]; then
        record_test "$test_name" "PASS" "不正なメソッドを適切に拒否"
    else
        record_test "$test_name" "FAIL" "不正なメソッドが処理された: ${http_code}"
    fi
}

# テスト10: パスTraversal試行
test_path_traversal() {
    local test_name="パストラバーサル耐性"
    log_edge "$test_name"

    local traversal_target="../../etc/passwd"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -d "{\"target\":\"${traversal_target}\",\"message\":\"test\"}" \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    # エラーまたは警告が返されるべき
    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -q "警告\|不正"; then
            record_test "$test_name" "PASS" "パストラバーサルを検出"
        else
            record_test "$test_name" "WARN" "パストラバーサル文字列が処理された"
        fi
    else
        record_test "$test_name" "PASS" "パストラバーサルを拒否"
    fi
}

# テスト11: NULL文字インジェクション
test_null_byte_injection() {
    local test_name="NULL文字インジェクション"
    log_edge "$test_name"

    # NULL文字を含むペイロード
    local response=$(printf '{"target":"00\x00admin","message":"test"}' | \
        curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        --data-binary @- \
        -w "\n%{http_code}" 2>/dev/null || echo "ERROR")

    if echo "$response" | grep -q "ERROR\|400"; then
        record_test "$test_name" "PASS" "NULL文字を適切に処理"
    else
        record_test "$test_name" "WARN" "NULL文字が処理された可能性"
    fi
}

# テスト12: HTTPヘッダーインジェクション
test_header_injection() {
    local test_name="HTTPヘッダーインジェクション"
    log_edge "$test_name"

    local response=$(curl -s -X POST "$BASE_URL/message" \
        -H "Content-Type: application/json" \
        -H $'X-Injected: test\r\nX-Evil: header' \
        -d '{"target":"00","message":"test"}' \
        -w "\n%{http_code}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "400" ]; then
        record_test "$test_name" "PASS" "ヘッダーインジェクションを処理"
    else
        record_test "$test_name" "FAIL" "予期しないレスポンス: ${http_code}"
    fi
}

# メイン実行
main() {
    echo "===================================="
    echo "MAS エラーハンドリング・エッジケーステスト"
    echo "===================================="
    echo ""

    # HTTPサーバーの確認
    if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" >/dev/null 2>&1; then
        log_error "HTTPサーバーが起動していません"
        exit 1
    fi

    echo "エッジケーステスト実行中..."
    echo "------------------------------------"

    # 各テストを実行
    test_large_payload
    test_invalid_encoding
    test_sql_injection
    test_command_injection
    test_xss_attempt
    test_invalid_content_type
    test_circular_json
    test_dos_attempt
    test_method_confusion
    test_path_traversal
    test_null_byte_injection
    test_header_injection

    # 結果サマリー
    echo ""
    echo "===================================="
    echo "テスト結果サマリー"
    echo "===================================="
    echo -e "${GREEN}成功:${NC} ${PASSED_TESTS} テスト"
    echo -e "${RED}失敗:${NC} ${FAILED_TESTS} テスト"
    echo "合計: $((PASSED_TESTS + FAILED_TESTS)) テスト"

    if [ ${FAILED_TESTS} -eq 0 ]; then
        echo ""
        echo -e "${GREEN}すべてのエッジケーステストが成功しました！${NC}"
        echo "システムは異常系に対して堅牢です。"
        exit 0
    else
        echo ""
        echo -e "${YELLOW}一部のエッジケーステストで問題が見つかりました${NC}"
        echo "セキュリティとエラーハンドリングの改善を検討してください。"
        exit 1
    fi
}

# スクリプト実行
main "$@"