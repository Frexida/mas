#!/bin/bash

# MAS パフォーマンステストスクリプト
# システムの性能測定と負荷テスト

set -euo pipefail

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# テスト設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HTTP_PORT="${MAS_HTTP_PORT:-8765}"
BASE_URL="http://localhost:${HTTP_PORT}"
SEND_MESSAGE="${SCRIPT_DIR}/send_message.sh"

# パフォーマンス測定変数
declare -A PERF_RESULTS
PERF_TESTS_RUN=0

# ログ出力
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_perf() {
    echo -e "${CYAN}[PERF]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 時間測定関数
measure_time() {
    local start_time=$(date +%s%N)
    "$@" >/dev/null 2>&1
    local end_time=$(date +%s%N)
    echo $((($end_time - $start_time) / 1000000)) # ミリ秒で返す
}

# 統計計算
calculate_stats() {
    local -n arr=$1
    local count=${#arr[@]}

    if [ $count -eq 0 ]; then
        echo "N/A"
        return
    fi

    # ソート
    IFS=$'\n' sorted=($(sort -n <<<"${arr[*]}"))
    unset IFS

    # 最小、最大、合計
    local min=${sorted[0]}
    local max=${sorted[$((count-1))]}
    local sum=0
    for val in "${arr[@]}"; do
        sum=$((sum + val))
    done

    # 平均
    local avg=$((sum / count))

    # 中央値
    local median
    if [ $((count % 2)) -eq 0 ]; then
        median=$(((sorted[$((count/2-1))] + sorted[$((count/2))]) / 2))
    else
        median=${sorted[$((count/2))]}
    fi

    # 95パーセンタイル
    local p95_index=$((count * 95 / 100))
    local p95=${sorted[$p95_index]}

    echo "Min: ${min}ms, Max: ${max}ms, Avg: ${avg}ms, Median: ${median}ms, P95: ${p95}ms"
}

# テスト1: HTTPレスポンスタイム測定
test_http_response_time() {
    log_perf "HTTPレスポンスタイム測定"

    local iterations=100
    local times=()

    echo -n "  実行中 ["
    for i in $(seq 1 $iterations); do
        if [ $((i % 10)) -eq 0 ]; then
            echo -n "="
        fi

        local time=$(measure_time curl -s -X POST "$BASE_URL/message" \
            -H "Content-Type: application/json" \
            -d '{"target":"00","message":"perf test"}')

        times+=($time)
    done
    echo "] 完了"

    local stats=$(calculate_stats times)
    echo -e "  ${BLUE}結果:${NC} $stats"

    PERF_RESULTS["http_response"]="$stats"
    ((PERF_TESTS_RUN++))
}

# テスト2: メッセージ送信スループット
test_message_throughput() {
    log_perf "メッセージ送信スループット測定"

    local duration=10 # 10秒間
    local count=0
    local start_time=$(date +%s)
    local current_time=$start_time

    echo -n "  ${duration}秒間のスループット測定中..."

    while [ $((current_time - start_time)) -lt $duration ]; do
        curl -s -X POST "$BASE_URL/message" \
            -H "Content-Type: application/json" \
            -d '{"target":"00","message":"throughput test"}' \
            >/dev/null 2>&1 &

        ((count++))
        current_time=$(date +%s)

        # プロセス数制限
        while [ $(jobs -r | wc -l) -ge 50 ]; do
            sleep 0.01
        done
    done

    wait # すべてのバックグラウンドジョブを待つ

    local throughput=$((count / duration))
    echo " 完了"
    echo -e "  ${BLUE}結果:${NC} ${throughput} req/s (合計 ${count} リクエスト)"

    PERF_RESULTS["throughput"]="${throughput} req/s"
    ((PERF_TESTS_RUN++))
}

# テスト3: 並行処理性能
test_concurrent_performance() {
    log_perf "並行処理性能測定"

    local concurrent_levels=(1 5 10 20 50 100)

    for level in "${concurrent_levels[@]}"; do
        echo -n "  並行度 ${level}: "

        local start_time=$(date +%s%N)
        local pids=()

        for i in $(seq 1 $level); do
            (
                curl -s -X POST "$BASE_URL/message" \
                    -H "Content-Type: application/json" \
                    -d "{\"target\":\"00\",\"message\":\"concurrent_${level}_${i}\"}" \
                    >/dev/null 2>&1
            ) &
            pids+=($!)
        done

        # すべてのリクエスト完了を待つ
        for pid in "${pids[@]}"; do
            wait $pid 2>/dev/null || true
        done

        local end_time=$(date +%s%N)
        local elapsed=$((($end_time - $start_time) / 1000000))

        echo "${elapsed}ms (平均: $((elapsed / level))ms/req)"

        PERF_RESULTS["concurrent_${level}"]="${elapsed}ms total, $((elapsed / level))ms/req"
    done

    ((PERF_TESTS_RUN++))
}

# テスト4: メモリ使用量測定
test_memory_usage() {
    log_perf "メモリ使用量測定"

    # HTTPサーバーのPIDを取得
    local pid_file="${SCRIPT_DIR}/.mas_http.pid"
    if [ ! -f "$pid_file" ]; then
        echo -e "  ${YELLOW}警告:${NC} HTTPサーバーのPIDファイルが見つかりません"
        return
    fi

    local http_pid=$(cat "$pid_file")

    # 初期メモリ使用量
    local initial_mem=$(ps -o rss= -p "$http_pid" 2>/dev/null || echo "0")
    initial_mem=$((initial_mem / 1024)) # MBに変換

    echo "  初期メモリ: ${initial_mem}MB"

    # 負荷をかける
    echo -n "  1000リクエスト送信中..."
    for i in {1..1000}; do
        curl -s -X POST "$BASE_URL/message" \
            -H "Content-Type: application/json" \
            -d "{\"target\":\"00\",\"message\":\"memory test ${i}\"}" \
            >/dev/null 2>&1 &

        if [ $((i % 100)) -eq 0 ]; then
            wait # バッファをクリア
        fi
    done
    wait
    echo " 完了"

    # 負荷後のメモリ使用量
    local after_mem=$(ps -o rss= -p "$http_pid" 2>/dev/null || echo "0")
    after_mem=$((after_mem / 1024)) # MBに変換

    local mem_increase=$((after_mem - initial_mem))

    echo -e "  ${BLUE}結果:${NC} 初期: ${initial_mem}MB → 負荷後: ${after_mem}MB (増加: ${mem_increase}MB)"

    PERF_RESULTS["memory"]="Initial: ${initial_mem}MB, After: ${after_mem}MB, Increase: ${mem_increase}MB"
    ((PERF_TESTS_RUN++))
}

# テスト5: CPU使用率測定
test_cpu_usage() {
    log_perf "CPU使用率測定"

    local pid_file="${SCRIPT_DIR}/.mas_http.pid"
    if [ ! -f "$pid_file" ]; then
        echo -e "  ${YELLOW}警告:${NC} HTTPサーバーのPIDファイルが見つかりません"
        return
    fi

    local http_pid=$(cat "$pid_file")

    echo -n "  10秒間のCPU使用率測定中..."

    # topコマンドでCPU使用率を10秒間測定
    local cpu_samples=()
    for i in {1..10}; do
        local cpu=$(ps -o %cpu= -p "$http_pid" 2>/dev/null || echo "0")
        cpu_samples+=($cpu)

        # バックグラウンドで負荷をかける
        for j in {1..10}; do
            curl -s -X POST "$BASE_URL/message" \
                -H "Content-Type: application/json" \
                -d '{"target":"00","message":"cpu test"}' \
                >/dev/null 2>&1 &
        done

        sleep 1
    done
    wait

    echo " 完了"

    # 平均CPU使用率を計算
    local total_cpu=0
    for cpu in "${cpu_samples[@]}"; do
        total_cpu=$(echo "$total_cpu + $cpu" | bc)
    done
    local avg_cpu=$(echo "scale=2; $total_cpu / ${#cpu_samples[@]}" | bc)

    echo -e "  ${BLUE}結果:${NC} 平均CPU使用率: ${avg_cpu}%"

    PERF_RESULTS["cpu"]="Average: ${avg_cpu}%"
    ((PERF_TESTS_RUN++))
}

# テスト6: レイテンシ分布
test_latency_distribution() {
    log_perf "レイテンシ分布測定"

    local iterations=1000
    local times=()
    local buckets=(0 10 20 50 100 200 500 1000) # ミリ秒

    echo "  ${iterations}リクエスト実行中..."

    for i in $(seq 1 $iterations); do
        if [ $((i % 100)) -eq 0 ]; then
            echo -n "."
        fi

        local start=$(date +%s%N)
        curl -s -X POST "$BASE_URL/message" \
            -H "Content-Type: application/json" \
            -d '{"target":"00","message":"latency test"}' \
            >/dev/null 2>&1
        local end=$(date +%s%N)

        local latency=$((($end - $start) / 1000000))
        times+=($latency)
    done
    echo " 完了"

    # 分布を計算
    echo "  レイテンシ分布:"
    for i in $(seq 0 $((${#buckets[@]} - 2))); do
        local lower=${buckets[$i]}
        local upper=${buckets[$((i + 1))]}
        local count=0

        for time in "${times[@]}"; do
            if [ $time -ge $lower ] && [ $time -lt $upper ]; then
                ((count++))
            fi
        done

        local percentage=$((count * 100 / iterations))
        printf "    %4d-%4dms: %3d%% " $lower $upper $percentage

        # バーグラフ
        for j in $(seq 1 $((percentage / 2))); do
            echo -n "█"
        done
        echo ""
    done

    # 1000ms以上
    local count=0
    for time in "${times[@]}"; do
        if [ $time -ge 1000 ]; then
            ((count++))
        fi
    done
    local percentage=$((count * 100 / iterations))
    printf "    >1000ms:    %3d%% " $percentage
    for j in $(seq 1 $((percentage / 2))); do
        echo -n "█"
    done
    echo ""

    local stats=$(calculate_stats times)
    echo -e "  ${BLUE}統計:${NC} $stats"

    PERF_RESULTS["latency_dist"]="$stats"
    ((PERF_TESTS_RUN++))
}

# テスト7: エラーレート測定
test_error_rate() {
    log_perf "エラーレート測定（高負荷時）"

    local total_requests=1000
    local concurrent=50
    local success=0
    local errors=0
    local temp_dir="/tmp/mas_perf_test_$$"

    mkdir -p "$temp_dir"

    echo -n "  ${total_requests}リクエスト (並行度${concurrent}) 送信中..."

    for i in $(seq 1 $total_requests); do
        (
            local response=$(curl -s -o /dev/null -w "%{http_code}" \
                -X POST "$BASE_URL/message" \
                -H "Content-Type: application/json" \
                -d '{"target":"00","message":"error rate test"}' \
                --max-time 5 2>/dev/null || echo "ERROR")

            echo "$response" > "$temp_dir/req_${i}.txt"
        ) &

        # 並行度を制限
        while [ $(jobs -r | wc -l) -ge $concurrent ]; do
            sleep 0.01
        done
    done

    wait # すべてのジョブを待つ
    echo " 完了"

    # 結果を集計
    for i in $(seq 1 $total_requests); do
        if [ -f "$temp_dir/req_${i}.txt" ]; then
            local response=$(cat "$temp_dir/req_${i}.txt")
            if [ "$response" = "200" ]; then
                ((success++))
            else
                ((errors++))
            fi
        else
            ((errors++))
        fi
    done

    rm -rf "$temp_dir"

    local error_rate=$(echo "scale=2; $errors * 100 / $total_requests" | bc)
    local success_rate=$(echo "scale=2; $success * 100 / $total_requests" | bc)

    echo -e "  ${BLUE}結果:${NC} 成功: ${success}/${total_requests} (${success_rate}%), エラー: ${errors} (${error_rate}%)"

    PERF_RESULTS["error_rate"]="Success: ${success_rate}%, Error: ${error_rate}%"
    ((PERF_TESTS_RUN++))
}

# テスト8: リソースリーク検出
test_resource_leak() {
    log_perf "リソースリーク検出（長時間実行）"

    local pid_file="${SCRIPT_DIR}/.mas_http.pid"
    if [ ! -f "$pid_file" ]; then
        echo -e "  ${YELLOW}警告:${NC} HTTPサーバーのPIDファイルが見つかりません"
        return
    fi

    local http_pid=$(cat "$pid_file")
    local duration=30 # 30秒間のテスト
    local samples=()

    echo "  ${duration}秒間のリソース監視中..."

    for i in $(seq 1 $duration); do
        # メモリ使用量を記録
        local mem=$(ps -o rss= -p "$http_pid" 2>/dev/null || echo "0")
        mem=$((mem / 1024)) # MBに変換
        samples+=($mem)

        # 負荷をかける
        for j in {1..10}; do
            curl -s -X POST "$BASE_URL/message" \
                -H "Content-Type: application/json" \
                -d '{"target":"00","message":"leak test"}' \
                >/dev/null 2>&1 &
        done

        sleep 1

        # プログレス表示
        if [ $((i % 5)) -eq 0 ]; then
            echo -n "."
        fi
    done
    wait
    echo " 完了"

    # メモリ増加傾向を分析
    local first_half_avg=0
    local second_half_avg=0
    local half=$((duration / 2))

    for i in $(seq 0 $((half - 1))); do
        first_half_avg=$((first_half_avg + samples[$i]))
    done
    first_half_avg=$((first_half_avg / half))

    for i in $(seq $half $((duration - 1))); do
        second_half_avg=$((second_half_avg + samples[$i]))
    done
    second_half_avg=$((second_half_avg / (duration - half)))

    local increase=$((second_half_avg - first_half_avg))

    if [ $increase -gt 10 ]; then
        echo -e "  ${YELLOW}警告:${NC} メモリリークの可能性 (増加: ${increase}MB)"
    else
        echo -e "  ${GREEN}良好:${NC} メモリリークは検出されませんでした"
    fi

    echo -e "  ${BLUE}結果:${NC} 前半平均: ${first_half_avg}MB, 後半平均: ${second_half_avg}MB, 増加: ${increase}MB"

    PERF_RESULTS["resource_leak"]="First half: ${first_half_avg}MB, Second half: ${second_half_avg}MB, Increase: ${increase}MB"
    ((PERF_TESTS_RUN++))
}

# パフォーマンステスト結果の表示
show_performance_summary() {
    echo ""
    echo "========================================="
    echo "パフォーマンステスト結果サマリー"
    echo "========================================="

    for key in "${!PERF_RESULTS[@]}"; do
        echo -e "${MAGENTA}${key}:${NC}"
        echo "  ${PERF_RESULTS[$key]}"
    done

    echo ""
    echo "テスト実行数: ${PERF_TESTS_RUN}"

    # パフォーマンス評価
    echo ""
    echo "パフォーマンス評価:"

    # HTTPレスポンスタイムの評価
    if [[ ${PERF_RESULTS["http_response"]} =~ Avg:\ ([0-9]+)ms ]]; then
        local avg_response="${BASH_REMATCH[1]}"
        if [ "$avg_response" -lt 50 ]; then
            echo -e "  ${GREEN}●${NC} HTTPレスポンス: 優秀 (<50ms)"
        elif [ "$avg_response" -lt 100 ]; then
            echo -e "  ${YELLOW}●${NC} HTTPレスポンス: 良好 (<100ms)"
        else
            echo -e "  ${RED}●${NC} HTTPレスポンス: 要改善 (>100ms)"
        fi
    fi

    # スループットの評価
    if [[ ${PERF_RESULTS["throughput"]} =~ ([0-9]+)\ req/s ]]; then
        local throughput="${BASH_REMATCH[1]}"
        if [ "$throughput" -gt 100 ]; then
            echo -e "  ${GREEN}●${NC} スループット: 優秀 (>100 req/s)"
        elif [ "$throughput" -gt 50 ]; then
            echo -e "  ${YELLOW}●${NC} スループット: 良好 (>50 req/s)"
        else
            echo -e "  ${RED}●${NC} スループット: 要改善 (<50 req/s)"
        fi
    fi

    # エラーレートの評価
    if [[ ${PERF_RESULTS["error_rate"]} =~ Error:\ ([0-9.]+)% ]]; then
        local error_rate="${BASH_REMATCH[1]}"
        if (( $(echo "$error_rate < 1" | bc -l) )); then
            echo -e "  ${GREEN}●${NC} エラーレート: 優秀 (<1%)"
        elif (( $(echo "$error_rate < 5" | bc -l) )); then
            echo -e "  ${YELLOW}●${NC} エラーレート: 良好 (<5%)"
        else
            echo -e "  ${RED}●${NC} エラーレート: 要改善 (>5%)"
        fi
    fi
}

# メイン実行
main() {
    echo "===================================="
    echo "MAS パフォーマンステストスイート"
    echo "===================================="
    echo ""

    # HTTPサーバーの確認
    if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" >/dev/null 2>&1; then
        log_warning "HTTPサーバーが起動していません"
        echo "HTTPサーバーを起動してください: ./mas.sh start"
        exit 1
    fi

    echo "パフォーマンステスト実行中..."
    echo "------------------------------------"

    # 各テストを実行
    test_http_response_time
    echo ""
    test_message_throughput
    echo ""
    test_concurrent_performance
    echo ""
    test_memory_usage
    echo ""
    test_cpu_usage
    echo ""
    test_latency_distribution
    echo ""
    test_error_rate
    echo ""
    test_resource_leak

    # 結果サマリー表示
    show_performance_summary

    echo ""
    echo -e "${GREEN}パフォーマンステストが完了しました${NC}"
}

# スクリプト実行
main "$@"