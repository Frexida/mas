#!/usr/bin/env bash

# mas.sh - Multi-Agent System 統合起動スクリプト
# Unit初期化、tmuxセッション作成、clauded起動を統合

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

Multi-Agent System の統合起動スクリプト

オプション:
  --skip-init    Unit初期化をスキップ
  --no-attach    tmuxセッションにアタッチしない
  -h, --help     このヘルプを表示

説明:
  1. Unit初期化 (init_unit.sh) - 既に初期化済みならスキップ
  2. tmuxセッション作成とペイン分割
  3. 各unitディレクトリでclaudedを起動
  4. セッションにアタッチ（オプション）

EOF
    exit 0
}

# tmuxセッションが存在するか確認
session_exists() {
    tmux has-session -t "$SESSION_NAME" 2>/dev/null
}

# tmuxセッションとペイン作成
create_tmux_session() {
    print_info "tmuxセッション '$SESSION_NAME' を作成中..."

    # セッション作成
    tmux new-session -d -s "$SESSION_NAME" -n main

    # 画面を4分割
    # まず垂直に分割（左右）
    tmux split-window -h -t "$SESSION_NAME:main"

    # 左側を水平に分割（上下）
    tmux split-window -v -t "$SESSION_NAME:main.0"

    # 右側を水平に分割（上下）
    tmux split-window -v -t "$SESSION_NAME:main.2"

    # レイアウトを整える（4つのペインを均等に配置）
    tmux select-layout -t "$SESSION_NAME:main" tiled

    print_success "tmuxセッション作成完了（4ペイン）"
}

# 各ペインでclaudedを起動
start_clauded_in_panes() {
    print_info "各ペインでclaudedを起動中..."

    # Pane 0: Manager (Opus)
    tmux send-keys -t "$SESSION_NAME:main.0" "echo '=== Starting Manager Agent (Unit 0) with Opus ==='" C-m
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:main.0" "cd $SCRIPT_DIR/unit/0" C-m
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:main.0" "clauded --model opus" C-m
    print_success "Manager (Pane 0) 起動"

    sleep 1

    # Pane 1: Development Worker (Sonnet)
    tmux send-keys -t "$SESSION_NAME:main.1" "echo '=== Starting Development Worker (Unit 1) with Sonnet ==='" C-m
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:main.1" "cd $SCRIPT_DIR/unit/1" C-m
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:main.1" "clauded --model sonnet" C-m
    print_success "Development Worker (Pane 1) 起動"

    sleep 1

    # Pane 2: Design Worker (Sonnet)
    tmux send-keys -t "$SESSION_NAME:main.2" "echo '=== Starting Design Worker (Unit 2) with Sonnet ==='" C-m
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:main.2" "cd $SCRIPT_DIR/unit/2" C-m
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:main.2" "clauded --model sonnet" C-m
    print_success "Design Worker (Pane 2) 起動"

    sleep 1

    # Pane 3: Accounting Worker (Sonnet)
    tmux send-keys -t "$SESSION_NAME:main.3" "echo '=== Starting Accounting Worker (Unit 3) with Sonnet ==='" C-m
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:main.3" "cd $SCRIPT_DIR/unit/3" C-m
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:main.3" "clauded --model sonnet" C-m
    print_success "Accounting Worker (Pane 3) 起動"

    print_success "全てのエージェント起動完了"
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

    print_info "=== Multi-Agent System 統合起動 ==="
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

    # Step 4: 各ペインでclauded起動
    start_clauded_in_panes
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
    print_info "次のコマンドが利用可能です:"
    print_info "  メッセージ送信: ./send_message.sh -t manager 'タスク'"
    print_info "  セッション一覧: tmux ls"
    print_info "  セッション削除: tmux kill-session -t $SESSION_NAME"
}

# スクリプト実行
main "$@"