# Change: HonoベースのAPIサーバー導入とシェルスクリプトのモジュール化

## Why

現在のMASシステムは基本的に良好に動作していますが、以下の改善点があります：

1. **API実装の改善**
   - 現在の`http_server.js`（42行）は最小限の実装
   - OpenAPI仕様で定義された`/runs`エンドポイントが未実装
   - エラーハンドリングやバリデーションが不十分

2. **シェルスクリプトの整理**
   - `mas.sh`（1129行）に多くの機能が集約されている
   - 機能ごとのモジュール化により保守性向上が可能
   - テスト可能性の向上が必要

3. **API周りの型安全性**
   - リクエスト/レスポンスの型チェックがない
   - TypeScriptによるAPI層の型安全性が必要

## What Changes

### アーキテクチャの基本方針

**維持するもの**:
- シェルスクリプトによるtmux操作とエージェント管理
- 既存のメッセージルーティングロジック
- CLIツールとしての使いやすさ

**改善するもの**:
- HonoによるAPIサーバー実装（TypeScript）
- シェルスクリプトの機能別モジュール分割
- API層のバリデーションとエラーハンドリング

### ファイル構造

```
mas/
├── api/                      # APIサーバー（TypeScript）
│   ├── server.ts            # Honoアプリケーション
│   ├── routes/              # APIルート定義
│   │   ├── message.ts      # /messageエンドポイント
│   │   ├── runs.ts         # /runsエンドポイント
│   │   └── status.ts       # /statusエンドポイント
│   ├── validators/          # リクエストバリデーション
│   └── types/              # TypeScript型定義
├── lib/                     # シェルスクリプトモジュール（既存を整理）
│   ├── tmux.sh             # tmux操作関連
│   ├── agent.sh            # エージェント管理
│   ├── message.sh          # メッセージルーティング
│   ├── session.sh          # セッション管理
│   └── project.sh          # プロジェクト管理（既存）
├── mas.sh                   # メインCLI（リファクタリング）
├── send_message.sh          # メッセージ送信（既存維持）
└── init_unit.sh            # ユニット初期化（既存維持）
```

### 実装方針

1. **APIサーバー（Hono + TypeScript）**
   ```typescript
   // api/server.ts
   import { Hono } from 'hono';
   import { cors } from 'hono/cors';
   import messageRoute from './routes/message';
   import runsRoute from './routes/runs';

   const app = new Hono();
   app.use('*', cors());

   app.route('/message', messageRoute);
   app.route('/runs', runsRoute);

   export default app;
   ```

2. **シェルスクリプトの呼び出し**
   ```typescript
   // api/routes/message.ts
   import { exec } from 'child_process';
   import { promisify } from 'util';

   const execAsync = promisify(exec);

   app.post('/', async (c) => {
     const { target, message } = await c.req.json();

     // 既存のsend_message.shを活用
     await execAsync(`./send_message.sh -t "${target}" -m "${message}"`);

     return c.json({ status: 'sent', timestamp: new Date() });
   });
   ```

3. **シェルスクリプトのモジュール化**
   ```bash
   # lib/tmux.sh - tmux操作を分離
   create_session() {
     local session_name="$1"
     tmux new-session -d -s "$session_name" -n meta
   }

   create_windows() {
     local session_name="$1"
     tmux new-window -t "$session_name:1" -n design
     tmux new-window -t "$session_name:2" -n development
     tmux new-window -t "$session_name:3" -n business
   }
   ```

## Impact

### Positive Impact

1. **最小限の変更で最大の効果**
   - 既存のシェルスクリプトの良さを維持
   - API層のみTypeScript化で型安全性向上
   - 段階的な改善が可能

2. **保守性の向上**
   - 機能ごとのモジュール分割で見通しが良くなる
   - APIとCLI処理の分離
   - テストしやすい構造

3. **既存資産の活用**
   - 実績のあるシェルスクリプトロジックを維持
   - tmux操作の信頼性を保持
   - 学習コストを最小化

### Migration Path

1. **Phase 1: APIサーバー構築（1週間）**
   - Honoサーバーのセットアップ
   - 既存`/message`エンドポイントの移植
   - `/runs`エンドポイントの実装

2. **Phase 2: シェルスクリプトのモジュール化（1週間）**
   - `mas.sh`から機能を`lib/`配下に分離
   - 共通関数の整理
   - モジュール間のインターフェース定義

3. **Phase 3: 統合とテスト（3日）**
   - APIサーバーとシェルスクリプトの連携確認
   - エンドツーエンドテスト
   - ドキュメント更新

### Dependencies

- Node.js/Bun（APIサーバー用）
- TypeScript（API層のみ）
- Hono（軽量Webフレームワーク）
- 既存のシェルスクリプト環境

## Success Criteria

1. **機能要件**
   - OpenAPI仕様の全エンドポイントが動作
   - 既存のCLI機能が全て維持される
   - エラーハンドリングの改善

2. **非機能要件**
   - APIレスポンス時間100ms以内
   - 既存スクリプトとの100%互換性
   - コードの可読性向上

3. **保守性**
   - モジュール化されたシェルスクリプト
   - API層の型定義
   - テストカバレッジの向上