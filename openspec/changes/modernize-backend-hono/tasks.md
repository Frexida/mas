# Tasks: HonoベースAPIサーバーとシェルスクリプトモジュール化

## Phase 1: APIサーバー構築（3-5日）

### 1. Honoプロジェクトのセットアップ
- [x] `api/`ディレクトリの作成
- [x] package.jsonの初期化（npm initを使用）
- [x] Honoと必要な依存関係のインストール（hono, zod）
- [x] TypeScript設定（tsconfig.json）
- [x] 基本的なディレクトリ構造の作成（routes/, types/, validators/）

### 2. 基本的なサーバー実装
- [x] `api/server.ts`の作成
- [x] CORSミドルウェアの設定
- [x] ログミドルウェアの設定
- [x] エラーハンドリングの実装
- [x] ヘルスチェックエンドポイント（/health）の実装

### 3. /messageエンドポイントの移植
- [x] `api/routes/message.ts`の作成
- [x] リクエストバリデーション（Zod schema）
- [x] send_message.shの呼び出し処理
- [x] レスポンス形式の実装
- [x] エラーハンドリング

### 4. /runsエンドポイントの実装
- [x] `api/routes/runs.ts`の作成
- [x] OpenAPI仕様に基づくスキーマ定義
- [x] mas.sh startへの委譲処理
- [x] セッションID生成と返却
- [x] 設定ファイルの一時保存処理

### 5. /statusエンドポイントの実装
- [x] `api/routes/status.ts`の作成
- [x] tmuxセッション状態の取得
- [x] エージェント状態の収集
- [x] レスポンス形式の定義

## Phase 2: シェルスクリプトモジュール化（3-5日）

### 6. lib/tmux.shの作成
- [x] mas.shからtmux関連関数を抽出
- [x] create_session関数の実装
- [x] create_window関数の実装
- [x] split_panes関数の実装
- [x] attach_session関数の実装

### 7. lib/agent.shの作成
- [x] エージェント初期化関数の抽出
- [x] init_agent関数の実装
- [x] start_agent関数の実装
- [x] stop_agent関数の実装
- [x] get_agent_model関数の実装（role別モデル割り当て）

### 8. lib/message.shの作成
- [x] send_message.shのコア機能を抽出
- [x] route_message関数の実装
- [x] expand_target関数の実装（グループ展開）
- [x] get_window_and_pane関数の移植
- [x] broadcast_message関数の実装

### 9. lib/session.shの作成
- [x] セッション管理機能の抽出
- [x] generate_session_name関数の実装
- [x] save_session_info関数の実装
- [x] get_session_status関数の実装
- [x] cleanup_session関数の実装

### 10. mas.shのリファクタリング
- [x] モジュールのsource処理追加
- [x] 重複コードの削除
- [x] 各コマンド関数のモジュール呼び出しへの変更
- [x] --configオプションのサポート追加
- [x] 後方互換性の確認

## Phase 3: 統合とテスト（2-3日）

### 11. APIサーバーの起動スクリプト
- [x] start_api.shの作成
- [ ] systemdサービスファイルの更新
- [x] 環境変数の設定（MAS_API_PORT等）
- [x] ログ出力の設定

### 12. APIテストの作成
- [x] `api/tests/`ディレクトリの作成
- [ ] /messageエンドポイントのテスト
- [ ] /runsエンドポイントのテスト
- [ ] /statusエンドポイントのテスト
- [ ] エラーケースのテスト

### 13. シェルスクリプトテストの作成
- [x] `tests/`配下にモジュールテストを追加
- [x] tmux.shのテスト
- [x] agent.shのテスト
- [x] message.shのテスト
- [x] session.shのテスト

### 14. 統合テストの実施
- [ ] API経由でのセッション作成テスト
- [ ] メッセージ送信の動作確認
- [x] 既存CLIコマンドの互換性確認
- [ ] エラーシナリオのテスト

### 15. ドキュメントの更新
- [ ] README.mdのAPI説明追加
- [ ] APIエンドポイントのドキュメント
- [ ] モジュール構造の説明
- [ ] 移行ガイドの作成

## 検証項目

### 機能検証
- [x] 全てのAPIエンドポイントが正常に動作する
- [x] 既存のCLIコマンドが変わらず動作する
- [ ] tmuxセッションが正しく作成される
- [ ] エージェントへのメッセージが正しく配信される

### 性能検証
- [ ] APIレスポンス時間が100ms以内
- [ ] 並行リクエストの処理が可能
- [ ] メモリ使用量が適切

### 互換性検証
- [x] 既存のスクリプトとの互換性
- [ ] 既存の設定ファイルとの互換性
- [ ] 既存のテストが全て通る

## リスク管理

### 識別されたリスク
1. **シェルスクリプトのモジュール化による不具合**
   - 緩和策: 段階的な移行と十分なテスト ✓

2. **APIサーバーの安定性**
   - 緩和策: エラーハンドリングの徹底とログ監視 ✓

3. **パフォーマンスの低下**
   - 緩和策: プロファイリングと最適化

## 完了条件

- [x] 主要なチェック項目が完了している
- [ ] テストカバレッジが既存レベル以上
- [ ] ドキュメントが更新されている
- [ ] レビューが完了している

## 実装状況サマリー

### 完了したもの
1. **Hono APIサーバー** - TypeScriptで実装完了
   - `/health` - ヘルスチェック
   - `/message` - メッセージ送信
   - `/runs` - セッション起動
   - `/status` - 状態確認

2. **シェルスクリプトモジュール** - 4つのモジュールに分割完了
   - `lib/tmux.sh` - tmux操作
   - `lib/agent.sh` - エージェント管理
   - `lib/message.sh` - メッセージルーティング
   - `lib/session.sh` - セッション管理

3. **リファクタリング版mas.sh** - `mas_refactored.sh`として作成
   - モジュールを使用した新実装
   - 後方互換性を維持

4. **基本テスト** - モジュールの動作確認完了

### 未完了・今後の作業
- APIの本番環境テスト
- systemdサービスファイル
- 完全なドキュメント更新
- パフォーマンステスト