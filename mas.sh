#!/usr/bin/env bash

# mas.sh - Multi-Agent System マルチユニット統合管理ツール
# サブコマンド対応版 - 13エージェント管理

set -e  # エラー時に即座に終了

# スクリプトのディレクトリを取得（シンボリックリンク対応）
# readlinkを使って実際のスクリプトパスを解決
SCRIPT_PATH="${BASH_SOURCE[0]}"
if [ -L "$SCRIPT_PATH" ]; then
    # シンボリックリンクの場合、実際のパスを取得
    SCRIPT_PATH="$(readlink -f "$SCRIPT_PATH")"
fi
SCRIPT_DIR="$( cd "$( dirname "$SCRIPT_PATH" )" && pwd )"

# セッション名の設定
SESSION_NAME="mas-tmux"

# バージョン情報
VERSION="2.0.0"

# =============================================================================
# 共通関数
# =============================================================================

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

    # ワークフロー指示書が存在する場合、初期指示として表示
    tmux send-keys -t "$SESSION_NAME:$window.$pane" "if [ -f WORKFLOW_INSTRUCTIONS.md ]; then echo ''; echo '=== ワークフロー指示書を確認してください ==='; echo 'WORKFLOW_INSTRUCTIONS.mdに役割と責任が記載されています'; echo ''; fi" C-m
    sleep 0.3

    tmux send-keys -t "$SESSION_NAME:$window.$pane" "clauded --model $model" C-m
}

# =============================================================================
# ヘルプ関数
# =============================================================================

usage() {
    cat << EOF
mas - Multi-Agent System Manager v${VERSION}

使い方:
  mas [global-options] <subcommand> [options] [arguments]

Global Options:
  -v, --version      バージョン情報を表示
  -h, --help         このヘルプを表示

Subcommands:
  start              Multi-Agent Systemを起動（デフォルト）
  send               エージェントにメッセージを送信
  status             システムの状態を表示
  stop               システムを停止
  attach             既存セッションにアタッチ
  list, ls           全エージェントをリスト表示
  help               サブコマンドのヘルプを表示

各サブコマンドのヘルプ:
  mas help <subcommand>
  mas <subcommand> --help

例:
  mas                                # システムを起動（mas startと同じ）
  mas send -t design "タスク開始"    # デザインユニットにメッセージ
  mas status                         # 状態確認
  mas attach -w design              # デザインウィンドウにアタッチ
  mas stop                          # システム停止

詳細情報:
  README.md を参照してください
EOF
}

usage_start() {
    cat << EOF
mas start - Multi-Agent Systemを起動

使い方:
  mas start [options]
  mas [options]  # startは省略可能（デフォルト）

Options:
  --skip-init        Unit初期化をスキップ
  --no-attach        tmuxセッションにアタッチしない
  -h, --help         このヘルプを表示

説明:
  13体のAIエージェントを4つのtmuxウィンドウで起動します。
  - Window 0: マネージャー群（00, 10, 20, 30）
  - Window 1: デザインユニット（10, 11, 12, 13）
  - Window 2: 開発ユニット（20, 21, 22, 23）
  - Window 3: 経営・会計ユニット（30, 31, 32, 33）

例:
  mas start                    # 通常起動
  mas start --skip-init        # 初期化をスキップ
  mas start --no-attach        # バックグラウンドで起動
  mas --skip-init              # startを省略（後方互換性）
EOF
}

usage_send() {
    cat << EOF
mas send - エージェントにメッセージを送信

使い方:
  mas send [options] "message"

Options:
  -t, --target TARGET   送信先（デフォルト: all）
  -e, --execute         メッセージ送信後にEnterも送信
  -h, --help            このヘルプを表示

Target（送信先）:
  エージェント番号:
    00         メタマネージャー
    10-13      デザインユニット（10:マネージャー、11:UI、12:UX、13:ビジュアル）
    20-23      開発ユニット（20:マネージャー、21:フロント、22:バック、23:DevOps）
    30-33      経営・会計（30:マネージャー、31:会計、32:戦略、33:分析）

  ユニット名:
    design       デザインユニット全体（10-13）
    development  開発ユニット全体（20-23）
    business     経営・会計ユニット全体（30-33）

  グループ名:
    managers     全マネージャー（00, 10, 20, 30）
    all          全エージェント（13体全て）

例:
  mas send -t 11 "UIデザインを開始"
  mas send -t design "チーム会議を開始"
  mas send -t managers -e "/openspec:proposal 新機能"
  mas send "全体連絡事項"  # -t allは省略可能
EOF
}

usage_status() {
    cat << EOF
mas status - システムの状態を表示

使い方:
  mas status [options]

Options:
  -d, --detail       詳細情報を表示
  -h, --help         このヘルプを表示

説明:
  Multi-Agent Systemの実行状態を確認します。
  セッション、ウィンドウ、エージェントの状態を表示します。

例:
  mas status           # 基本的な状態を表示
  mas status --detail  # 詳細情報を含めて表示
EOF
}

usage_stop() {
    cat << EOF
mas stop - システムを停止

使い方:
  mas stop [options]

Options:
  -f, --force        確認なしで強制停止
  -h, --help         このヘルプを表示

説明:
  Multi-Agent Systemのtmuxセッションを終了します。
  全てのエージェントが停止されます。

例:
  mas stop             # 確認後に停止
  mas stop --force     # 即座に停止
EOF
}

usage_attach() {
    cat << EOF
mas attach - 既存セッションにアタッチ

使い方:
  mas attach [options]

Options:
  -w, --window WINDOW   特定のウィンドウにアタッチ
                        (managers/0, design/1, development/2, business/3)
  -h, --help            このヘルプを表示

説明:
  実行中のMulti-Agent Systemセッションに接続します。

例:
  mas attach                # セッションにアタッチ
  mas attach -w design      # デザインウィンドウにアタッチ
  mas attach -w 2           # 開発ウィンドウにアタッチ（番号指定）
EOF
}

usage_list() {
    cat << EOF
mas list - エージェント一覧を表示

使い方:
  mas list [options]
  mas ls [options]    # エイリアス

Options:
  -u, --unit UNIT    特定ユニットのみ表示
  -h, --help         このヘルプを表示

説明:
  全エージェントのID、名前、モデル、役割を一覧表示します。

例:
  mas list              # 全エージェントを表示
  mas ls -u design      # デザインユニットのみ表示
  mas list -u 20        # 開発ユニットのみ表示（番号指定）
EOF
}

# =============================================================================
# サブコマンド実装
# =============================================================================

# start サブコマンド
cmd_start() {
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
                usage_start
                exit 0
                ;;
            *)
                print_error "不明なオプション: $1"
                usage_start
                exit 1
                ;;
        esac
    done

    print_info "=== Multi-Agent System マルチユニット起動 ==="
    echo ""

    # Unit初期化（スキップ可能）
    if [ "$skip_init" = false ]; then
        print_info "Unit初期化を実行中..."

        if [ -x "$SCRIPT_DIR/init_unit.sh" ]; then
            if "$SCRIPT_DIR/init_unit.sh"; then
                print_success "Unit初期化完了（またはスキップ）"
            else
                print_error "Unit初期化に失敗しました"
                exit 1
            fi
        else
            print_error "init_unit.sh が見つからないか実行可能ではありません: $SCRIPT_DIR/init_unit.sh"
            print_info "mas-tmux ディレクトリから実行するか、--skip-init オプションを使用してください"
        fi
    else
        print_warning "Unit初期化をスキップしました"
    fi

    echo ""

    # 既存セッションの確認
    if session_exists; then
        print_warning "セッション '$SESSION_NAME' は既に存在します"
        print_info "既存セッションにアタッチ: mas attach"
        print_info "既存セッションを削除: mas stop"
        exit 0
    fi

    # tmuxセッション作成
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
    echo ""

    # 各エージェント起動
    print_info "13エージェントを起動中..."

    # Window 0: マネージャー群
    print_info "Window 0: マネージャー群を起動..."
    start_clauded "managers" 0 "00" "メタマネージャー" "opus"
    start_clauded "managers" 1 "10" "デザインマネージャー" "opus"
    start_clauded "managers" 2 "20" "開発マネージャー" "opus"
    start_clauded "managers" 3 "30" "経営・会計マネージャー" "opus"

    sleep 1

    # Window 1: デザインユニット
    print_info "Window 1: デザインユニットを起動..."
    start_clauded "design" 0 "10" "デザインマネージャー" "opus"
    start_clauded "design" 1 "11" "UIデザイナー" "sonnet"
    start_clauded "design" 2 "12" "UXデザイナー" "sonnet"
    start_clauded "design" 3 "13" "ビジュアルデザイナー" "sonnet"

    sleep 1

    # Window 2: 開発ユニット
    print_info "Window 2: 開発ユニットを起動..."
    start_clauded "development" 0 "20" "開発マネージャー" "opus"
    start_clauded "development" 1 "21" "フロントエンド開発" "sonnet"
    start_clauded "development" 2 "22" "バックエンド開発" "sonnet"
    start_clauded "development" 3 "23" "DevOps" "sonnet"

    sleep 1

    # Window 3: 経営・会計ユニット
    print_info "Window 3: 経営・会計ユニットを起動..."
    start_clauded "business" 0 "30" "経営・会計マネージャー" "opus"
    start_clauded "business" 1 "31" "会計担当" "sonnet"
    start_clauded "business" 2 "32" "戦略担当" "sonnet"
    start_clauded "business" 3 "33" "分析担当" "sonnet"

    print_success "全13エージェント起動完了"
    echo ""

    # セッションにアタッチ（オプション）
    if [ "$no_attach" = false ]; then
        # ターミナル内かつTMUX外の場合のみアタッチ
        if [ -t 0 ] && [ -z "$TMUX" ]; then
            print_info "tmuxセッションにアタッチ中..."
            tmux attach-session -t "$SESSION_NAME"
        else
            print_info "tmuxセッションが起動しました"
            print_info "アタッチするには: mas attach"
        fi
    else
        print_info "tmuxセッションが起動しました（アタッチなし）"
        print_info "アタッチするには: mas attach"
    fi

    echo ""
    print_success "=== 起動完了 ==="
    print_info "使用可能なコマンド:"
    print_info "  mas send -t design \"タスク\"  # メッセージ送信"
    print_info "  mas status                    # 状態確認"
    print_info "  mas attach                    # セッションにアタッチ"
    print_info "  mas stop                      # システム停止"
}

# send サブコマンド
cmd_send() {
    local target="all"
    local execute=false
    local message=""

    # オプション解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--target)
                if [[ -z "$2" || "$2" =~ ^- ]]; then
                    print_error "ターゲットが指定されていません"
                    usage_send
                    exit 1
                fi
                target="$2"
                shift 2
                ;;
            -e|--execute)
                execute=true
                shift
                ;;
            -h|--help)
                usage_send
                exit 0
                ;;
            -*)
                print_error "不明なオプション: $1"
                usage_send
                exit 1
                ;;
            *)
                message="$1"
                shift
                break
                ;;
        esac
    done

    # メッセージが指定されていない場合
    if [ -z "$message" ]; then
        print_error "メッセージが指定されていません"
        usage_send
        exit 1
    fi

    # send_message.shを呼び出し（配列を使って安全に）
    local cmd_args=("$SCRIPT_DIR/send_message.sh" "-p" "$target")
    if [ "$execute" = true ]; then
        cmd_args+=("-e")
    fi
    cmd_args+=("$message")

    "${cmd_args[@]}"
}

# status サブコマンド
cmd_status() {
    local detail=false

    # オプション解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--detail)
                detail=true
                shift
                ;;
            -h|--help)
                usage_status
                exit 0
                ;;
            *)
                print_error "不明なオプション: $1"
                usage_status
                exit 1
                ;;
        esac
    done

    if ! session_exists; then
        print_warning "セッション '$SESSION_NAME' は実行されていません"
        print_info "起動するには: mas start"
        exit 1
    fi

    print_info "=== Multi-Agent System Status ==="
    echo ""

    # セッション情報
    print_info "Session:"
    tmux display-message -t "$SESSION_NAME" -p "  Name: #S"
    tmux display-message -t "$SESSION_NAME" -p "  Created: #{session_created}"
    echo ""

    # ウィンドウ情報
    print_info "Windows:"
    tmux list-windows -t "$SESSION_NAME" -F "  #{window_index}: #{window_name} (#{window_panes} panes)"
    echo ""

    # エージェントマッピング
    print_info "Agent Mapping:"
    echo "  Window 0 (managers):     00, 10, 20, 30"
    echo "  Window 1 (design):       10, 11, 12, 13"
    echo "  Window 2 (development):  20, 21, 22, 23"
    echo "  Window 3 (business):     30, 31, 32, 33"
    echo ""

    if [ "$detail" = true ]; then
        print_info "Pane Details:"
        for window in managers design development business; do
            echo "  $window window:"
            tmux list-panes -t "$SESSION_NAME:$window" -F "    Pane #{pane_index}: #{pane_width}x#{pane_height} (PID: #{pane_pid})"
        done
    fi

    print_success "System is running"
}

# stop サブコマンド
cmd_stop() {
    local force=false

    # オプション解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--force)
                force=true
                shift
                ;;
            -h|--help)
                usage_stop
                exit 0
                ;;
            *)
                print_error "不明なオプション: $1"
                usage_stop
                exit 1
                ;;
        esac
    done

    if ! session_exists; then
        print_warning "セッション '$SESSION_NAME' は実行されていません"
        exit 0
    fi

    if [ "$force" = false ]; then
        print_warning "Multi-Agent Systemを停止しますか？"
        echo -n "続行するには 'yes' を入力: "
        read -r response
        if [ "$response" != "yes" ]; then
            print_info "キャンセルしました"
            exit 0
        fi
    fi

    print_info "Multi-Agent Systemを停止中..."
    tmux kill-session -t "$SESSION_NAME"
    print_success "システムが停止しました"
}

# attach サブコマンド
cmd_attach() {
    local window=""

    # オプション解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            -w|--window)
                if [[ -z "$2" || "$2" =~ ^- ]]; then
                    print_error "ウィンドウが指定されていません"
                    usage_attach
                    exit 1
                fi
                window="$2"
                shift 2
                ;;
            -h|--help)
                usage_attach
                exit 0
                ;;
            *)
                print_error "不明なオプション: $1"
                usage_attach
                exit 1
                ;;
        esac
    done

    if ! session_exists; then
        print_error "セッション '$SESSION_NAME' は実行されていません"
        print_info "起動するには: mas start"
        exit 1
    fi

    # ウィンドウ名を番号に変換
    case "$window" in
        managers|0) window="0" ;;
        design|1) window="1" ;;
        development|dev|2) window="2" ;;
        business|3) window="3" ;;
        "") ;; # 空の場合はそのまま
        *)
            print_error "不明なウィンドウ: $window"
            print_info "利用可能: managers/0, design/1, development/2, business/3"
            exit 1
            ;;
    esac

    if [ -n "$window" ]; then
        tmux attach-session -t "$SESSION_NAME:$window"
    else
        tmux attach-session -t "$SESSION_NAME"
    fi
}

# list サブコマンド
cmd_list() {
    local unit=""

    # オプション解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--unit)
                if [[ -z "$2" || "$2" =~ ^- ]]; then
                    print_error "ユニットが指定されていません"
                    usage_list
                    exit 1
                fi
                unit="$2"
                shift 2
                ;;
            -h|--help)
                usage_list
                exit 0
                ;;
            *)
                print_error "不明なオプション: $1"
                usage_list
                exit 1
                ;;
        esac
    done

    print_info "=== Multi-Agent System - Agent List ==="
    echo ""

    # ユニット指定がない場合は全て表示
    if [ -z "$unit" ]; then
        echo "Meta Management:"
        echo "  00: メタマネージャー (Opus)"
        echo ""
        echo "Design Unit:"
        echo "  10: デザインマネージャー (Opus)"
        echo "  11: UIデザイナー (Sonnet)"
        echo "  12: UXデザイナー (Sonnet)"
        echo "  13: ビジュアルデザイナー (Sonnet)"
        echo ""
        echo "Development Unit:"
        echo "  20: 開発マネージャー (Opus)"
        echo "  21: フロントエンド開発 (Sonnet)"
        echo "  22: バックエンド開発 (Sonnet)"
        echo "  23: DevOps (Sonnet)"
        echo ""
        echo "Business Unit:"
        echo "  30: 経営・会計マネージャー (Opus)"
        echo "  31: 会計担当 (Sonnet)"
        echo "  32: 戦略担当 (Sonnet)"
        echo "  33: 分析担当 (Sonnet)"
        echo ""
        echo "Total: 13 agents (5 Opus, 8 Sonnet)"
    else
        # 特定ユニットのみ表示
        case "$unit" in
            meta|0|00)
                echo "Meta Management:"
                echo "  00: メタマネージャー (Opus)"
                ;;
            design|1|10)
                echo "Design Unit:"
                echo "  10: デザインマネージャー (Opus)"
                echo "  11: UIデザイナー (Sonnet)"
                echo "  12: UXデザイナー (Sonnet)"
                echo "  13: ビジュアルデザイナー (Sonnet)"
                ;;
            development|dev|2|20)
                echo "Development Unit:"
                echo "  20: 開発マネージャー (Opus)"
                echo "  21: フロントエンド開発 (Sonnet)"
                echo "  22: バックエンド開発 (Sonnet)"
                echo "  23: DevOps (Sonnet)"
                ;;
            business|3|30)
                echo "Business Unit:"
                echo "  30: 経営・会計マネージャー (Opus)"
                echo "  31: 会計担当 (Sonnet)"
                echo "  32: 戦略担当 (Sonnet)"
                echo "  33: 分析担当 (Sonnet)"
                ;;
            *)
                print_error "不明なユニット: $unit"
                print_info "利用可能: meta, design, development, business"
                exit 1
                ;;
        esac
    fi
}

# help サブコマンド
cmd_help() {
    local subcommand="${1:-}"

    if [ -z "$subcommand" ]; then
        usage
        exit 0
    fi

    case "$subcommand" in
        start) usage_start ;;
        send) usage_send ;;
        status) usage_status ;;
        stop) usage_stop ;;
        attach) usage_attach ;;
        list|ls) usage_list ;;
        help) usage ;;
        *)
            print_error "不明なサブコマンド: $subcommand"
            usage
            exit 1
            ;;
    esac
    exit 0
}

# =============================================================================
# メイン処理
# =============================================================================

main() {
    # グローバルオプションの処理
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--version)
                echo "mas version $VERSION"
                exit 0
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            --skip-init|--no-attach)
                # これらは後方互換性のためstartサブコマンドとして扱う
                cmd_start "$@"
                exit $?
                ;;
            -*)
                print_error "不明なグローバルオプション: $1"
                usage
                exit 1
                ;;
            *)
                # オプション以外が来たらサブコマンドとして処理
                break
                ;;
        esac
    done

    # サブコマンド取得（デフォルトはstart）
    SUBCOMMAND="${1:-start}"
    shift || true

    # サブコマンドディスパッチ
    case "$SUBCOMMAND" in
        start)
            cmd_start "$@"
            ;;
        send)
            cmd_send "$@"
            ;;
        status)
            cmd_status "$@"
            ;;
        stop)
            cmd_stop "$@"
            ;;
        attach)
            cmd_attach "$@"
            ;;
        list|ls)
            cmd_list "$@"
            ;;
        help)
            cmd_help "$@"
            ;;
        *)
            print_error "不明なサブコマンド: $SUBCOMMAND"
            usage
            exit 1
            ;;
    esac
}

# スクリプト実行
main "$@"