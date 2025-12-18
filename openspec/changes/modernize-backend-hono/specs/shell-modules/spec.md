# Capability: Shell Script Modules

既存のシェルスクリプトを機能ごとにモジュール化し、保守性を向上。

## ADDED Requirements

### Requirement: モジュール化されたシェルスクリプト

#### Scenario: tmux操作モジュール
```
GIVEN lib/tmux.shモジュール
WHEN mas.shからsourceされる
THEN create_session, create_window, split_panes関数が利用可能になり
  AND tmux操作が抽象化される
```

#### Scenario: エージェント管理モジュール
```
GIVEN lib/agent.shモジュール
WHEN エージェント操作が必要
THEN init_agent, start_agent, stop_agent関数が利用可能になり
  AND エージェントのライフサイクルが管理される
```

#### Scenario: メッセージルーティングモジュール
```
GIVEN lib/message.shモジュール
WHEN メッセージ送信が必要
THEN route_message, expand_target関数が利用可能になり
  AND ターゲット展開とルーティングが処理される
```

### Requirement: 既存機能との互換性

#### Scenario: CLIコマンドの維持
```
GIVEN リファクタリング後のmas.sh
WHEN mas start, mas send等のコマンドを実行
THEN 既存と同じ動作をし
  AND 出力形式が変わらない
```

#### Scenario: 設定ファイルのサポート
```
GIVEN --configオプション付きのmas.sh起動
WHEN JSON設定ファイルが指定される
THEN エージェント構成が読み込まれ
  AND 指定通りにエージェントが起動する
```

## MODIFIED Requirements

### Requirement: コードの構造化

#### Before:
```bash
# mas.sh - 1129行の単一ファイル
# 全ての機能が1つのファイルに混在
```

#### After:
```bash
# mas.sh - メインエントリーポイント
source "$SCRIPT_DIR/lib/tmux.sh"
source "$SCRIPT_DIR/lib/agent.sh"
source "$SCRIPT_DIR/lib/message.sh"
# モジュール化された機能
```

## Related Capabilities

- **hono-api**: APIサーバーからの呼び出し