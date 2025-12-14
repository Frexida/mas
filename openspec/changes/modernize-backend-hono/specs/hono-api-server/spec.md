# Capability: Hono API Server

TypeScriptとHonoフレームワークを使用した新しいAPIサーバーの実装仕様。

## ADDED Requirements

### Requirement: APIサーバーはHonoフレームワークで実装される

#### Scenario: サーバーの起動と基本設定
```
GIVEN Bun/Node.js環境が利用可能
WHEN src/server.tsを実行
THEN Honoサーバーがポート8765で起動し
  AND CORSが有効化され
  AND ミドルウェアスタックが初期化される
```

#### Scenario: 環境変数による設定のオーバーライド
```
GIVEN MAS_API_PORT=3000が設定されている
WHEN サーバーを起動
THEN ポート3000でリッスンする
```

### Requirement: 型安全なリクエスト/レスポンス処理

#### Scenario: リクエストのバリデーション
```
GIVEN /api/messageエンドポイントへのPOSTリクエスト
WHEN 不正な形式のJSONボディが送信された
THEN 400 Bad Requestが返され
  AND エラーの詳細がレスポンスに含まれる
```

#### Scenario: OpenAPIからの型生成
```
GIVEN openapi.yamlファイルが存在する
WHEN 型生成スクリプトを実行
THEN src/types/api.tsにTypeScript型が生成され
  AND 全てのエンドポイントで型が利用可能になる
```

### Requirement: ミドルウェアによる横断的関心事の処理

#### Scenario: リクエストロギング
```
GIVEN 任意のAPIエンドポイントへのリクエスト
WHEN リクエストが処理される
THEN トレースID付きでログが記録され
  AND レスポンスヘッダーにX-Trace-IDが含まれる
```

#### Scenario: エラーハンドリング
```
GIVEN エンドポイント処理中に例外が発生
WHEN エラーハンドラーが実行される
THEN 適切なHTTPステータスコードが返され
  AND エラーがログに記録され
  AND クライアントに安全なエラーメッセージが返される
```

## MODIFIED Requirements

### Requirement: HTTPサーバーの実装言語

#### Before:
```
GIVEN http_server.jsファイル
WHEN サーバーを起動
THEN Node.jsのhttpモジュールでサーバーが動作する
```

#### After:
```
GIVEN src/server.tsファイル
WHEN bun run src/server.tsを実行
THEN Bunランタイム上でHonoサーバーが動作する
```

### Requirement: エンドポイントのルーティング

#### Before:
```javascript
// http_server.js
if (req.method === 'POST' && req.url === '/message') {
  // 手動でルーティング処理
}
```

#### After:
```typescript
// src/server.ts
app.post('/api/message', validateMessage, messageHandler);
app.post('/api/runs', validateRun, runHandler);
app.get('/health', healthHandler);
```

## Related Capabilities

- **tmux-management**: TmuxManagerモジュールとの統合
- **agent-lifecycle**: AgentManagerモジュールとの統合
- **message-routing**: MessageRouterモジュールとの統合
- **session-state**: SessionStoreモジュールとの統合