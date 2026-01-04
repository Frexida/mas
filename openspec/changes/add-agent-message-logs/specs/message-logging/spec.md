## ADDED Requirements

### Requirement: Message Logging on Send

システムは、エージェント間のメッセージ送信時に、送信ログを保存しなければならない（SHALL）。

ログには以下の情報を含む:
- 一意なID（UUID）
- セッションID
- タイムスタンプ（ISO 8601形式）
- 送信者エージェントID
- 送信先ターゲット（展開前）
- 受信者リスト（展開後）
- メッセージ内容
- メッセージ種別（instruction, report, broadcast, reminder）
- 実行フラグ

#### Scenario: Message logged on successful send
- **WHEN** エージェント"00"が"development"にメッセージ「タスクを開始してください」を送信する
- **THEN** メッセージログが保存される
  - sender: "00"
  - target: "development"
  - recipients: ["20", "21", "22", "23"]
  - message: "タスクを開始してください"
  - type: "instruction"

#### Scenario: Message logged with execute flag
- **WHEN** エージェントがexecute=trueでメッセージを送信する
- **THEN** ログのexecuteフィールドがtrueで保存される

### Requirement: Message Log Storage

システムは、メッセージログをセッションごとに分離して保存しなければならない（SHALL）。

#### Scenario: Logs stored per session
- **WHEN** セッション"session-abc"でメッセージが送信される
- **THEN** ログは`sessions/session-abc/messages.json`に保存される

#### Scenario: Logs isolated between sessions
- **WHEN** セッション"session-abc"のログを取得する
- **THEN** 他のセッションのログは含まれない

### Requirement: Message Log Retrieval API

システムは、メッセージログを取得するAPIエンドポイントを提供しなければならない（SHALL）。

#### Scenario: Get all logs for session
- **WHEN** GET `/api/messages?sessionId=session-abc` が呼び出される
- **THEN** そのセッションの全メッセージログがタイムスタンプ降順で返される

#### Scenario: Get logs with pagination
- **WHEN** GET `/api/messages?sessionId=session-abc&limit=50&before=2024-01-01T12:00:00Z` が呼び出される
- **THEN** 指定時刻より前の最大50件のログが返される

#### Scenario: Get logs by channel filter
- **WHEN** GET `/api/messages?sessionId=session-abc&channel=unit-2` が呼び出される
- **THEN** Unit 2（エージェント20-23）に関連するメッセージのみが返される
