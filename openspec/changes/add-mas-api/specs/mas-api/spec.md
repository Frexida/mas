# MAS API仕様

## ADDED Requirements

### Requirement: MAS実行API
システムは、WebUIから送信されたエージェント構成を受け取り、新しいMASセッションを開始するHTTP APIエンドポイントを提供しなければならない（SHALL）。

#### Scenario: 単一ユニットでのMAS起動
- **WHEN** WebUIから1ユニット構成（manager 1体、worker 3体）のリクエストが送信される
- **THEN** システムはUUIDを生成し、tmuxセッションを起動し、セッション情報を返す

#### Scenario: 複数ユニットでのMAS起動（メタマネージャー付き）
- **WHEN** WebUIから2ユニット以上の構成（メタマネージャー付き）のリクエストが送信される
- **THEN** システムはメタマネージャーを含むtmuxセッションを起動し、セッション情報を返す

#### Scenario: 不正なリクエストの処理
- **WHEN** 必須フィールド（agents）が欠けたリクエストが送信される
- **THEN** システムは400エラーとエラーメッセージを返す

### Requirement: セッション識別子管理
システムは、各MAS実行をUUIDで一意に識別し、このUUIDをセッションID、tmuxセッション名、ワーキングディレクトリ名として統一的に使用しなければならない（SHALL）。

#### Scenario: UUID生成と利用
- **WHEN** 新しいMAS実行が要求される
- **THEN** システムは新しいUUIDを生成し、全ての識別子として使用する

#### Scenario: ディレクトリ構造の作成
- **WHEN** セッションが開始される
- **THEN** システムは`sessions/{sessionId}/`ディレクトリを作成し、config.json、logs/、outputs/サブディレクトリを含める

### Requirement: エージェント構成の保存
システムは、受信したエージェント構成を一切加工せずに`config.json`として保存しなければならない（SHALL）。

#### Scenario: 設定ファイルの保存
- **WHEN** エージェント構成を含むリクエストが受信される
- **THEN** システムは`sessions/{sessionId}/config.json`に構成を保存する

### Requirement: OpenAPI仕様書
システムのAPI仕様はOpenAPI 3.0.3形式で文書化され、全てのエンドポイント、スキーマ、サンプルを含まなければならない（SHALL）。

#### Scenario: /runsエンドポイントの定義
- **WHEN** 開発者がAPI仕様を参照する
- **THEN** /runsエンドポイントの完全な仕様（リクエスト/レスポンススキーマ、サンプル、エラーケース）が利用可能である

#### Scenario: コードサンプルの提供
- **WHEN** 開発者がAPIを利用したい
- **THEN** curl、JavaScript、Pythonでのコードサンプルが提供される

### Requirement: CORS対応
APIは、ブラウザベースのWebUIからのクロスオリジンリクエストをサポートしなければならない（SHALL）。

#### Scenario: CORSプリフライトリクエスト
- **WHEN** ブラウザからOPTIONSリクエストが送信される
- **THEN** システムは適切なCORSヘッダーを返す