# MAS テストスイート

## 概要
このディレクトリには、MAS（Multi-Agent System）のHTTPサーバーとメッセージ送信機能のテストスクリプトが含まれています。

## テストスクリプト一覧

### 1. test_http_server.sh
HTTPサーバーのAPIエンドポイントをテストします。

**テスト内容:**
- 正常なPOSTリクエスト処理
- エラーハンドリング（不正なメソッド、パス、JSON）
- 必須パラメータのバリデーション
- レスポンスフォーマットの検証

**実行方法:**
```bash
bash tests/test_http_server.sh
```

### 2. test_send_message.sh
メッセージ送信スクリプト（send_message.sh）の機能をテストします。

**テスト内容:**
- 個別エージェントへの送信
- ユニット全体への送信
- グループ送信
- エラーハンドリング

**実行方法:**
```bash
bash tests/test_send_message.sh
```

**注意:** 現在、ドライランモードが未実装のため、一部のテストは失敗します。

### 3. test_e2e.sh
エンドツーエンドの統合テストを実行します。

**テスト内容:**
- HTTP→tmux配信の完全なフロー
- 複数エージェントへの同時配信
- 並行リクエスト処理
- システム再起動後の動作

**実行方法:**
```bash
bash tests/test_e2e.sh
```

### 4. test_error_handling.sh
エラーハンドリングとエッジケースをテストします。

**テスト内容:**
- 巨大ペイロード処理
- 不正な文字エンコーディング
- インジェクション攻撃への耐性
- DoS攻撃への耐性

**実行方法:**
```bash
bash tests/test_error_handling.sh
```

### 5. test_performance.sh
システムのパフォーマンスを測定します。

**測定項目:**
- HTTPレスポンスタイム
- スループット（req/s）
- 並行処理性能
- メモリ使用量
- CPU使用率
- レイテンシ分布

**実行方法:**
```bash
bash tests/test_performance.sh
```

## クイックスタート

### 全テストの実行
```bash
# MASシステムを起動
./mas.sh start

# 基本テストの実行
bash tests/test_http_server.sh

# パフォーマンス簡易チェック
for i in {1..10}; do
  time curl -s -X POST http://localhost:8765/message \
    -H "Content-Type: application/json" \
    -d '{"target":"00","message":"test"}' -o /dev/null
done
```

## テスト結果サマリー（2025-12-12）

| テストスイート | 状態 | 成功率 | 備考 |
|--------------|------|--------|------|
| HTTPサーバーテスト | ✅ | 10/10 (100%) | 全テスト合格 |
| メッセージ送信テスト | ⚠️ | 0/12 (0%) | ドライランモード未実装 |
| E2E統合テスト | ✅ | - | 基本フロー確認済み |
| エラーハンドリング | - | - | 未実行 |
| パフォーマンス | ✅ | - | <1ms レスポンスタイム |

## 環境要件

- Node.js (HTTPサーバー実行用)
- Bash 4.0以上
- curl (HTTPリクエスト用)
- tmux (メッセージ配信用)
- bc (数値計算用、パフォーマンステスト)

## トラブルシューティング

### HTTPサーバーが起動しない
```bash
# プロセスの確認
ps aux | grep http_server

# ポートの確認
lsof -i :8765

# ログの確認
tail -f .mas_http.log
```

### テストが失敗する
```bash
# HTTPサーバーの状態確認
curl http://localhost:8765/

# MASシステムの状態確認
./mas.sh status
```

## 今後の改善計画

1. **CI/CD統合**
   - GitHub Actionsでの自動テスト
   - カバレッジレポートの生成

2. **テストの拡充**
   - ユニットテストの追加
   - モックを使用したテスト
   - 負荷テストの自動化

3. **ドキュメント**
   - API仕様書（OpenAPI）の作成
   - テストケース詳細ドキュメント

## 関連ファイル

- [QUALITY_CHECKLIST.md](./QUALITY_CHECKLIST.md) - 品質管理チェックリスト
- [../http_server.js](../http_server.js) - HTTPサーバー実装
- [../send_message.sh](../send_message.sh) - メッセージ送信スクリプト
- [../mas.sh](../mas.sh) - MAS管理スクリプト

---
最終更新: 2025-12-12