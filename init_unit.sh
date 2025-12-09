#!/usr/bin/env bash

# Unit初期化スクリプト
# 各unitディレクトリでopenspecを初期化し、役割別のREADMEを作成する

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
UNIT_DIR="${SCRIPT_DIR}/unit"

# openspecがインストールされているか確認
check_openspec() {
    if ! command -v openspec &> /dev/null; then
        # npm-globalパスも確認
        if [ -x "$HOME/.local/npm-global/bin/openspec" ]; then
            export PATH="$HOME/.local/npm-global/bin:$PATH"
        else
            print_error "openspecがインストールされていません"
            print_info "インストール方法: npm install -g openspec"
            exit 1
        fi
    fi
    print_success "openspecが見つかりました: $(which openspec)"
}

# unitディレクトリが存在するか確認
check_unit_directory() {
    if [ ! -d "$UNIT_DIR" ]; then
        print_error "unitディレクトリが存在しません: $UNIT_DIR"
        exit 1
    fi
    print_success "unitディレクトリが見つかりました: $UNIT_DIR"
}

# 各unitディレクトリを初期化
init_unit() {
    local unit_num=$1
    local unit_role=$2
    local unit_path="${UNIT_DIR}/${unit_num}"

    print_info "Unit ${unit_num} (${unit_role}) を初期化中..."

    # ディレクトリが存在するか確認
    if [ ! -d "$unit_path" ]; then
        print_warning "ディレクトリが存在しません。作成します: $unit_path"
        mkdir -p "$unit_path"
    fi

    # 既にopenspecが初期化されているか確認
    if [ -d "$unit_path/.openspec" ]; then
        print_warning "Unit ${unit_num} は既にopenspecが初期化されています。スキップします。"
        return 0
    fi

    # openspec初期化
    cd "$unit_path"
    print_info "openspec init --tools claude を実行中..."

    if openspec init --tools claude; then
        print_success "openspec初期化完了: Unit ${unit_num}"
    else
        print_error "openspec初期化失敗: Unit ${unit_num}"
        return 1
    fi

    # 役割別のREADMEを作成
    cat > README.md << EOF
# Unit ${unit_num} - ${unit_role}

## 概要
このディレクトリは mas-tmux システムの Unit ${unit_num} として、${unit_role}の役割を担当します。

## 役割
EOF

    case $unit_num in
        0)
            cat >> README.md << EOF
### Manager (マネージャー)
- タスクの受領と分析
- 各ワーカーへのタスク配分
- ワーカーからの提案の統合
- 最終的な承認プロセスの管理

**使用モデル**: Claude Opus
EOF
            ;;
        1)
            cat >> README.md << EOF
### Development Worker (開発ワーカー)
- 技術的な実装観点からの提案
- コード品質とアーキテクチャの検討
- パフォーマンスと保守性の評価

**使用モデル**: Claude Sonnet
EOF
            ;;
        2)
            cat >> README.md << EOF
### Design Worker (デザインワーカー)
- ユーザビリティ観点からの提案
- インターフェースデザインの検討
- ユーザー体験の最適化

**使用モデル**: Claude Sonnet
EOF
            ;;
        3)
            cat >> README.md << EOF
### Accounting Worker (会計ワーカー)
- コスト効率性の観点からの提案
- リソース配分の最適化
- ROIと投資対効果の評価

**使用モデル**: Claude Sonnet
EOF
            ;;
    esac

    cat >> README.md << EOF

## 使用方法
\`\`\`bash
# このディレクトリに移動
cd unit/${unit_num}

# Claude Codeでタスクを実行
clauded /openspec:proposal "タスクの内容"
\`\`\`

## OpenSpec設定
このディレクトリはOpenSpecで管理されています。
- ツール: Claude
- 仕様とコンテキストは \`.openspec/\` ディレクトリに保存されます

## 関連ファイル
- \`../../setup_mas_tmux.sh\` - tmuxセッションのセットアップ
- \`../../send_message.sh\` - ペイン間のメッセージ送信
EOF

    print_success "README作成完了: Unit ${unit_num}"

    cd "$SCRIPT_DIR"
}

# メイン処理
main() {
    print_info "=== mas-tmux Unit初期化スクリプト ==="

    # 前提条件の確認
    check_openspec
    check_unit_directory

    # 各unitを初期化
    init_unit 0 "Manager"
    init_unit 1 "Development Worker"
    init_unit 2 "Design Worker"
    init_unit 3 "Accounting Worker"

    print_info "=== 初期化完了 ==="
    print_success "全てのunitディレクトリが正常に初期化されました"

    # 次のステップの案内
    echo ""
    print_info "次のステップ:"
    print_info "1. tmuxセッションを開始: ./setup_mas_tmux.sh"
    print_info "2. 各ペインでタスクを実行: clauded /openspec:proposal 'タスク'"
    print_info "3. メッセージ送信: ./send_message.sh -t manager 'メッセージ'"
}

# スクリプト実行
main "$@"