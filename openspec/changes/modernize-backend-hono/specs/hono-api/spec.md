# Capability: Hono API Server

TypeScriptとHonoを使用したAPIサーバーの実装。シェルスクリプトの実行を管理。

## ADDED Requirements

### Requirement: HonoベースのAPIサーバー

#### Scenario: APIサーバーの起動
```
GIVEN Bun/Node.js環境が利用可能
WHEN bun run api/server.tsを実行
THEN Honoサーバーがポート8765で起動し
  AND /health, /message, /runs, /statusエンドポイントが利用可能になる
```

#### Scenario: /messageエンドポイント
```
GIVEN POSTリクエストが/messageに送信される
WHEN targetとmessageが含まれる
THEN send_message.shが実行され
  AND 成功レスポンスが返される
```

#### Scenario: /runsエンドポイント
```
GIVEN POSTリクエストが/runsに送信される
WHEN エージェント構成が含まれる
THEN mas.sh startが--configオプション付きで実行され
  AND セッションIDが返される
```

### Requirement: バリデーションとエラーハンドリング

#### Scenario: リクエストバリデーション
```
GIVEN 不正な形式のリクエスト
WHEN APIエンドポイントに送信される
THEN 400 Bad Requestが返され
  AND エラーの詳細が含まれる
```

#### Scenario: シェルスクリプトエラーの処理
```
GIVEN シェルスクリプトの実行が失敗
WHEN エラーコードが返される
THEN 適切なHTTPステータスコードが返され
  AND エラーメッセージが含まれる
```

## MODIFIED Requirements

### Requirement: HTTPサーバーの実装

#### Before:
```javascript
// http_server.js - 素のNode.js実装
const http = require('http');
// 手動でのルーティング処理
```

#### After:
```typescript
// api/server.ts - Hono実装
import { Hono } from 'hono';
import { cors } from 'hono/cors';
// 構造化されたルーティング
```

## Related Capabilities

- **shell-modules**: シェルスクリプトモジュールの呼び出し