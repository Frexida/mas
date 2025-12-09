#!/bin/bash

# mas-tmux セッション管理スクリプト
# 4分割のtmuxセッションを作成し、各ペインでclaudedを起動

SESSION_NAME="mas-tmux"
CLAUDED_COMMAND="clauded"  # claudedコマンド（独自エイリアス）

# 既存のセッションをチェック
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo "Session '$SESSION_NAME' already exists."

    # ターミナル内かつTMUX外の場合のみアタッチ
    if [ -t 0 ] && [ -z "$TMUX" ]; then
        echo "Attaching to existing session..."
        tmux attach-session -t $SESSION_NAME
    else
        echo "To attach to the session, run: tmux attach -t $SESSION_NAME"
        echo "To kill the session, run: tmux kill-session -t $SESSION_NAME"
    fi
    exit 0
fi

echo "Creating new tmux session: $SESSION_NAME"

# 新しいセッションを作成（デタッチモードで）
tmux new-session -d -s $SESSION_NAME -n main

# ウィンドウを4分割
# 最初に垂直分割（左右に分ける）
tmux split-window -h -t $SESSION_NAME:main

# 左側のペインを水平分割（上下に分ける）
tmux split-window -v -t $SESSION_NAME:main.0

# 右側のペインを水平分割（上下に分ける）
tmux split-window -v -t $SESSION_NAME:main.2

# レイアウトを均等に調整
tmux select-layout -t $SESSION_NAME:main tiled

# 各ペインでclaudedを起動（モデル指定付き）
echo "Starting clauded in each pane..."

# マネージャー（左上） - Opus モデル
tmux send-keys -t $SESSION_NAME:main.0 "echo '=== Starting Manager Agent (左上) with Opus ==='" C-m
tmux send-keys -t $SESSION_NAME:main.0 "$CLAUDED_COMMAND --model opus" C-m
sleep 1

# 開発ワーカー（左下） - Sonnet モデル
tmux send-keys -t $SESSION_NAME:main.1 "echo '=== Starting Development Worker (左下) with Sonnet ==='" C-m
tmux send-keys -t $SESSION_NAME:main.1 "$CLAUDED_COMMAND --model sonnet" C-m
sleep 1

# デザインワーカー（右上） - Sonnet モデル
tmux send-keys -t $SESSION_NAME:main.2 "echo '=== Starting Design Worker (右上) with Sonnet ==='" C-m
tmux send-keys -t $SESSION_NAME:main.2 "$CLAUDED_COMMAND --model sonnet" C-m
sleep 1

# 経理ワーカー（右下） - Sonnet モデル
tmux send-keys -t $SESSION_NAME:main.3 "echo '=== Starting Accounting Worker (右下) with Sonnet ==='" C-m
tmux send-keys -t $SESSION_NAME:main.3 "$CLAUDED_COMMAND --model sonnet" C-m

echo "All clauded instances started successfully!"

# セッションにアタッチ（ターミナル内の場合のみ）
if [ -t 0 ] && [ -z "$TMUX" ]; then
    echo "Attaching to session '$SESSION_NAME'..."
    tmux attach-session -t $SESSION_NAME
else
    echo "Session '$SESSION_NAME' created successfully!"
    echo "To attach to the session, run: tmux attach -t $SESSION_NAME"
fi