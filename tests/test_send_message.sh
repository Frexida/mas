#!/bin/bash

# MAS メッセージ送信機能テストスクリプト
# send_message.sh の機能テスト

set -uo pipefail

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# テスト設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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

# tmuxセッション確認
check_tmux_session() {
    log_info "tmuxセッションを確認中..."

    if tmux has-session -t "mas-tmux" 2>/dev/null; then
        log_info "mas-tmuxセッションが存在します"
        return 0
    else
        log_warning "mas-tmuxセッションが存在しません"
        log_info "テストはドライランモードで実行します"
        return 1
    fi
}

# テスト1: ヘルプメッセージ
test_help_message() {
    local test_name="ヘルプメッセージ表示"
    log_info "テスト: ${test_name}"

    local output=$("$SEND_MESSAGE" --help 2>&1)

    if echo "$output" | grep -q "使用方法:"; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "ヘルプメッセージが表示されません"
    fi
}

# テスト2: 個別エージェントへの送信（ドライラン）
test_individual_agent() {
    local test_name="個別エージェント送信 (00)"
    log_info "テスト: ${test_name}"

    local output=$("$SEND_MESSAGE" -n -p 00 "テストメッセージ" 2>&1)

    if echo "$output" | grep -q "\[DRY-RUN\].*00.*テストメッセージ"; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "ドライラン出力が期待と異なります"
    fi
}

# テスト3: ユニット全体への送信（ドライラン）
test_unit_target() {
    local test_name="ユニット全体送信 (design)"
    log_info "テスト: ${test_name}"

    local output=$("$SEND_MESSAGE" -n -p design "デザインユニットテスト" 2>&1)

    # 全デザインエージェント (10, 11, 12, 13) への送信を確認
    local all_agents_found=true
    for agent in 10 11 12 13; do
        if ! echo "$output" | grep -q "\[DRY-RUN\].*${agent}.*デザインユニットテスト"; then
            all_agents_found=false
            break
        fi
    done

    if [ "$all_agents_found" = true ]; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "すべてのデザインエージェントに送信されていません"
    fi
}

# テスト4: マネージャーグループへの送信（ドライラン）
test_managers_group() {
    local test_name="マネージャーグループ送信"
    log_info "テスト: ${test_name}"

    local output=$("$SEND_MESSAGE" -n -p managers "マネージャー会議" 2>&1)

    # 全マネージャー (00, 10, 20, 30) への送信を確認
    local all_managers_found=true
    for manager in 00 10 20 30; do
        if ! echo "$output" | grep -q "\[DRY-RUN\].*${manager}.*マネージャー会議"; then
            all_managers_found=false
            break
        fi
    done

    if [ "$all_managers_found" = true ]; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "すべてのマネージャーに送信されていません"
    fi
}

# テスト5: 全エージェントへの送信（ドライラン）
test_all_agents() {
    local test_name="全エージェント送信"
    log_info "テスト: ${test_name}"

    local output=$("$SEND_MESSAGE" -n -p all "全体連絡" 2>&1)

    # 送信数を確認 (13エージェント)
    local count=$(echo "$output" | grep -c "\[DRY-RUN\]")

    if [ "$count" -eq 13 ]; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "送信数が期待と異なります: ${count}/13"
    fi
}

# テスト6: executeフラグ付き送信（ドライラン）
test_execute_flag() {
    local test_name="executeフラグ付き送信"
    log_info "テスト: ${test_name}"

    local output=$("$SEND_MESSAGE" -n -p 00 -e "実行テスト" 2>&1)

    if echo "$output" | grep -q "\[DRY-RUN\].*00.*実行テスト.*C-m"; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "実行フラグが正しく処理されていません"
    fi
}

# テスト7: 不正なターゲット
test_invalid_target() {
    local test_name="不正なターゲット"
    log_info "テスト: ${test_name}"

    local output=$("$SEND_MESSAGE" -n -p invalid "テスト" 2>&1)

    if echo "$output" | grep -q "警告: 不正なターゲット: invalid"; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "不正なターゲットが検出されません"
    fi
}

# テスト8: パラメータ不足
test_missing_parameters() {
    local test_name="パラメータ不足"
    log_info "テスト: ${test_name}"

    local output=$("$SEND_MESSAGE" -p 00 2>&1 || true)

    if echo "$output" | grep -q "メッセージが指定されていません"; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "エラーメッセージが期待と異なります"
    fi
}

# テスト9: ターゲット展開のテスト
test_target_expansion() {
    local test_name="ターゲット展開機能"
    log_info "テスト: ${test_name}"

    # developmentユニットのテスト
    local output=$("$SEND_MESSAGE" -n -p development "開発タスク" 2>&1)

    local dev_agents_found=true
    for agent in 20 21 22 23; do
        if ! echo "$output" | grep -q "\[DRY-RUN\].*${agent}.*開発タスク"; then
            dev_agents_found=false
            break
        fi
    done

    if [ "$dev_agents_found" = true ]; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "開発ユニットの展開が正しくありません"
    fi
}

# テスト10: businessユニットへの送信
test_business_unit() {
    local test_name="businessユニット送信"
    log_info "テスト: ${test_name}"

    local output=$("$SEND_MESSAGE" -n -p business "会計報告" 2>&1)

    local business_agents_found=true
    for agent in 30 31 32 33; do
        if ! echo "$output" | grep -q "\[DRY-RUN\].*${agent}.*会計報告"; then
            business_agents_found=false
            break
        fi
    done

    if [ "$business_agents_found" = true ]; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "ビジネスユニットへの送信が正しくありません"
    fi
}

# テスト11: 特殊文字を含むメッセージ
test_special_characters() {
    local test_name="特殊文字を含むメッセージ"
    log_info "テスト: ${test_name}"

    local message='テスト "引用" と $変数 と `コマンド`'
    local output=$("$SEND_MESSAGE" -n -p 00 "$message" 2>&1)

    if echo "$output" | grep -q "\[DRY-RUN\].*00.*テスト.*引用.*変数.*コマンド"; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "特殊文字が正しく処理されていません"
    fi
}

# テスト12: 長いメッセージ
test_long_message() {
    local test_name="長いメッセージ"
    log_info "テスト: ${test_name}"

    local long_message="これは非常に長いメッセージです。"
    for i in {1..10}; do
        long_message="${long_message} 追加のテキスト${i}。"
    done

    local output=$("$SEND_MESSAGE" -n -p 00 "$long_message" 2>&1)

    if echo "$output" | grep -q "\[DRY-RUN\].*00"; then
        record_test "$test_name" "PASS"
    else
        record_test "$test_name" "FAIL" "長いメッセージが処理されません"
    fi
}

# テスト実行メイン
main() {
    echo "==================================="
    echo "MAS メッセージ送信機能 テストスイート"
    echo "==================================="
    echo ""

    # スクリプト存在確認
    if [ ! -x "$SEND_MESSAGE" ]; then
        log_error "send_message.sh が見つかりません: $SEND_MESSAGE"
        exit 1
    fi

    # tmuxセッション確認（オプション）
    check_tmux_session

    echo ""
    echo "テスト実行中..."
    echo "-----------------------------------"

    # 各テストを実行
    test_help_message
    test_individual_agent
    test_unit_target
    test_managers_group
    test_all_agents
    test_execute_flag
    test_invalid_target
    test_missing_parameters
    test_target_expansion
    test_business_unit
    test_special_characters
    test_long_message

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
        echo ""
        echo "失敗したテスト:"
        for result in "${TEST_RESULTS[@]}"; do
            IFS=':' read -r name status details <<< "$result"
            if [ "$status" = "FAIL" ]; then
                echo "  - ${name}: ${details}"
            fi
        done
        exit 1
    fi
}

# スクリプト実行
main "$@"