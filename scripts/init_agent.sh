#!/usr/bin/env bash

# エージェント初期化スクリプト
# 各エージェントが起動時にワークフロー指示を読み込む

UNIT_NUM="$1"
UNIT_DIR="$(pwd)"

# 色付きメッセージ出力
print_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

# ワークフロー指示書の確認と初期メッセージ
if [ -f "$UNIT_DIR/WORKFLOW_INSTRUCTIONS.md" ]; then
    echo ""
    echo "==========================================="
    echo "   エージェント初期化 - Unit $UNIT_NUM"
    echo "==========================================="
    echo ""

    print_info "ワークフロー指示書が見つかりました"
    echo ""
    echo "あなたの役割と責任については以下のファイルを確認してください："
    echo "  - WORKFLOW_INSTRUCTIONS.md : あなたの専門的な役割"

    if [ -f "$UNIT_DIR/WORKER_GUIDELINES.md" ]; then
        echo "  - WORKER_GUIDELINES.md : ワーカー共通ガイドライン"
    fi

    echo ""
    echo "重要な指示："

    # ユニット番号に応じた初期指示
    case "$UNIT_NUM" in
        "00")
            echo "1. あなたはメタマネージャーです"
            echo "2. 各ユニットマネージャー（10, 20, 30）に指示を出してください"
            echo "3. ワーカーへの直接指示は避けてください"
            echo "4. 全体の調整と最終承認を行ってください"
            ;;
        "10"|"20"|"30")
            echo "1. あなたはユニットマネージャーです"
            echo "2. メタマネージャー（00）からの指示を受けてください"
            echo "3. あなたのワーカーに作業を分配してください"
            echo "4. 成果を統合してメタマネージャーに報告してください"
            ;;
        *)
            echo "1. あなたはワーカーです"
            echo "2. 直属のマネージャーからの指示に従ってください"
            echo "3. 専門性を発揮して最高の成果を提供してください"
            echo "4. 進捗と課題は適切にマネージャーに報告してください"
            ;;
    esac

    echo ""
    echo "==========================================="
    echo ""

    print_success "初期化完了 - 作業を開始できます"
else
    print_info "ワークフロー指示書が見つかりません"
    print_info "通常モードで起動します"
fi

echo ""