## ADDED Requirements

### Requirement: Chat Viewer Page

システムは、エージェント間のメッセージ履歴を閲覧できるチャットビューワーページを提供しなければならない（SHALL）。

ページは `/chat?sessionId={sessionId}` でアクセス可能とする。

#### Scenario: Access chat viewer with session
- **WHEN** ユーザーが `/chat?sessionId=session-abc` にアクセスする
- **THEN** そのセッションのメッセージ履歴が表示される

#### Scenario: Access chat viewer without session
- **WHEN** ユーザーが sessionId なしで `/chat` にアクセスする
- **THEN** セッション選択を促すメッセージが表示される

### Requirement: Channel-Based Message View

システムは、チャンネルベースでメッセージをフィルタリングして表示しなければならない（SHALL）。

利用可能なチャンネル:
- `all`: 全メッセージを表示
- `unit-0`: Meta Unit（エージェント00）関連のメッセージ
- `unit-1`: Design Unit（エージェント10-13）関連のメッセージ
- `unit-2`: Development Unit（エージェント20-23）関連のメッセージ
- `unit-3`: Business Unit（エージェント30-33）関連のメッセージ

#### Scenario: View all messages
- **WHEN** ユーザーが "all" チャンネルを選択する
- **THEN** セッション内の全メッセージが時系列で表示される

#### Scenario: Filter by unit channel
- **WHEN** ユーザーが "unit-2" チャンネルを選択する
- **THEN** エージェント20, 21, 22, 23が送信または受信したメッセージのみ表示される

#### Scenario: Switch channels
- **WHEN** ユーザーが別のチャンネルを選択する
- **THEN** 表示されるメッセージが即座に切り替わる

### Requirement: Message Display Format

システムは、各メッセージをSlack/Discord風のフォーマットで表示しなければならない（SHALL）。

表示要素:
- 送信者アバター（エージェントIDに基づく）
- 送信者名（エージェントID + ユニット名）
- タイムスタンプ
- メッセージ内容
- 送信先情報
- メッセージ種別インジケータ

#### Scenario: Display instruction message
- **WHEN** type: "instruction" のメッセージが表示される
- **THEN** 指示メッセージであることを示すインジケータが表示される

#### Scenario: Display system reminder
- **WHEN** type: "reminder" のメッセージが表示される
- **THEN** システム通知として視覚的に区別された表示となる

### Requirement: Infinite Scroll Loading

システムは、メッセージ履歴をスクロールに応じて追加読み込みしなければならない（SHALL）。

#### Scenario: Load more messages on scroll
- **WHEN** ユーザーがメッセージリストを上方向にスクロールする
- **THEN** より古いメッセージが追加で読み込まれる

#### Scenario: Initial load limit
- **WHEN** チャットビューワーが開かれる
- **THEN** 最新の50件のメッセージが表示される
