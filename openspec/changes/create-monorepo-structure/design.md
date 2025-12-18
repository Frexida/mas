# Design: Monorepo Structure

## Architecture Overview

```
mas/                              # ルートディレクトリ
├── package.json                  # Workspaces定義、統合スクリプト
├── README.md                     # プロジェクト全体の説明
├── LICENSE                       # MITライセンス
├── .gitignore                    # 統合gitignore
│
├── web/                          # フロントエンドアプリケーション
│   ├── package.json              # フロントエンド依存関係
│   ├── src/                      # Reactソースコード
│   ├── public/                   # 静的ファイル
│   ├── vite.config.ts            # Vite設定
│   └── tsconfig.json             # TypeScript設定
│
├── api/                          # バックエンドAPI（既存）
│   ├── package.json              # API依存関係
│   ├── server.ts                 # Honoサーバー
│   ├── routes/                   # APIルート
│   └── tsconfig.json             # TypeScript設定
│
├── lib/                          # シェルスクリプトライブラリ（既存）
│   ├── mas-agent.sh
│   ├── mas-message.sh
│   ├── mas-session.sh
│   └── mas-tmux.sh
│
├── scripts/                      # 統合スクリプト（既存＋新規）
│   ├── install.sh                # インストールスクリプト
│   ├── start-dev.js              # 開発環境起動
│   └── start-prod.js             # 本番環境起動
│
├── unit/                         # エージェント設定（既存）
├── workflows/                    # ワークフロー定義（既存）
├── docs/                         # ドキュメント（統合）
└── examples/                     # サンプル設定（既存）
```

## Naming Conventions & Conflict Resolution

### ファイル統合ルール

1. **README.md**
   - ルートREADME.md: プロジェクト全体の説明（backend優先、frontend情報を追加）
   - web/README.md: フロントエンド固有の開発ドキュメント
   - api/README.md: API仕様書（既存維持）

2. **package.json**
   - ルートpackage.json: workspaces定義、共通スクリプト
   - web/package.json: フロントエンド依存関係
   - api/package.json: バックエンド依存関係

3. **.gitignore**
   - 両ブランチの内容をマージし、重複を削除
   - セクションごとに整理（Node.js, Build, IDE, OS, Project-specific）

4. **LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md**
   - backendブランチの内容を使用（より完成度が高い）

5. **TypeScript設定**
   - 各ディレクトリで独立した tsconfig.json を維持
   - ルートに tsconfig.base.json を作成して共通設定を定義

## Package Structure

### ルート package.json
```json
{
  "name": "mas",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "api",
    "web"
  ],
  "scripts": {
    "install:all": "npm install",
    "start": "node scripts/start-dev.js",
    "start:api": "npm run start --workspace=api",
    "start:web": "npm run dev --workspace=web",
    "start:mas": "./mas start --no-attach",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

## Startup Sequence

### 開発環境起動フロー（npm start）
1. MASセッションチェック・起動
2. APIサーバー起動（port 8765）
3. フロントエンド開発サーバー起動（port 5173）
4. ブラウザ自動オープン（オプション）

### scripts/start-dev.js
```javascript
// 並行起動スクリプトの概要
// 1. MASセッション確認・起動
// 2. concurrentlyで api と web を並行起動
// 3. 起動状態の監視とログ出力
```

## Migration Strategy

### Phase 1: ブランチマージ
1. 新しいブランチ `feature/monorepo` を作成
2. `frontend` ブランチを `--allow-unrelated-histories` でマージ
3. フロントエンドファイルを `web/` ディレクトリに移動

### Phase 2: コンフリクト解決
1. 重複ファイルの統合（上記ルールに従う）
2. パスの修正（import文、設定ファイル）
3. スクリプトの調整

### Phase 3: 統合テスト
1. インストール手順の検証
2. 起動スクリプトのテスト
3. API-フロントエンド通信の確認

## Benefits

1. **開発者体験の向上**
   - ワンコマンドセットアップ
   - 統合された開発環境
   - 型定義の共有

2. **保守性**
   - 統一されたバージョン管理
   - 依存関係の一元管理
   - CI/CDの簡素化

3. **OSS配布**
   - シンプルなインストール手順
   - 完全なローカル環境
   - Docker対応も容易