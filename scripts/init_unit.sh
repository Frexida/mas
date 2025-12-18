#!/usr/bin/env bash

# Unit初期化スクリプト - マルチユニット構成対応版
# 13エージェント（メタマネージャー、3ユニット×マネージャー+3ワーカー）の初期化

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

# ターゲットディレクトリの設定（環境変数があればそれを使用）
UNIT_DIR="${TARGET_UNIT_DIR:-${SCRIPT_DIR}/unit}"
WORKFLOWS_DIR="${TARGET_WORKFLOWS_DIR:-${SCRIPT_DIR}/workflows}"

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

# unitディレクトリが存在するか確認、なければ作成
check_unit_directory() {
    if [ ! -d "$UNIT_DIR" ]; then
        print_warning "unitディレクトリが存在しません: $UNIT_DIR"
        print_info "unitディレクトリを作成します..."
        mkdir -p "$UNIT_DIR"
        print_success "unitディレクトリを作成しました: $UNIT_DIR"
    else
        print_success "unitディレクトリが見つかりました: $UNIT_DIR"
    fi
}

# 各unitディレクトリを初期化
init_unit() {
    local unit_num=$1
    local unit_role=$2
    local unit_model=$3
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
このディレクトリは mas-tmux マルチユニットシステムの Unit ${unit_num} として、${unit_role}の役割を担当します。

## 役割と責任
${unit_role}

**使用モデル**: Claude ${unit_model}

## 使用方法
\`\`\`bash
# このディレクトリに移動
cd unit/${unit_num}

# Claude Codeでタスクを実行
clauded --model ${unit_model,,} /openspec:proposal "タスクの内容"
\`\`\`

## OpenSpec設定
このディレクトリはOpenSpecで管理されています。
- ツール: Claude
- 仕様とコンテキストは \`.openspec/\` ディレクトリに保存されます

## 関連ファイル
- \`../../mas\` - マルチユニットシステム起動コマンド
- \`../../send_message.sh\` - エージェント間メッセージ送信
EOF

    print_success "README作成完了: Unit ${unit_num}"

    # ワークフロー指示書をコピー（存在する場合）
    local workflow_file=""
    case "$unit_num" in
        "00") workflow_file="00_meta_manager.md" ;;
        "10") workflow_file="10_design_manager.md" ;;
        "11"|"12"|"13") workflow_file="11-13_design_workers.md" ;;
        "20") workflow_file="20_dev_manager.md" ;;
        "21"|"22"|"23") workflow_file="21-23_dev_workers.md" ;;
        "30") workflow_file="30_business_manager.md" ;;
        "31"|"32"|"33") workflow_file="31-33_business_workers.md" ;;
    esac

    if [ -n "$workflow_file" ] && [ -f "$WORKFLOWS_DIR/$workflow_file" ]; then
        cp "$WORKFLOWS_DIR/$workflow_file" "$unit_path/WORKFLOW_INSTRUCTIONS.md"
        print_success "ワークフロー指示書をコピー: $workflow_file"
    fi

    # 共通ガイドラインをワーカーにコピー
    if [[ "$unit_num" =~ ^(11|12|13|21|22|23|31|32|33)$ ]] && [ -f "$WORKFLOWS_DIR/workers_common.md" ]; then
        cp "$WORKFLOWS_DIR/workers_common.md" "$unit_path/WORKER_GUIDELINES.md"
        print_success "ワーカー共通ガイドラインをコピー"
    fi

    cd "$SCRIPT_DIR"
}

# メイン処理
main() {
    print_info "=== mas-tmux マルチユニット初期化スクリプト ==="

    # 前提条件の確認
    check_openspec
    check_unit_directory

    print_info "=== 13エージェントシステムを初期化中 ==="

    # メタマネージャー
    init_unit "00" "メタマネージャー - 全体統括、ユニット間調整、高レベル意思決定" "Opus"

    # デザインユニット
    init_unit "10" "デザインマネージャー - デザイン戦略、品質管理、チーム統括" "Opus"
    init_unit "11" "デザインワーカー（UI） - ユーザーインターフェース設計、コンポーネントデザイン" "Sonnet"
    init_unit "12" "デザインワーカー（UX） - ユーザー体験設計、ユーザビリティ評価" "Sonnet"
    init_unit "13" "デザインワーカー（ビジュアル） - ビジュアルデザイン、ブランディング、アートワーク" "Sonnet"

    # 開発ユニット
    init_unit "20" "開発マネージャー - 技術選定、アーキテクチャ設計、開発統括" "Opus"
    init_unit "21" "開発ワーカー（フロントエンド） - UI実装、クライアントサイド開発" "Sonnet"
    init_unit "22" "開発ワーカー（バックエンド） - サーバーサイド実装、API開発、データベース設計" "Sonnet"
    init_unit "23" "開発ワーカー（DevOps） - インフラ構築、CI/CD、デプロイメント、監視" "Sonnet"

    # 経営・会計ユニット
    init_unit "30" "経営・会計マネージャー - 予算管理、戦略立案、ビジネス統括" "Opus"
    init_unit "31" "経営・会計ワーカー（会計） - コスト分析、予算計画、財務管理" "Sonnet"
    init_unit "32" "経営・会計ワーカー（戦略） - ビジネス戦略、市場分析、競合分析" "Sonnet"
    init_unit "33" "経営・会計ワーカー（分析） - データ分析、パフォーマンス評価、KPI管理" "Sonnet"

    print_info "=== 初期化完了 ==="
    print_success "全13エージェントのunitディレクトリが正常に初期化されました"

    # 次のステップの案内
    echo ""
    print_info "次のステップ:"
    print_info "1. マルチユニットシステムを開始: mas start"
    print_info "2. 各エージェントでタスクを実行"
    print_info "3. メッセージ送信例:"
    print_info "   - 個別: ./send_message.sh -p 11 'UIデザインのタスク'"
    print_info "   - ユニット: ./send_message.sh -p design 'デザインチーム全体へ'"
    print_info "   - マネージャー: ./send_message.sh -p managers 'マネージャー会議'"
}

# スクリプト実行
main "$@"