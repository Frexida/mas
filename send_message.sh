#!/bin/bash

# mas-tmux メッセージ送信スクリプト
# 各ペインにメッセージを送信

SESSION_NAME="mas-tmux"

# 使い方を表示する関数
usage() {
    cat << EOF
使い方: ./send_message.sh [オプション] "メッセージ"

オプション:
  -p PANE   送信先ペイン番号 (0-3) または名前
            0 or manager   : マネージャー（左上）
            1 or dev       : 開発ワーカー（左下）
            2 or design    : デザインワーカー（右上）
            3 or accounting: 経理ワーカー（右下）
            all            : 全ペインに送信
  -h        このヘルプを表示

例:
  ./send_message.sh -p manager "タスクを開始してください"
  ./send_message.sh -p 0 "マネージャーへのメッセージ"
  ./send_message.sh -p all "全員へのブロードキャスト"
EOF
    exit 1
}

# セッションの存在確認
check_session() {
    if ! tmux has-session -t $SESSION_NAME 2>/dev/null; then
        echo "Error: Session '$SESSION_NAME' does not exist."
        echo "Run './setup_mas_tmux.sh' first to create the session."
        exit 1
    fi
}

# ペイン番号を変換
get_pane_number() {
    case "$1" in
        0|manager)
            echo 0
            ;;
        1|dev|development)
            echo 1
            ;;
        2|design)
            echo 2
            ;;
        3|accounting)
            echo 3
            ;;
        all)
            echo "all"
            ;;
        *)
            echo "Error: Invalid pane identifier: $1"
            usage
            ;;
    esac
}

# メイン処理
PANE=""
MESSAGE=""

# オプション解析
while getopts "p:h" opt; do
    case $opt in
        p)
            PANE="$OPTARG"
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
if [ -z "$PANE" ] || [ -z "$MESSAGE" ]; then
    echo "Error: Pane and message are required."
    usage
fi

# セッション確認
check_session

# ペイン番号を取得
PANE_NUM=$(get_pane_number "$PANE")

# メッセージ送信
if [ "$PANE_NUM" = "all" ]; then
    echo "Broadcasting message to all panes..."
    for i in 0 1 2 3; do
        tmux send-keys -t $SESSION_NAME:main.$i "$MESSAGE" C-m
    done
    echo "Message sent to all panes."
else
    PANE_NAME=""
    case $PANE_NUM in
        0) PANE_NAME="Manager (左上)" ;;
        1) PANE_NAME="Development Worker (左下)" ;;
        2) PANE_NAME="Design Worker (右上)" ;;
        3) PANE_NAME="Accounting Worker (右下)" ;;
    esac

    echo "Sending message to $PANE_NAME..."
    tmux send-keys -t $SESSION_NAME:main.$PANE_NUM "$MESSAGE" C-m
    echo "Message sent successfully."
fi