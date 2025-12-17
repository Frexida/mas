# API仕様準拠

## ADDED Requirements

### Requirement: OpenAPI仕様との完全準拠
システムはopenapi.yamlに定義されたすべてのエンドポイント、リクエスト/レスポンススキーマ、バリデーションルールに準拠しなければならない。

#### Scenario: /runs エンドポイントの動作
GIVEN クライアントがエージェント構成を持っている
WHEN POST /runs にリクエストを送信する
THEN 201ステータスとUUID形式のsessionIdが返される
AND tmuxセッションが作成される
AND 指定されたエージェントが起動される

#### Scenario: /message エンドポイントの動作
GIVEN アクティブなMASセッションが存在する
WHEN POST /message でターゲットとメッセージを送信する
THEN 200ステータスと"acknowledged"ステータスが返される
AND 指定されたtmuxウィンドウにメッセージが送信される

## MODIFIED Requirements

### Requirement: レスポンススキーマの一致
すべてのAPIレスポンスはOpenAPI仕様で定義されたスキーマと完全に一致しなければならない。

#### Scenario: MessageResponseの形式
GIVEN /message エンドポイントへのリクエスト
WHEN レスポンスが返される
THEN status フィールドは "acknowledged" である
AND timestamp と target フィールドが含まれる

### Requirement: バリデーションルールの統一
入力検証はOpenAPI仕様のパターンと制限に従わなければならない。

#### Scenario: Agent IDの検証
GIVEN エージェントIDを含むリクエスト
WHEN バリデーションが実行される
THEN パターン ^[0-9]{2}$ に一致するIDのみが受け入れられる

## REMOVED Requirements

### Requirement: 固定エージェント構成
（削除理由：動的構成をサポートするため）

#### Scenario: 固定13エージェント構成
GIVEN MASセッション開始時
WHEN エージェントが起動される
THEN 常に13個の固定エージェントが起動される
（このシナリオは削除され、動的構成に置き換えられる）