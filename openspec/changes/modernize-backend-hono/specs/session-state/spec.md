# Capability: Session State Management

セッション状態の永続化、復旧、およびイベントソーシングによる状態管理。

## ADDED Requirements

### Requirement: SessionStoreによる状態管理

#### Scenario: セッションの作成と永続化
```
GIVEN SessionStoreインスタンス
WHEN createSession({name: "project-123", agents: [...]})を呼び出す
THEN UUIDが生成されセッションが作成され
  AND セッション状態がストレージに永続化され
  AND SESSION_CREATEDイベントが記録される
```

#### Scenario: セッション状態の取得
```
GIVEN 既存のセッションID
WHEN getSession(sessionId)を呼び出す
THEN 現在のセッション状態が返され
  AND エージェント状態が含まれ
  AND メッセージ履歴が含まれる
```

### Requirement: イベントソーシングによる状態追跡

#### Scenario: イベントの記録と再生
```
GIVEN セッションのライフサイクル中のイベント
WHEN システムが再起動される
THEN イベントログから状態が再構築され
  AND 全てのセッション状態が復元される
```

#### Scenario: イベントストリームの購読
```
GIVEN アクティブなセッション
WHEN subscribeToSession(sessionId)を呼び出す
THEN リアルタイムでイベントがストリーミングされ
  AND WebSocketクライアントが更新を受信する
```

### Requirement: 状態の整合性とトランザクション

#### Scenario: 原子性のある状態更新
```
GIVEN 複数の状態変更操作
WHEN トランザクション内で実行
THEN 全ての変更が成功するか全て失敗し
  AND 部分的な状態更新が発生しない
```

#### Scenario: 楽観的ロックによる並行制御
```
GIVEN 複数のクライアントが同じセッションを更新
WHEN バージョン番号が一致しない
THEN OptimisticLockErrorがスローされ
  AND クライアントは再試行を求められる
```

## ADDED Requirements (Storage Backends)

### Requirement: 複数のストレージバックエンドサポート

#### Scenario: インメモリストレージ（開発用）
```
GIVEN storage.type = "memory"の設定
WHEN SessionStoreが初期化される
THEN メモリ内でセッション状態が管理され
  AND 高速な読み書きが可能になる
```

#### Scenario: SQLiteストレージ（単一ノード）
```
GIVEN storage.type = "sqlite"の設定
WHEN SessionStoreが初期化される
THEN SQLiteデータベースが使用され
  AND 永続化とクエリが可能になる
```

#### Scenario: PostgreSQLストレージ（プロダクション）
```
GIVEN storage.type = "postgres"の設定
WHEN SessionStoreが初期化される
THEN PostgreSQLが使用され
  AND 分散環境での一貫性が保証される
```

## MODIFIED Requirements

### Requirement: セッション状態の管理方法

#### Before:
```bash
# ファイルシステムベースの状態管理
echo "$SESSION_ID" > .mas_session
echo "$$" > .mas_http.pid
# 構造化されていない状態管理
```

#### After:
```typescript
interface SessionState {
  id: string;
  name: string;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
  agents: Map<string, AgentState>;
  messages: Message[];
  events: SystemEvent[];
  metadata: Record<string, any>;
}

class SessionStore {
  async save(session: SessionState): Promise<void> {
    await this.storage.transaction(async (tx) => {
      await tx.sessions.upsert(session);
      await tx.events.append(this.createEvent(session));
    });
  }
}
```

### Requirement: 状態の復旧メカニズム

#### Before:
```bash
# 手動でのセッション確認
tmux ls | grep mas-tmux
# プロセス状態の不確実な復旧
```

#### After:
```typescript
class SessionRecovery {
  async recover(): Promise<RecoveryResult> {
    // イベントログから状態を再構築
    const events = await this.eventStore.getAll();
    const sessions = this.rebuildFromEvents(events);

    // 実際のtmuxセッションと照合
    const actualSessions = await this.tmuxManager.listSessions();

    // 不整合を検出して修復
    const repaired = await this.reconcile(sessions, actualSessions);

    return {
      recovered: sessions.size,
      repaired: repaired.length,
      failed: [],
    };
  }
}
```

## Related Capabilities

- **hono-api-server**: APIエンドポイントからの状態取得
- **agent-lifecycle**: エージェント状態の追跡
- **message-routing**: メッセージ履歴の保存
- **tmux-management**: tmuxセッション状態との同期