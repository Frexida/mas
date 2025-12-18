# エラーハンドリング改善

## ADDED Requirements

### Requirement: 包括的なエラーハンドリング
すべてのAPIエンドポイントは、予測可能で一貫性のあるエラーレスポンスを返さなければならない。

#### Scenario: 存在しないスクリプトエラー
GIVEN mas.shが存在しない、または設定オプションをサポートしない
WHEN /runs エンドポイントが呼び出される
THEN 500エラーと具体的なエラーメッセージが返される
AND エラーコード "SCRIPT_NOT_FOUND" または "UNSUPPORTED_OPTION" が含まれる

#### Scenario: JSON解析エラー
GIVEN 不正なJSONが送信される
WHEN APIエンドポイントがリクエストを処理する
THEN 400エラーと解析エラーの詳細が返される
AND Cloudflare経由でも同じエラーが一貫して返される

### Requirement: エラーコードの体系化
すべてのエラーは明確に定義されたエラーコードを持たなければならない。

#### Scenario: エラーコード分類
GIVEN エラーが発生した
WHEN エラーレスポンスが生成される
THEN 以下のカテゴリのいずれかのエラーコードが含まれる：
- VALIDATION_ERROR（400系）
- RESOURCE_NOT_FOUND（404系）
- INTERNAL_ERROR（500系）
- TIMEOUT_ERROR（タイムアウト）

## MODIFIED Requirements

### Requirement: エラーメッセージの詳細化
エラーメッセージは問題の原因と解決方法を明確に示さなければならない。

#### Scenario: セッション作成失敗
GIVEN tmuxセッションの作成が失敗する
WHEN エラーレスポンスが返される
THEN エラーメッセージには以下が含まれる：
- 失敗の具体的な理由
- 可能な解決策
- 関連するログの参照先