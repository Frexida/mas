# MAS API設計文書

## Context
MASシステムは複数のAIエージェントを並列で動作させるシステムです。WebUIから設定を受け取り、tmuxセッション内で各エージェントを起動します。APIは「起動のトリガー」としてのみ機能し、状態管理はtmuxとファイルシステムに委譲します。

## Goals / Non-Goals
- Goals:
  - WebUIからのエージェント構成送信
  - UUIDベースのセッション識別
  - tmuxセッションの自動起動
  - 設定のファイルシステムへの保存

- Non-Goals:
  - 実行状態のAPIによる管理
  - セッションの停止・再開機能
  - エージェント間通信の仲介
  - 成果物取得API

## Decisions

### Decision 1: ステートレスAPI設計
- APIは「実行開始」のみを担当
- 状態管理はtmuxとファイルシステムに委譲
- Alternative: ステートフルなAPIサーバー → 複雑性が増し、tmuxの既存機能と重複

### Decision 2: UUID識別子の統一
- sessionId = tmuxセッション名 = ディレクトリ名
- Alternative: 別々の識別子体系 → 管理が複雑化し、混乱の元

### Decision 3: OpenAPI 3.0.3仕様の採用
- 既存のopenapi.yamlとの互換性維持
- ツールチェーンの標準化
- Alternative: OpenAPI 3.1 → 既存システムとの互換性問題

## Architecture
```
[WebUI] --POST /runs--> [HTTP API Server]
                              |
                              v
                        [UUID生成]
                              |
                              v
                        [ディレクトリ作成]
                              |
                              v
                        [config.json保存]
                              |
                              v
                        [tmux起動]
                              |
                              v
                        [エージェント起動]
```

## Risks / Trade-offs
- Risk: tmuxセッションの異常終了 → ログファイルで原因追跡
- Risk: 同時実行数の制限なし → リソース監視と制限機能の将来追加
- Trade-off: 状態管理をAPIで行わない → シンプルさと引き換えに外部監視が必要

## Migration Plan
1. 既存のopenapi.yamlに新しいエンドポイントを追加
2. http_server.jsを拡張して/runsエンドポイントを実装
3. 既存の/messageエンドポイントとの共存確認
4. ロールバック: 追加部分の削除のみで対応可能

## Open Questions
- セキュリティ（認証・認可）の実装時期
- 同時実行セッション数の上限設定
- ログローテーションの方針