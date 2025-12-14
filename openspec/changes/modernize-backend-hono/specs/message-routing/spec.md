# Capability: Message Routing System

メッセージの柔軟なルーティングと配信を管理するモジュール。

## ADDED Requirements

### Requirement: MessageRouterによるメッセージ配信

#### Scenario: 個別エージェントへのメッセージ送信
```
GIVEN MessageRouterインスタンス
WHEN route({target: "11", message: "Design the UI", sender: "00"})を呼び出す
THEN エージェント11にメッセージが配信され
  AND 配信確認イベントが発行される
```

#### Scenario: ユニット全体へのブロードキャスト
```
GIVEN designユニット(10, 11, 12, 13)が存在
WHEN route({target: "design", message: "Review designs"})を呼び出す
THEN ユニット内の全エージェントに並列でメッセージが配信される
```

### Requirement: ターゲット展開と配信戦略

#### Scenario: managersグループへの配信
```
GIVEN managers = [00, 10, 20, 30]
WHEN route({target: "managers", message: "Status update"})を呼び出す
THEN 全てのマネージャーエージェントにメッセージが配信される
```

#### Scenario: 条件付き配信
```
GIVEN 複数のエージェントが存在
WHEN route({target: "all", message: "...", filter: {status: "RUNNING"}})を呼び出す
THEN RUNNING状態のエージェントのみにメッセージが配信される
```

### Requirement: 配信保証とエラー処理

#### Scenario: 配信失敗時のリトライ
```
GIVEN メッセージ配信が一時的に失敗
WHEN リトライポリシーが設定されている
THEN 指数バックオフでリトライされ
  AND 最大3回まで再試行され
  AND 最終的な失敗時はデッドレターキューに格納される
```

#### Scenario: 配信確認とトラッキング
```
GIVEN メッセージが送信された
WHEN trackDelivery: trueが指定されている
THEN 配信IDが生成され
  AND 配信ステータスが追跡可能になり
  AND WebSocketで配信状態が通知される
```

## MODIFIED Requirements

### Requirement: メッセージルーティングの実装

#### Before:
```bash
# send_message.sh
get_window_and_pane() {
  case "$1" in
    00) echo "meta.0" ;;
    10) echo "design.0" ;;
    # ... ハードコードされたマッピング
  esac
}
```

#### After:
```typescript
class MessageRouter {
  private async resolveTargets(target: string): Promise<Agent[]> {
    // 動的なターゲット解決
    if (this.isAgentId(target)) {
      return [await this.agentManager.get(target)];
    }

    if (this.isUnitName(target)) {
      return this.agentManager.getByUnit(target);
    }

    if (this.isGroup(target)) {
      return this.expandGroup(target);
    }

    throw new InvalidTargetError(target);
  }
}
```

### Requirement: メッセージ形式と配信方法

#### Before:
```bash
# テキストのみ、同期配信
tmux send-keys -t "$WINDOW.$PANE" "$MESSAGE" C-m
```

#### After:
```typescript
interface Message {
  id: string;
  target: string | string[];
  content: string;
  metadata?: {
    sender?: string;
    priority?: Priority;
    expiry?: Date;
    format?: 'text' | 'json' | 'markdown';
  };
  options?: {
    execute?: boolean;
    trackDelivery?: boolean;
    timeout?: number;
  };
}

// 非同期並列配信
await Promise.allSettled(
  agents.map(agent => this.deliver(agent, message))
);
```

## Related Capabilities

- **agent-lifecycle**: 実行中のエージェントの取得
- **tmux-management**: tmuxペインへのメッセージ送信
- **session-state**: メッセージ履歴の保存
- **hono-api-server**: APIエンドポイントからの呼び出し