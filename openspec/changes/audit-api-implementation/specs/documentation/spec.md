# API文書化要件

## ADDED Requirements

### Requirement: 完全なAPI文書化
すべての実装されたエンドポイントはOpenAPI仕様に文書化されなければならない。

#### Scenario: /status エンドポイントの文書化
GIVEN /status エンドポイントが実装されている
WHEN OpenAPI仕様を参照する
THEN /status エンドポイントの定義が含まれる
AND リクエスト/レスポンススキーマが正確に記述される

#### Scenario: /health エンドポイントの文書化
GIVEN /health エンドポイントが実装されている
WHEN OpenAPI仕様を参照する
THEN /health エンドポイントの定義が含まれる
AND ヘルスチェックの目的と応答形式が記述される

### Requirement: 実装と仕様の同期
コード変更時は必ず対応するOpenAPI仕様も更新されなければならない。

#### Scenario: エンドポイント追加時の文書化
GIVEN 新しいエンドポイントが追加される
WHEN 実装がコミットされる
THEN 同じコミットでOpenAPI仕様も更新される
AND Swagger UIで新しいエンドポイントが表示される

## MODIFIED Requirements

### Requirement: サンプルコードの正確性
OpenAPI仕様のサンプルコードは実際に動作しなければならない。

#### Scenario: cURLサンプルの動作確認
GIVEN OpenAPI仕様のx-codeSamplesセクション
WHEN cURLサンプルをコピーして実行する
THEN エラーなく期待されるレスポンスが返される
AND 文書化されたすべてのパラメータが正しく処理される