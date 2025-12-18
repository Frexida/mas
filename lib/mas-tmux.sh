#!/usr/bin/env bash

# lib/tmux.sh - Tmux操作専用モジュール
# MAS (Multi-Agent System) のtmux操作を管理

# グローバル設定
TMUX_SESSION_PREFIX="${TMUX_SESSION_PREFIX:-mas-}"
TMUX_DEFAULT_SHELL="${TMUX_DEFAULT_SHELL:-/bin/bash}"

# =============================================================================
# セッション操作
# =============================================================================

# tmuxセッションを作成
create_session() {
    local session_name="$1"
    local first_window_name="${2:-meta}"

    if session_exists "$session_name"; then
        print_warning "Session $session_name already exists"
        return 1
    fi

    tmux new-session -d -s "$session_name" -n "$first_window_name"
    return $?
}

# セッションが存在するか確認
session_exists() {
    local session_name="$1"
    tmux has-session -t "$session_name" 2>/dev/null
}

# セッションを削除
kill_session() {
    local session_name="$1"

    if session_exists "$session_name"; then
        tmux kill-session -t "$session_name"
        return $?
    else
        print_warning "Session $session_name does not exist"
        return 1
    fi
}

# セッション一覧を取得
list_sessions() {
    tmux ls 2>/dev/null | grep "^${TMUX_SESSION_PREFIX}" || true
}

# =============================================================================
# ウィンドウ操作
# =============================================================================

# ウィンドウを作成
create_window() {
    local session_name="$1"
    local window_name="$2"
    local window_index="${3:-}"

    if [ -n "$window_index" ]; then
        tmux new-window -t "$session_name:$window_index" -n "$window_name"
    else
        tmux new-window -t "$session_name" -n "$window_name"
    fi
    return $?
}

# ウィンドウを4ペインに分割
split_window_to_4panes() {
    local session_name="$1"
    local window_name="$2"

    # まず垂直に分割（左右）
    tmux split-window -h -t "$session_name:$window_name"

    # 左側を水平に分割（上下）
    tmux split-window -v -t "$session_name:$window_name.0"

    # 右側を水平に分割（上下）
    tmux split-window -v -t "$session_name:$window_name.2"

    # レイアウトを整える（4つのペインを均等に配置）
    tmux select-layout -t "$session_name:$window_name" tiled

    return $?
}

# =============================================================================
# ペイン操作
# =============================================================================

# ペインにコマンドを送信
send_to_pane() {
    local session_name="$1"
    local window="$2"
    local pane="$3"
    local command="$4"

    # テキストを送信してから、別途Enterキーを送信
    # 対話型アプリケーション（Claude Codeなど）での動作を改善
    tmux send-keys -t "$session_name:$window.$pane" "$command"
    tmux send-keys -t "$session_name:$window.$pane" C-m
    return $?
}

# ペインにキーを送信（Enterなし）
send_keys_to_pane() {
    local session_name="$1"
    local window="$2"
    local pane="$3"
    local keys="$4"

    tmux send-keys -t "$session_name:$window.$pane" "$keys"
    return $?
}

# ペインの状態を取得
get_pane_info() {
    local session_name="$1"
    local window="$2"
    local pane="${3:-}"

    if [ -n "$pane" ]; then
        tmux list-panes -t "$session_name:$window" -F "#{pane_index} #{pane_current_command}" | \
            grep "^$pane "
    else
        tmux list-panes -t "$session_name:$window" -F "#{pane_index} #{pane_current_command}"
    fi
}

# =============================================================================
# アタッチ操作
# =============================================================================

# セッションにアタッチ
attach_session() {
    local session_name="$1"
    local window="${2:-}"

    if ! session_exists "$session_name"; then
        print_error "Session $session_name does not exist"
        return 1
    fi

    if [ -n "$window" ]; then
        tmux attach-session -t "$session_name:$window"
    else
        tmux attach-session -t "$session_name"
    fi
}

# =============================================================================
# ユーティリティ関数
# =============================================================================

# セッション名のサニタイズ（tmuxで使用可能な文字のみに）
sanitize_session_name() {
    local name="$1"
    # tmuxのセッション名として使用できない文字を置換
    echo "$name" | sed 's/[^a-zA-Z0-9_-]/-/g'
}

# デフォルトのウィンドウ構成を作成（MAS用）
create_mas_windows() {
    local session_name="$1"

    # metaウィンドウは既に作成済み（セッション作成時）

    # 他のウィンドウを作成
    create_window "$session_name" "design" 1
    create_window "$session_name" "development" 2
    create_window "$session_name" "business" 3

    # design, development, businessウィンドウを4ペインに分割
    for window in design development business; do
        split_window_to_4panes "$session_name" "$window"
    done

    return $?
}

# =============================================================================
# メッセージ出力関数（mas.shから引き継ぎ）
# =============================================================================

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

# モジュールロード完了メッセージ（デバッグ用）
if [ "${DEBUG_MODULES:-0}" = "1" ]; then
    print_info "Loaded tmux.sh module"
fi