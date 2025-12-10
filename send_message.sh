#!/usr/bin/env bash

# mas-tmux マルチユニット メッセージ送信スクリプト
# 13エージェントへの柔軟なメッセージルーティング

SESSION_NAME="mas-tmux"

# 使い方を表示する関数
usage() {
    cat << EOF
使い方: ./send_message.sh [オプション] "メッセージ"

オプション:
  -p TARGET  送信先（エージェント番号、ユニット名、グループ名）

  エージェント番号（2桁）:
    00: メタマネージャー
    10: デザインマネージャー       11-13: デザインワーカー
    20: 開発マネージャー           21-23: 開発ワーカー
    30: 経営・会計マネージャー     31-33: 経営・会計ワーカー

  ユニット名:
    design     : デザインユニット全体（10-13）
    development: 開発ユニット全体（20-23）
    business   : 経営・会計ユニット全体（30-33）

  グループ名:
    managers   : 全マネージャー（00, 10, 20, 30）
    all        : 全エージェント（13体全て）

  -e         メッセージ送信後にEnterキーも送信（実行）
  -h         このヘルプを表示

例:
  ./send_message.sh -p 11 "UIデザインのタスク"
  ./send_message.sh -p design "デザインチーム全体への通知"
  ./send_message.sh -p managers -e "マネージャー会議を開始"
  ./send_message.sh -p all "全エージェントへのお知らせ"
EOF
    exit 1
}

# セッションの存在確認
check_session() {
    if ! tmux has-session -t $SESSION_NAME 2>/dev/null; then
        echo "Error: Session '$SESSION_NAME' does not exist."
        echo "Run './mas.sh' first to create the session."
        exit 1
    fi
}

# エージェント番号からウィンドウとペインを取得
get_window_and_pane() {
    local agent=$1

    case "$agent" in
        # Window 0: マネージャー群
        00) echo "managers.0" ;;  # メタマネージャー
        10) echo "managers.1" ;;  # デザインマネージャー（マネージャービュー）
        20) echo "managers.2" ;;  # 開発マネージャー（マネージャービュー）
        30) echo "managers.3" ;;  # 経営・会計マネージャー（マネージャービュー）

        # Window 1: デザインユニット
        11) echo "design.1" ;;    # UIデザイナー
        12) echo "design.2" ;;    # UXデザイナー
        13) echo "design.3" ;;    # ビジュアルデザイナー

        # Window 2: 開発ユニット
        21) echo "development.1" ;; # フロントエンド
        22) echo "development.2" ;; # バックエンド
        23) echo "development.3" ;; # DevOps

        # Window 3: 経営・会計ユニット
        31) echo "business.1" ;;   # 会計
        32) echo "business.2" ;;   # 戦略
        33) echo "business.3" ;;   # 分析

        *)
            echo ""
            ;;
    esac
}

# ターゲットをエージェントリストに変換
expand_target() {
    local target=$1

    case "$target" in
        # 個別エージェント（2桁番号）
        [0-3][0-3])
            echo "$target"
            ;;

        # ユニット単位
        design)
            echo "10 11 12 13"
            ;;
        development|dev)
            echo "20 21 22 23"
            ;;
        business|accounting)
            echo "30 31 32 33"
            ;;

        # グループ単位
        managers)
            echo "00 10 20 30"
            ;;
        all)
            echo "00 10 11 12 13 20 21 22 23 30 31 32 33"
            ;;

        *)
            echo "Error: Invalid target: $target"
            usage
            ;;
    esac
}

# メッセージを送信
send_to_agent() {
    local agent=$1
    local message=$2
    local execute=$3

    # ウィンドウとペインを取得
    local window_pane=$(get_window_and_pane "$agent")

    if [ -z "$window_pane" ]; then
        echo "Warning: Agent $agent not found in current configuration"
        return 1
    fi

    # メッセージ送信
    tmux send-keys -t "$SESSION_NAME:$window_pane" "$message"

    # -eオプションがある場合のみEnterを送信
    if [ "$execute" = true ]; then
        tmux send-keys -t "$SESSION_NAME:$window_pane" C-m
    fi

    return 0
}

# エージェント名を取得
get_agent_name() {
    local agent=$1

    case "$agent" in
        00) echo "メタマネージャー" ;;
        10) echo "デザインマネージャー" ;;
        11) echo "UIデザイナー" ;;
        12) echo "UXデザイナー" ;;
        13) echo "ビジュアルデザイナー" ;;
        20) echo "開発マネージャー" ;;
        21) echo "フロントエンド開発" ;;
        22) echo "バックエンド開発" ;;
        23) echo "DevOps" ;;
        30) echo "経営・会計マネージャー" ;;
        31) echo "会計担当" ;;
        32) echo "戦略担当" ;;
        33) echo "分析担当" ;;
        *) echo "Unknown Agent $agent" ;;
    esac
}

# メイン処理
TARGET=""
MESSAGE=""
EXECUTE=false

# オプション解析
while getopts "p:eh" opt; do
    case $opt in
        p)
            TARGET="$OPTARG"
            ;;
        e)
            EXECUTE=true
            ;;
        h)
            usage
            ;;
        \?)
            usage
            ;;
    esac
done

shift $((OPTIND-1))
MESSAGE="$1"

# 引数チェック
if [ -z "$TARGET" ] || [ -z "$MESSAGE" ]; then
    echo "Error: Target and message are required."
    usage
fi

# セッション確認
check_session

# ターゲットをエージェントリストに展開
AGENTS=$(expand_target "$TARGET")

# エージェント数をカウント
AGENT_COUNT=$(echo $AGENTS | wc -w)

if [ $AGENT_COUNT -eq 1 ]; then
    # 単一エージェントへの送信
    AGENT_NAME=$(get_agent_name "$AGENTS")
    echo "Sending message to $AGENT_NAME (Unit $AGENTS)..."
    if send_to_agent "$AGENTS" "$MESSAGE" "$EXECUTE"; then
        echo "Message sent successfully."
    else
        echo "Failed to send message."
        exit 1
    fi
else
    # 複数エージェントへの送信
    echo "Broadcasting message to $AGENT_COUNT agents..."
    SUCCESS_COUNT=0

    for agent in $AGENTS; do
        AGENT_NAME=$(get_agent_name "$agent")
        echo -n "  → $AGENT_NAME (Unit $agent)... "
        if send_to_agent "$agent" "$MESSAGE" "$EXECUTE"; then
            echo "OK"
            ((SUCCESS_COUNT++))
        else
            echo "SKIP"
        fi
    done

    echo "Message sent to $SUCCESS_COUNT/$AGENT_COUNT agents."
fi