#!/usr/bin/env bash

# ============================================================================
# mas プロジェクト管理ライブラリ
# ============================================================================

# バージョン情報
PROJECT_LIB_VERSION="2.0.0"

# ============================================================================
# プロジェクト検出機能
# ============================================================================

# プロジェクトルートを検出
# 現在のディレクトリから親ディレクトリへ遡って.masrcを探す
find_project_root() {
    local current_dir="$PWD"

    while [ "$current_dir" != "/" ]; do
        if [ -f "$current_dir/.masrc" ]; then
            echo "$current_dir"
            return 0
        fi
        current_dir="$(dirname "$current_dir")"
    done

    return 1
}

# プロジェクトが初期化されているか確認
is_project_initialized() {
    local project_dir="${1:-$PWD}"

    # 新構造の確認（.masディレクトリは不要）
    if [ -f "$project_dir/config.json" ] && \
       [ -d "$project_dir/sessions" ] && \
       [ -d "$project_dir/unit" ] && \
       [ -d "$project_dir/workflows" ]; then
        return 0
    fi

    # 旧構造との後方互換性
    if [ -f "$project_dir/.masrc" ] && \
       [ -d "$project_dir/.mas" ] && \
       [ -d "$project_dir/unit" ] && \
       [ -d "$project_dir/workflows" ]; then
        return 0
    fi

    return 1
}

# ============================================================================
# プロジェクト設定管理
# ============================================================================

# プロジェクト設定をロード
load_project_config() {
    local project_root="$1"
    local config_file=""

    # 新構造を優先的にチェック
    if [ -f "$project_root/config.json" ]; then
        config_file="$project_root/config.json"
    elif [ -f "$project_root/.masrc" ]; then
        # 後方互換性: 旧構造もサポート
        config_file="$project_root/.masrc"
    else
        return 1
    fi

    # 環境変数をエクスポート
    export PROJECT_ROOT="$project_root"
    export MAS_WORKSPACE_ROOT="$project_root"  # 新しい環境変数
    export MAS_PROJECT_ROOT="$project_root"     # エイリアス

    # JSONパース（jqを使用）
    if command -v jq &> /dev/null; then
        # 新構造のフィールド名にも対応
        export PROJECT_NAME=$(jq -r '.projectName // .project_name // "unknown"' "$config_file" 2>/dev/null || echo "unknown")
        export PROJECT_SESSION_NAME=$(jq -r '.sessionName // .session_name // "mas-tmux"' "$config_file" 2>/dev/null || echo "mas-tmux")
        export PROJECT_VERSION=$(jq -r '.version // "1.0.0"' "$config_file" 2>/dev/null || echo "1.0.0")
        export PROJECT_CREATED_AT=$(jq -r '.createdAt // .created_at // ""' "$config_file" 2>/dev/null || echo "")
    else
        # jqがない場合のフォールバック（簡易パース）
        export PROJECT_NAME=$(grep -o '"projectName"[[:space:]]*:[[:space:]]*"[^"]*"' "$config_file" | cut -d'"' -f4 || \
                             grep -o '"project_name"[[:space:]]*:[[:space:]]*"[^"]*"' "$config_file" | cut -d'"' -f4 || echo "unknown")
        export PROJECT_SESSION_NAME=$(grep -o '"sessionName"[[:space:]]*:[[:space:]]*"[^"]*"' "$config_file" | cut -d'"' -f4 || \
                                     grep -o '"session_name"[[:space:]]*:[[:space:]]*"[^"]*"' "$config_file" | cut -d'"' -f4 || echo "mas-tmux")
        export PROJECT_VERSION="1.0.0"
        export PROJECT_CREATED_AT=""
    fi

    # プロジェクトディレクトリ
    export PROJECT_UNIT_DIR="$PROJECT_ROOT/unit"
    export PROJECT_WORKFLOWS_DIR="$PROJECT_ROOT/workflows"
    export PROJECT_SESSIONS_DIR="$PROJECT_ROOT/sessions"  # 新規追加

    return 0
}

# プロジェクト設定を保存
save_project_config() {
    local project_root="$1"
    local project_name="${2:-$(basename "$project_root")}"
    local session_name="${3:-mas-$project_name}"

    # 新構造: config.jsonを直接プロジェクトルートに作成
    cat > "$project_root/config.json" << EOF
{
  "version": "$PROJECT_LIB_VERSION",
  "projectName": "$project_name",
  "sessionName": "$session_name",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "masVersion": "${VERSION:-2.0.0}",
  "workspaceRoot": "$project_root",
  "units": {
    "meta": ["00"],
    "design": ["10", "11", "12", "13"],
    "development": ["20", "21", "22", "23"],
    "business": ["30", "31", "32", "33"]
  },
  "models": {
    "00": "opus",
    "10": "opus",
    "20": "opus",
    "30": "opus",
    "default": "sonnet"
  },
  "tmux": {
    "window_layout": "tiled",
    "auto_attach": true
  },
  "openspec": {
    "tools": "claude"
  }
}
EOF

    return 0
}

# ============================================================================
# プロジェクト情報取得
# ============================================================================

# プロジェクト情報を表示
show_project_info() {
    local project_root="${1:-$PROJECT_ROOT}"

    if [ -z "$project_root" ] || [ ! -f "$project_root/.masrc" ]; then
        echo "No mas project found"
        return 1
    fi

    # 設定をロード（まだロードされていない場合）
    if [ -z "$PROJECT_NAME" ]; then
        load_project_config "$project_root"
    fi

    echo "Project Information:"
    echo "  Root: $PROJECT_ROOT"
    echo "  Name: $PROJECT_NAME"
    echo "  Session: $PROJECT_SESSION_NAME"
    echo "  Version: $PROJECT_VERSION"
    if [ -n "$PROJECT_CREATED_AT" ]; then
        echo "  Created: $PROJECT_CREATED_AT"
    fi

    # ユニット数をカウント
    if [ -d "$PROJECT_UNIT_DIR" ]; then
        local unit_count=$(find "$PROJECT_UNIT_DIR" -maxdepth 1 -type d -name "[0-3][0-3]" | wc -l)
        echo "  Units: $unit_count agents initialized"
    fi

    return 0
}

# プロジェクトをバリデーション
validate_project() {
    local project_root="${1:-$PROJECT_ROOT}"
    local errors=0

    echo "Validating project at: $project_root"
    echo ""

    # .masrcの存在
    if [ -f "$project_root/.masrc" ]; then
        echo "✓ .masrc found"
    else
        echo "✗ .masrc not found"
        ((errors++))
    fi

    # .mas/ディレクトリ
    if [ -d "$project_root/.mas" ]; then
        echo "✓ .mas/ directory found"

        # config.jsonの存在
        if [ -f "$project_root/.mas/config.json" ]; then
            echo "  ✓ config.json found"
        else
            echo "  ✗ config.json not found"
            ((errors++))
        fi
    else
        echo "✗ .mas/ directory not found"
        ((errors++))
    fi

    # unit/ディレクトリ
    if [ -d "$project_root/unit" ]; then
        echo "✓ unit/ directory found"

        # 各ユニットのチェック
        for unit_num in 00 10 11 12 13 20 21 22 23 30 31 32 33; do
            if [ -d "$project_root/unit/$unit_num" ]; then
                echo -n "  ✓ Unit $unit_num"

                # .openspecディレクトリのチェック
                if [ -d "$project_root/unit/$unit_num/.openspec" ]; then
                    echo " (.openspec ✓)"
                else
                    echo " (.openspec ✗)"
                    ((errors++))
                fi
            else
                echo "  ✗ Unit $unit_num not found"
                ((errors++))
            fi
        done
    else
        echo "✗ unit/ directory not found"
        ((errors++))
    fi

    # workflows/ディレクトリ
    if [ -d "$project_root/workflows" ]; then
        echo "✓ workflows/ directory found"

        # 必須ワークフローファイルのチェック
        local required_workflows=(
            "00_meta_manager.md"
            "10_design_manager.md"
            "20_dev_manager.md"
            "30_business_manager.md"
            "workers_common.md"
        )

        for workflow in "${required_workflows[@]}"; do
            if [ -f "$project_root/workflows/$workflow" ]; then
                echo "  ✓ $workflow"
            else
                echo "  ✗ $workflow not found"
                ((errors++))
            fi
        done
    else
        echo "✗ workflows/ directory not found"
        ((errors++))
    fi

    echo ""
    if [ $errors -eq 0 ]; then
        echo "✓ Validation passed"
        return 0
    else
        echo "✗ Validation failed with $errors errors"
        return 1
    fi
}

# ============================================================================
# プロジェクトモードの判定
# ============================================================================

# プロジェクトモードかレガシーモードかを判定
detect_mode() {
    if PROJECT_ROOT=$(find_project_root); then
        echo "project"
        return 0
    else
        echo "legacy"
        return 1
    fi
}

# 現在のモードを表示
show_current_mode() {
    local mode=$(detect_mode)

    if [ "$mode" = "project" ]; then
        echo "Mode: Project"
        echo "Root: $PROJECT_ROOT"
        load_project_config "$PROJECT_ROOT"
        echo "Name: $PROJECT_NAME"
    else
        echo "Mode: Legacy (using system unit directory)"
        echo "Dir: ${SCRIPT_DIR:-/usr/local/mas}/unit"
    fi
}

# ============================================================================
# ユーティリティ関数
# ============================================================================

# セッション名をサニタイズ（tmux用）
sanitize_session_name() {
    local name="$1"
    # tmuxセッション名に使えない文字を置換
    echo "$name" | sed 's/[^a-zA-Z0-9_-]/-/g'
}

# プロジェクト名をサニタイズ
sanitize_project_name() {
    local name="$1"
    # ファイルシステムとtmuxの両方で安全な名前にする
    echo "$name" | sed 's/[^a-zA-Z0-9_-]/-/g' | sed 's/^-*//;s/-*$//'
}

# ============================================================================
# エクスポート確認
# ============================================================================

# このライブラリがロードされたことを示すフラグ
export PROJECT_LIB_LOADED=1