## ADDED Requirements

### Requirement: Stale Message Detection

システムは、エージェント間のメッセージ停滞を検出しなければならない（SHALL）。

停滞の判定基準:
- 指示フロー: マネージャーから部下への指示が3分以上ない
- 報告フロー: 部下からマネージャーへの報告が3分以上ない

監視対象ペア:
- 00 → 10, 20, 30（メタからユニットマネージャーへ）
- 10 → 11, 12, 13（デザインマネージャーからワーカーへ）
- 20 → 21, 22, 23（開発マネージャーからワーカーへ）
- 30 → 31, 32, 33（ビジネスマネージャーからワーカーへ）
- 逆方向の報告フロー

#### Scenario: Detect stale instruction
- **WHEN** エージェント20から21, 22, 23へのメッセージが3分以上ない
- **THEN** 停滞として検出される（type: instruction, from: "20"）

#### Scenario: Detect stale report
- **WHEN** エージェント21, 22, 23から20へのメッセージが3分以上ない
- **THEN** 停滞として検出される（type: report, to: "20"）

#### Scenario: No stale detected with recent activity
- **WHEN** 監視対象ペア間で3分以内にメッセージがある
- **THEN** 停滞として検出されない

### Requirement: Automatic Reminder Sending

システムは、停滞検出時に自動で催促メッセージを送信しなければならない（SHALL）。

催促メッセージテンプレート:
- 指示停滞: 「【システム通知】タスクの割り振りを完了してください。待機中のエージェントがいます。」
- 報告停滞: 「【システム通知】進捗を報告してください。マネージャーが待っています。」

送信者: "system"（システム自動送信）

#### Scenario: Send instruction reminder
- **WHEN** 指示フローの停滞が検出される
- **THEN** 送信者（マネージャー）に催促メッセージが送信される
- **AND** メッセージはtype: "reminder"でログに記録される

#### Scenario: Send report reminder
- **WHEN** 報告フローの停滞が検出される
- **THEN** 報告が必要なエージェント（ワーカー）に催促メッセージが送信される
- **AND** メッセージはtype: "reminder"でログに記録される

#### Scenario: Avoid duplicate reminders
- **WHEN** 同じ停滞に対して既に催促が送信されている
- **THEN** 重複して催促メッセージを送信しない

### Requirement: Monitor Polling Interval

システムは、30秒間隔で停滞チェックを実行しなければならない（SHALL）。

#### Scenario: Periodic check execution
- **WHEN** 監視が有効なセッションがある
- **THEN** 30秒ごとに停滞チェックが実行される

#### Scenario: Skip inactive sessions
- **WHEN** セッションが非アクティブ（tmuxセッションが存在しない）
- **THEN** そのセッションの監視はスキップされる

### Requirement: Monitor Control API

システムは、監視の開始・停止を制御するAPIを提供しなければならない（SHALL）。

#### Scenario: Start monitoring
- **WHEN** POST `/api/monitor/start?sessionId=session-abc` が呼び出される
- **THEN** そのセッションの停滞監視が開始される

#### Scenario: Stop monitoring
- **WHEN** POST `/api/monitor/stop?sessionId=session-abc` が呼び出される
- **THEN** そのセッションの停滞監視が停止される

#### Scenario: Get monitoring status
- **WHEN** GET `/api/monitor/status?sessionId=session-abc` が呼び出される
- **THEN** 監視状態（enabled/disabled）と最終チェック時刻が返される
