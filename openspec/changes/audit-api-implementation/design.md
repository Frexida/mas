# 設計: API実装の不整合解消アプローチ

## 現状アーキテクチャの問題点

```
[Web UI] --HTTP--> [Hono API Server] --Shell--> [mas.sh (存在しない設定)]
                           |                            |
                           v                            v
                    [OpenAPI仕様]              [mas_refactored.sh]
                    (期待される動作)              (実際の実装)
                           |                            |
                           +------- 不一致 -------------+
```

## 根本原因

1. **進化の不整合**: `mas.sh` から `mas_refactored.sh` への移行が API層に反映されていない
2. **仕様先行開発**: OpenAPI仕様が理想的な設計を記述しているが、実装が追いついていない
3. **テスト不足**: 統合テストがないため、不整合が検出されない

## 解決アプローチの選択肢

### Option A: 実装を仕様に合わせる（推奨）
**利点:**
- APIクライアント（UI等）の変更不要
- 仕様書が既に公開されているため、互換性維持が重要

**欠点:**
- 大規模な実装作業が必要
- mas_refactored.shの大幅な拡張が必要

**実装方針:**
1. mas_refactored.shに設定ファイル読み込み機能を追加
2. 動的なエージェント構成をサポート
3. UUIDベースのセッション管理を実装

### Option B: 仕様を現実に合わせる
**利点:**
- 実装作業が最小限
- 既存の動作を維持

**欠点:**
- APIクライアントの修正が必要
- 機能が制限される

**実装方針:**
1. OpenAPI仕様を現在の実装に合わせて修正
2. 固定的なエージェント構成のみサポート
3. シンプルなメッセージ送信に特化

### Option C: 段階的な収束（バランス型）
**利点:**
- 即座に動作する最小限の修正
- 将来的な拡張性を確保

**欠点:**
- 移行期間中の複雑性

**実装方針:**
1. Phase 1: 最小限の動作する実装（仕様の一部を満たす）
2. Phase 2: 段階的に仕様準拠を進める
3. Phase 3: 完全な仕様準拠

## 推奨設計

### Phase 1: 最小限の動作実装

```typescript
// /runs エンドポイントの修正
app.post('/runs', async (c) => {
  const config = await c.req.json();

  // 固定構成でmas_refactoredを起動
  // （設定ファイルサポートは後回し）
  const sessionId = generateUUID();
  const result = await execAsync(`./mas_refactored.sh start --no-attach`);

  return c.json({
    sessionId,
    tmuxSession: 'mas-tmux', // 固定
    workingDir: process.cwd(),
    startedAt: new Date().toISOString()
  }, 201);
});
```

### Phase 2: 設定ファイルサポート

```bash
# mas_refactored.sh に追加
cmd_start_with_config() {
  local config_file="$1"
  # JSONから設定を読み込み
  # 動的にエージェントを構成
}
```

### Phase 3: 完全な動的構成

- セッションごとの独立したtmuxセッション
- 動的なエージェント数とプロンプト
- リアルタイム状態追跡

## トレードオフ

| 側面 | Option A | Option B | Option C |
|-----|---------|---------|---------|
| 実装工数 | 高 | 低 | 中 |
| 互換性 | 完全 | 破壊的 | 段階的 |
| 保守性 | 高 | 低 | 中 |
| 拡張性 | 高 | 低 | 高 |

## 結論

**Option C（段階的な収束）** を推奨します。理由：
1. 即座に動作する実装が可能
2. 既存のクライアントとの互換性を段階的に改善
3. 将来的な拡張に対応可能
4. リスクを最小化しながら品質を改善