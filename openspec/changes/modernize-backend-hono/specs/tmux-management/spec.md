# Capability: Tmux Management Module

tmuxセッション管理をTypeScriptモジュールとして抽象化し、構造化された管理を実現。

## ADDED Requirements

### Requirement: TmuxManagerモジュールによるセッション管理

#### Scenario: tmuxセッションの作成
```
GIVEN TmuxManagerインスタンス
WHEN createSession("mas-project-123")を呼び出す
THEN tmuxセッションmas-project-123が作成され
  AND 4つのウィンドウ(meta, design, development, business)が作成され
  AND 各ウィンドウに適切なペインが分割される
```

#### Scenario: セッション存在チェック
```
GIVEN 既存のtmuxセッション"mas-existing"
WHEN hasSession("mas-existing")を呼び出す
THEN trueが返される
```

### Requirement: ウィンドウとペインの管理

#### Scenario: ペインへのコマンド送信
```
GIVEN アクティブなtmuxセッション
WHEN sendToPane(sessionId, "design", 1, "echo Hello")を呼び出す
THEN designウィンドウのペイン1にコマンドが送信される
```

#### Scenario: ペインレイアウトの調整
```
GIVEN 4ペインのウィンドウ
WHEN setLayout("tiled")を呼び出す
THEN 全てのペインが均等なサイズに調整される
```

### Requirement: エラーハンドリングと復旧

#### Scenario: セッション作成失敗時のクリーンアップ
```
GIVEN tmuxセッション作成中にエラー発生
WHEN createSessionがエラーをスロー
THEN 部分的に作成されたリソースがクリーンアップされ
  AND TmuxSessionErrorが適切なコンテキストと共にスローされる
```

#### Scenario: デッドセッションの検出と削除
```
GIVEN 応答しないtmuxセッション
WHEN cleanupDeadSessions()を呼び出す
THEN デッドセッションが検出され
  AND 自動的に削除され
  AND クリーンアップログが記録される
```

## MODIFIED Requirements

### Requirement: tmuxセッション管理の実装方法

#### Before:
```bash
# mas.sh
tmux new-session -d -s "$SESSION_NAME" -n meta
tmux new-window -t "$SESSION_NAME:1" -n design
# ... 手続き的なシェルスクリプト
```

#### After:
```typescript
// TmuxManager.ts
class TmuxManager {
  async createSession(config: SessionConfig): Promise<Session> {
    const session = await this.tmux.newSession({
      name: config.name,
      detached: true,
      windows: this.generateWindowConfig(config),
    });
    return this.configureSession(session, config);
  }
}
```

### Requirement: セッション設定の管理

#### Before:
```bash
# ハードコードされた設定
MODEL_00="opus"
MODEL_10="opus"
# ... グローバル変数
```

#### After:
```typescript
interface SessionConfig {
  agents: AgentConfig[];
  layout: LayoutType;
  shell: string;
  environment: Record<string, string>;
}

// 設定の注入と型安全性
const config = ConfigLoader.load();
const tmuxManager = new TmuxManager(config.tmux);
```

## Related Capabilities

- **hono-api-server**: APIエンドポイントからの呼び出し
- **agent-lifecycle**: エージェント起動時のペイン割り当て
- **session-state**: セッション状態の永続化