# Change: MASバックエンドのHono移行とアーキテクチャ刷新

## Why

現在のMASシステムは、以下の技術的課題を抱えています：

1. **Shell Script中心の非構造化実装**
   - tmux管理、エージェント制御、メッセージルーティングが複数のシェルスクリプトに分散
   - エラーハンドリングや状態管理が困難
   - テストが困難（dry-runモード未実装、メッセージ送信テスト0%）

2. **API実装の不完全性**
   - OpenAPI仕様で定義された`/runs`エンドポイントが未実装
   - 最小限の`http_server.js`（42行）のみでスケーラビリティに欠ける
   - 型安全性なし、バリデーション不足

3. **モジュール性の欠如**
   - 13エージェント×4ウィンドウの管理ロジックがmas.shに密結合
   - 再利用可能なコンポーネントがない
   - 機能拡張が困難

この変更により、TypeScript + Honoベースの構造化されたバックエンドへ移行し、保守性・拡張性・テスタビリティを大幅に改善します。

## What Changes

### アーキテクチャレベル

1. **Honoベースの新しいAPIサーバー**
   - TypeScriptによる型安全な実装
   - OpenAPI仕様からの自動型生成
   - ミドルウェアによる横断的関心事の分離（CORS、ロギング、エラーハンドリング）

2. **モジュール化されたコアシステム**
   - TmuxManager: tmuxセッション管理の抽象化
   - AgentManager: エージェントライフサイクル管理
   - MessageRouter: メッセージルーティングロジック
   - SessionStore: セッション状態管理

3. **段階的移行戦略**
   - 既存シェルスクリプトをTypeScriptモジュールから呼び出し（初期フェーズ）
   - 徐々に内部実装をTypeScriptへ移植（後続フェーズ）
   - 後方互換性を維持しながら新機能追加

### 技術スタック

- **Runtime**: Node.js + Bun（高速実行）
- **Framework**: Hono（軽量、高速、Web標準準拠）
- **Language**: TypeScript（型安全性）
- **Validation**: Zod（スキーマバリデーション）
- **Testing**: Vitest（単体テスト）+ Playwright（E2Eテスト）
- **Process**: node-pty（疑似端末管理）

### ファイル構造

```
mas/
├── src/                      # TypeScriptソースコード
│   ├── server.ts            # Honoアプリケーションエントリー
│   ├── api/                 # APIエンドポイント
│   │   ├── runs.ts         # /runsエンドポイント実装
│   │   ├── message.ts      # /messageエンドポイント実装
│   │   └── status.ts       # /statusエンドポイント（新規）
│   ├── core/                # コアビジネスロジック
│   │   ├── tmux-manager.ts # Tmux管理
│   │   ├── agent-manager.ts # エージェント管理
│   │   ├── message-router.ts # メッセージルーティング
│   │   └── session-store.ts # セッション状態管理
│   ├── adapters/            # 外部システムアダプター
│   │   ├── shell-adapter.ts # シェルスクリプト実行
│   │   └── claude-adapter.ts # Claude API接続
│   ├── types/               # 型定義
│   │   ├── api.ts          # API型（OpenAPIから生成）
│   │   └── domain.ts       # ドメイン型
│   └── utils/              # ユーティリティ
│       ├── logger.ts       # ロギング
│       └── config.ts       # 設定管理
├── tests/                   # テストコード
│   ├── unit/               # 単体テスト
│   ├── integration/        # 統合テスト
│   └── e2e/               # E2Eテスト
├── scripts/                # ビルド・デプロイスクリプト
├── openapi.yaml           # OpenAPI仕様（既存）
├── tsconfig.json          # TypeScript設定
├── package.json           # 依存関係
└── bun.lockb             # ロックファイル
```

## Impact

### Positive Impact

1. **開発効率の向上**
   - TypeScriptによる型安全性でバグの早期発見
   - IDEサポート（自動補完、リファクタリング）
   - モジュール化によるコードの再利用性向上

2. **保守性の改善**
   - 構造化されたコードベース
   - 包括的なテストカバレッジ
   - 明確な責務分離

3. **拡張性の向上**
   - プラグインアーキテクチャの基盤
   - 新しいエンドポイントの追加が容易
   - WebSocketサポートなど将来の機能拡張が可能

4. **運用性の改善**
   - 構造化されたロギング
   - メトリクス収集の基盤
   - ヘルスチェックエンドポイント

### Migration Path

1. **Phase 1: 基盤構築（1週間）**
   - Honoサーバーのセットアップ
   - 既存`/message`エンドポイントの移植
   - シェルアダプターの実装

2. **Phase 2: コア機能実装（2週間）**
   - `/runs`エンドポイントの実装
   - TmuxManager、AgentManagerの実装
   - 基本的なテストカバレッジ

3. **Phase 3: 段階的移行（3週間）**
   - シェルスクリプトロジックのTypeScript移植
   - 状態管理の改善
   - パフォーマンス最適化

4. **Phase 4: 完全移行（2週間）**
   - レガシーコードの除去
   - ドキュメント更新
   - 本番環境への展開

### Risks & Mitigations

1. **Risk**: 既存機能の破壊
   - **Mitigation**: 包括的なE2Eテスト、段階的移行、フィーチャーフラグ

2. **Risk**: パフォーマンス低下
   - **Mitigation**: Bun runtime使用、ベンチマーク実施、最適化

3. **Risk**: 学習曲線
   - **Mitigation**: 詳細なドキュメント、コード例、段階的導入

### Dependencies

- 既存の`mas.sh`、`send_message.sh`との統合
- tmuxバージョン互換性
- Node.js/Bun環境
- Claude CLIとの連携

## Success Criteria

1. **機能的完全性**
   - OpenAPI仕様の全エンドポイントが実装されている
   - 既存のシェルスクリプト機能が全て移植されている
   - 後方互換性が維持されている

2. **品質指標**
   - テストカバレッジ80%以上
   - エンドポイント応答時間100ms以内
   - エラー率1%未満

3. **開発者体験**
   - TypeScript型定義100%
   - APIドキュメント自動生成
   - ローカル開発環境の簡素化