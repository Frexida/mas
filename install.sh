#!/usr/bin/env bash

# install.sh - mas-tmux インストールスクリプト
# masコマンドをシステムにインストールする

set -e  # エラー時に即座に終了

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

# スクリプトのディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# インストール先の設定
INSTALL_DIR="$HOME/.local/bin"
COMMAND_NAME="mas"

# 使用方法の表示
usage() {
    cat << EOF
使い方: $0 [オプション]

mas-tmux システムをインストールします

オプション:
  --uninstall    アンインストール
  -h, --help     このヘルプを表示

説明:
  mas.sh を 'mas' コマンドとして ~/.local/bin にシンボリックリンクを作成します。
  ~/.local/bin がPATHに含まれていない場合は、自動的に設定を提案します。

EOF
    exit 0
}

# アンインストール処理
uninstall() {
    print_info "masコマンドをアンインストール中..."

    if [ -L "$INSTALL_DIR/$COMMAND_NAME" ]; then
        rm "$INSTALL_DIR/$COMMAND_NAME"
        print_success "シンボリックリンクを削除しました: $INSTALL_DIR/$COMMAND_NAME"
    else
        print_warning "masコマンドは見つかりませんでした"
    fi

    print_success "アンインストール完了"
    exit 0
}

# PATHにディレクトリが含まれているか確認
check_path() {
    if [[ ":$PATH:" == *":$INSTALL_DIR:"* ]]; then
        return 0
    else
        return 1
    fi
}

# シェル設定ファイルにPATH設定を追加する関数
add_to_path() {
    local shell_config=""

    # 使用しているシェルを検出
    if [ -n "$BASH_VERSION" ]; then
        if [ -f "$HOME/.bashrc" ]; then
            shell_config="$HOME/.bashrc"
        elif [ -f "$HOME/.bash_profile" ]; then
            shell_config="$HOME/.bash_profile"
        fi
    elif [ -n "$ZSH_VERSION" ]; then
        shell_config="$HOME/.zshrc"
    fi

    if [ -n "$shell_config" ]; then
        print_info "PATHに $INSTALL_DIR を追加します"
        echo "" >> "$shell_config"
        echo "# mas-tmux command path" >> "$shell_config"
        echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$shell_config"
        print_success "$shell_config にPATH設定を追加しました"
        print_warning "新しいターミナルを開くか、以下のコマンドを実行してください:"
        print_info "source $shell_config"
    else
        print_warning "シェル設定ファイルが見つかりませんでした"
        print_info "以下をシェル設定ファイルに追加してください:"
        print_info "export PATH=\"\$HOME/.local/bin:\$PATH\""
    fi
}

# メイン処理
main() {
    # オプション解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            --uninstall)
                uninstall
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

    print_info "=== mas-tmux インストール ==="

    # インストール先ディレクトリの作成
    if [ ! -d "$INSTALL_DIR" ]; then
        print_info "$INSTALL_DIR を作成中..."
        mkdir -p "$INSTALL_DIR"
        print_success "ディレクトリを作成しました"
    fi

    # mas.shの存在確認
    if [ ! -f "$SCRIPT_DIR/mas.sh" ]; then
        print_error "mas.sh が見つかりません: $SCRIPT_DIR/mas.sh"
        exit 1
    fi

    # 実行権限の確認と付与
    if [ ! -x "$SCRIPT_DIR/mas.sh" ]; then
        print_info "mas.sh に実行権限を付与中..."
        chmod +x "$SCRIPT_DIR/mas.sh"
        print_success "実行権限を付与しました"
    fi

    # init_unit.shの実行権限も確認
    if [ -f "$SCRIPT_DIR/init_unit.sh" ] && [ ! -x "$SCRIPT_DIR/init_unit.sh" ]; then
        chmod +x "$SCRIPT_DIR/init_unit.sh"
        print_success "init_unit.sh に実行権限を付与しました"
    fi

    # send_message.shの実行権限も確認
    if [ -f "$SCRIPT_DIR/send_message.sh" ] && [ ! -x "$SCRIPT_DIR/send_message.sh" ]; then
        chmod +x "$SCRIPT_DIR/send_message.sh"
        print_success "send_message.sh に実行権限を付与しました"
    fi

    # シンボリックリンクの作成
    print_info "シンボリックリンクを作成中..."

    # 既存のリンクまたはファイルがある場合は削除
    if [ -e "$INSTALL_DIR/$COMMAND_NAME" ]; then
        print_warning "既存の $COMMAND_NAME を上書きします"
        rm -f "$INSTALL_DIR/$COMMAND_NAME"
    fi

    # シンボリックリンクを作成
    ln -s "$SCRIPT_DIR/mas.sh" "$INSTALL_DIR/$COMMAND_NAME"
    print_success "シンボリックリンクを作成しました: $INSTALL_DIR/$COMMAND_NAME -> $SCRIPT_DIR/mas.sh"

    # PATHの確認
    if ! check_path; then
        print_warning "$INSTALL_DIR がPATHに含まれていません"
        add_to_path
    else
        print_success "$INSTALL_DIR はPATHに含まれています"
    fi

    echo ""
    print_success "=== インストール完了 ==="

    # 動作確認
    if check_path && command -v mas &> /dev/null; then
        print_success "masコマンドが利用可能です"
    else
        print_info "新しいターミナルを開くか、以下のコマンドを実行してください:"
        print_info "export PATH=\"\$HOME/.local/bin:\$PATH\""
    fi

    echo ""
    print_info "使用方法:"
    print_info "  mas              - Multi-Agent Systemを起動"
    print_info "  mas --help       - ヘルプを表示"
    print_info "  mas --skip-init  - Unit初期化をスキップして起動"
    print_info "  mas --no-attach  - tmuxセッションにアタッチしない"
    echo ""
    print_info "アンインストール:"
    print_info "  ./install.sh --uninstall"
}

# スクリプト実行
main "$@"