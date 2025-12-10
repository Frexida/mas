#!/usr/bin/env bash

# mas.sh - Multi-Agent System マルチユニット統合起動スクリプト
# 4ウィンドウ×4ペイン構成で13エージェントを管理

set -e  # エラー時に即座に終了

# スクリプトのディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# セッション名の設定
SESSION_NAME="mas-tmux"

# 色付きメッセージ出力用の関数
print_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

print_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

# 使用方法の表示
usage() {
    cat << EOF
使い方: $0 [オプション]

Multi-Agent System マルチユニット構成の統合起動スクリプト

オプション:
  --skip-init    Unit初期化をスキップ
  --no-attach    tmuxセッションにアタッチしない
  -h, --help     このヘルプを表示

システム構成:
  Window 0: マネージャー群（00, 10, 20, 30）
  Window 1: デザインユニット（10, 11, 12, 13）
  Window 2: 開発ユニット（20, 21, 22, 23）
  Window 3: 経営・会計ユニット（30, 31, 32, 33）

EOF
    exit 0
}

# tmuxセッションが存在するか確認
session_exists() {
    tmux has-session -t "$SESSION_NAME" 2>/dev/null
}

# ウィンドウを4ペインに分割
setup_window_panes() {
    local window_name=$1

    # まず垂直に分割（左右）
    tmux split-window -h -t "$SESSION_NAME:$window_name"

    # 左側を水平に分割（上下）
    tmux split-window -v -t "$SESSION_NAME:$window_name.0"

    # 右側を水平に分割（上下）
    tmux split-window -v -t "$SESSION_NAME:$window_name.2"

    # レイアウトを整える（4つのペインを均等に配置）
    tmux select-layout -t "$SESSION_NAME:$window_name" tiled
}

# claudedを起動
start_clauded() {
    local window=$1
    local pane=$2
    local unit=$3
    local name=$4
    local model=$5

    tmux send-keys -t "$SESSION_NAME:$window.$pane" "echo '=== Starting $name (Unit $unit) with $model ==='" C-m
    sleep 0.3
    tmux send-keys -t "$SESSION_NAME:$window.$pane" "cd $SCRIPT_DIR/unit/$unit" C-m
    sleep 0.3
    tmux send-keys -t "$SESSION_NAME:$window.$pane" "clauded --model $model" C-m
}

# tmuxセッションとウィンドウ作成
create_tmux_session() {
    print_info "tmuxセッション '$SESSION_NAME' を作成中..."

    # セッション作成（Window 0: managers）
    tmux new-session -d -s "$SESSION_NAME" -n managers
    setup_window_panes managers

    # Window 1: design
    tmux new-window -t "$SESSION_NAME:1" -n design
    setup_window_panes design

    # Window 2: development
    tmux new-window -t "$SESSION_NAME:2" -n development
    setup_window_panes development

    # Window 3: business
    tmux new-window -t "$SESSION_NAME:3" -n business
    setup_window_panes business

    print_success "tmuxセッション作成完了（4ウィンドウ×4ペイン）"
}

# 各ウィンドウのエージェント起動
start_all_agents() {
    print_info "13エージェントを起動中..."

    # Window 0: マネージャー群
    print_info "Window 0: マネージャー群を起動..."
    start_clauded "managers" 0 "00" "メタマネージャー" "opus"
    start_clauded "managers" 1 "10" "デザインマネージャー" "opus"
    start_clauded "managers" 2 "20" "開発マネージャー" "opus"
    start_clauded "managers" 3 "30" "経営・会計マネージャー" "opus"
    print_success "マネージャー群起動完了"

    sleep 1

    # Window 1: デザインユニット
    print_info "Window 1: デザインユニットを起動..."
    start_clauded "design" 0 "10" "デザインマネージャー" "opus"
    start_clauded "design" 1 "11" "UIデザイナー" "sonnet"
    start_clauded "design" 2 "12" "UXデザイナー" "sonnet"
    start_clauded "design" 3 "13" "ビジュアルデザイナー" "sonnet"
    print_success "デザインユニット起動完了"

    sleep 1

    # Window 2: 開発ユニット
    print_info "Window 2: 開発ユニットを起動..."
    start_clauded "development" 0 "20" "開発マネージャー" "opus"
    start_clauded "development" 1 "21" "フロントエンド開発" "sonnet"
    start_clauded "development" 2 "22" "バックエンド開発" "sonnet"
    start_clauded "development" 3 "23" "DevOps" "sonnet"
    print_success "開発ユニット起動完了"

    sleep 1

    # Window 3: 経営・会計ユニット
    print_info "Window 3: 経営・会計ユニットを起動..."
    start_clauded "business" 0 "30" "経営・会計マネージャー" "opus"
    start_clauded "business" 1 "31" "会計担当" "sonnet"
    start_clauded "business" 2 "32" "戦略担当" "sonnet"
    start_clauded "business" 3 "33" "分析担当" "sonnet"
    print_success "経営・会計ユニット起動完了"

    print_success "全13エージェント起動完了"
}

# メイン処理
main() {
    local skip_init=false
    local no_attach=false

    # オプション解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-init)
                skip_init=true
                shift
                ;;
            --no-attach)
                no_attach=true
                shift
                ;;
            -h|--help)
                usage
                ;;
            *)
                print_error "不明なオプション: $1"
                usage
                ;;
        esac
    done

    print_info "=== Multi-Agent System マルチユニット統合起動 ==="
    echo ""

    # Step 1: Unit初期化（スキップ可能）
    if [ "$skip_init" = false ]; then
        print_info "Unit初期化を実行中..."

        if [ -x "$SCRIPT_DIR/init_unit.sh" ]; then
            # init_unit.shは冪等性があるため、既に初期化済みでも安全
            if "$SCRIPT_DIR/init_unit.sh"; then
                print_success "Unit初期化完了（またはスキップ）"
            else
                print_error "Unit初期化に失敗しました"
                exit 1
            fi
        else
            print_error "init_unit.sh が見つからないか実行可能ではありません"
            print_info "手動で実行してください: ./init_unit.sh"
        fi
    else
        print_warning "Unit初期化をスキップしました"
    fi

    echo ""

    # Step 2: 既存セッションの確認
    if session_exists; then
        print_warning "セッション '$SESSION_NAME' は既に存在します"
        print_info "既存セッションにアタッチする場合: tmux attach -t $SESSION_NAME"
        print_info "既存セッションを削除する場合: tmux kill-session -t $SESSION_NAME"
        exit 0
    fi

    # Step 3: tmuxセッション作成
    create_tmux_session
    echo ""

    # Step 4: 各エージェント起動
    start_all_agents
    echo ""

    # Step 5: セッションにアタッチ（オプション）
    if [ "$no_attach" = false ]; then
        # ターミナル内かつTMUX外の場合のみアタッチ
        if [ -t 0 ] && [ -z "$TMUX" ]; then
            print_info "tmuxセッションにアタッチ中..."
            tmux attach-session -t "$SESSION_NAME"
        else
            print_info "tmuxセッションが起動しました"
            print_info "アタッチするには: tmux attach -t $SESSION_NAME"
        fi
    else
        print_info "tmuxセッションが起動しました（アタッチなし）"
        print_info "アタッチするには: tmux attach -t $SESSION_NAME"
    fi

    echo ""
    print_success "=== 起動完了 ==="
    print_info "ウィンドウ切り替え:"
    print_info "  Ctrl-b 0 : マネージャー群"
    print_info "  Ctrl-b 1 : デザインユニット"
    print_info "  Ctrl-b 2 : 開発ユニット"
    print_info "  Ctrl-b 3 : 経営・会計ユニット"
    print_info ""
    print_info "メッセージ送信例:"
    print_info "  ./send_message.sh -p 11 'UIデザインタスク'"
    print_info "  ./send_message.sh -p design 'デザインチーム全体へ'"
    print_info "  ./send_message.sh -p managers 'マネージャー会議'"
}

# スクリプト実行
main "$@"