# Capability: Agent Lifecycle Management

エージェントの起動、停止、状態管理を統合的に処理するモジュール。

## ADDED Requirements

### Requirement: AgentManagerによるエージェントライフサイクル管理

#### Scenario: エージェントの起動
```
GIVEN AgentManagerインスタンスとtmuxセッション
WHEN deployAgent({id: "11", role: "ui-designer", model: "sonnet", prompt: "..."})を呼び出す
THEN 適切なtmuxペインでclaudedプロセスが起動され
  AND エージェント状態が"STARTING"から"RUNNING"に遷移し
  AND 起動イベントが発行される
```

#### Scenario: エージェントの正常停止
```
GIVEN 実行中のエージェント
WHEN stopAgent(agentId, {graceful: true})を呼び出す
THEN 停止シグナルがエージェントに送信され
  AND グレースフル期間（30秒）待機し
  AND エージェント状態が"STOPPED"に更新される
```

### Requirement: エージェント状態の監視

#### Scenario: ヘルスチェック
```
GIVEN 実行中のエージェント群
WHEN ヘルスチェックインターバル（30秒）が経過
THEN 各エージェントのプロセス状態が確認され
  AND 応答しないエージェントが"UNHEALTHY"とマークされ
  AND アラートイベントが発行される
```

#### Scenario: 自動再起動
```
GIVEN "UNHEALTHY"状態のエージェント
WHEN 再起動ポリシーが有効
THEN エージェントが自動的に再起動され
  AND 再起動回数がカウントされ
  AND 最大再起動回数を超えた場合は"FAILED"状態になる
```

### Requirement: モデル割り当てとリソース管理

#### Scenario: 役割に基づくモデル割り当て
```
GIVEN エージェント設定でモデルが未指定
WHEN エージェントのroleが"manager"
THEN モデルが自動的に"opus"に設定される
```

#### Scenario: リソース制限の適用
```
GIVEN システム設定で最大エージェント数が13
WHEN 14個目のエージェントをデプロイしようとする
THEN ResourceLimitErrorがスローされ
  AND デプロイが拒否される
```

## MODIFIED Requirements

### Requirement: エージェント起動プロセス

#### Before:
```bash
# init_unit.sh
tmux send-keys -t "$SESSION_NAME:$WINDOW.$PANE" "cd $unit_dir/$UNIT_NUM" C-m
tmux send-keys -t "$SESSION_NAME:$WINDOW.$PANE" "clauded --model $MODEL" C-m
```

#### After:
```typescript
class AgentManager {
  async deployAgent(config: AgentConfig): Promise<Agent> {
    // 検証とリソースチェック
    await this.validateDeployment(config);

    // エージェント作成
    const agent = new Agent(config);

    // プロセス起動
    const process = await this.startProcess(agent);

    // 状態管理
    await this.store.register(agent);

    // イベント発行
    this.events.emit('agent:started', agent);

    return agent;
  }
}
```

### Requirement: エージェント設定管理

#### Before:
```bash
# ハードコードされた設定
UNIT_NAMES=("meta" "design" "development" "business")
UNIT_NUMS=("00" "10 11 12 13" "20 21 22 23" "30 31 32 33")
```

#### After:
```typescript
interface AgentConfig {
  id: string;
  role: AgentRole;
  model: ModelType;
  prompt: string;
  unitId?: string;
  resources?: ResourceLimits;
  environment?: Record<string, string>;
}

// 動的な設定管理
const agents = request.agents.units.flatMap(unit => [
  unit.manager,
  ...unit.workers
]);
```

## Related Capabilities

- **tmux-management**: tmuxペインへのプロセスデプロイ
- **session-state**: エージェント状態の永続化
- **hono-api-server**: APIからのエージェント管理