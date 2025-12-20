# Design: Simplify Workspace Structure

## Architecture Overview

### Current Architecture Issues
現在のMASは以下の2つの独立したディレクトリ構造を持つ：
1. **プロジェクトディレクトリ**: `mas init`を実行した場所（`.masrc`、`.mas/`、`unit/`、`workflows/`）
2. **データディレクトリ**: `~/.mas`（sessions、logs、pids）

この分離により、ユーザーは実際の作業がどこで行われているか把握しづらい。

### Proposed Architecture
単一のワークスペースディレクトリに統合：
```
workspace/
├── config.json          # 統合設定（旧 .mas/config.json）
├── sessions/            # セッション管理（旧 ~/.mas/sessions）
├── unit/                # ユニットテンプレート
├── workflows/           # ワークフローテンプレート
├── logs/                # すべてのログ
├── templates/           # テンプレートライブラリ
├── *.pid, *.log        # プロセス管理ファイル
└── .masrc              # プロジェクトマーカー（後方互換性）
```

## Component Changes

### 1. Initialization (`mas-core.sh`)
**Before:**
```bash
# ディレクトリ作成
mkdir -p unit workflows .mas
# ~/.masにもディレクトリ作成
mkdir -p "$MAS_DATA_DIR/sessions"
```

**After:**
```bash
# プロジェクトディレクトリに全て作成
mkdir -p unit workflows sessions templates logs config
```

### 2. Session Management (`lib/mas-session.sh`)
**Before:**
```bash
SESSION_DIR="$MAS_DATA_DIR/sessions/$SESSION_ID"
```

**After:**
```bash
SESSION_DIR="$MAS_WORKSPACE_ROOT/sessions/$SESSION_ID"
```

### 3. Project Detection (`lib/project.sh`)
**Before:**
```bash
is_project_initialized() {
    [ -f "$project_dir/.masrc" ] && \
    [ -d "$project_dir/.mas" ] && \
    [ -d "$project_dir/unit" ]
}
```

**After:**
```bash
is_project_initialized() {
    [ -f "$project_dir/.masrc" ] && \
    [ -f "$project_dir/config.json" ] && \
    [ -d "$project_dir/unit" ] && \
    [ -d "$project_dir/sessions" ]
}
```

## Migration Strategy

### Phase 1: Backward Compatibility
1. `.masrc`ファイルの存在をチェック
2. 旧構造（`.mas/`ディレクトリ）を検出したら警告
3. 既存のセッションは`~/.mas`から継続利用可能

### Phase 2: Migration Helper
```bash
mas migrate --from-legacy
```
このコマンドで：
- `~/.mas/sessions`を`./sessions`にコピー
- `.mas/config.json`を`./config.json`に移行
- pidとlogファイルの配置を更新

### Phase 3: Clean Migration
新規プロジェクトはすべて新構造で作成される。

## File Organization

### Configuration Files
- `config.json`: メイン設定ファイル（JSON形式）
- `.masrc`: プロジェクトマーカー（シェル変数形式、後方互換性）

### Runtime Files
- `api.pid`, `web.pid`: プロセスIDファイル
- `api.log`, `web.log`: サービスログ
- `logs/`: セッションごとのログディレクトリ

### Template Structure
```
templates/
├── agents/        # エージェントテンプレート
├── workflows/     # ワークフローテンプレート
└── configs/       # 設定テンプレート
```

## Environment Variables

### Deprecated
- `MAS_DATA_DIR`: 不要になるため削除

### New/Modified
- `MAS_WORKSPACE_ROOT`: 現在のワークスペースルート
- `MAS_PROJECT_ROOT`: プロジェクトルート（MAS_WORKSPACE_ROOTのエイリアス）
- `MAS_SESSION_DIR`: アクティブセッションのディレクトリ

## API Impact

### Session Manager Updates
```typescript
// Before
const sessionsPath = path.join(process.env.HOME, '.mas', 'sessions');

// After
const sessionsPath = path.join(process.env.MAS_WORKSPACE_ROOT || '.', 'sessions');
```

### Backward Compatibility Layer
既存のAPIエンドポイントは変更なし。内部実装のみ更新。

## Security Considerations

1. **File Permissions**:
   - config.json: 600 (owner read/write only)
   - *.pid: 644 (owner write, others read)
   - logs/: 755 (owner full, others read/execute)

2. **Path Validation**:
   - 相対パスを絶対パスに正規化
   - シンボリックリンク追跡の制限

## Performance Impact

### Positive
- ディレクトリ階層が浅くなりファイルアクセスが高速化
- 単一ディレクトリでI/O局所性が向上

### Neutral
- ディレクトリ構造の変更によるキャッシュミスは一時的

## Testing Strategy

1. **Unit Tests**:
   - ディレクトリ作成ロジック
   - パス解決ロジック
   - 後方互換性チェック

2. **Integration Tests**:
   - `mas init`から`mas start`の完全フロー
   - レガシープロジェクトの移行
   - マルチセッション動作

3. **Migration Tests**:
   - 旧構造から新構造への移行
   - データ整合性の検証