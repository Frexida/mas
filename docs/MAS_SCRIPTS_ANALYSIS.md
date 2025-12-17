# MAS Shell Scripts 分析ドキュメント

## 概要
このドキュメントは、元のMASシェルスクリプト群とモジュール化後（mas_refactored.sh）の比較分析結果をまとめたものです。

## オリジナルスクリプト構成

### 1. mas.sh (1128行)
**主要機能:**
- MAS (Multi-Agent System) の中核となる管理スクリプト
- 13エージェント（メタマネージャー1体 + 3ユニット×4エージェント）の管理
- サブコマンド対応（init, start, send, status, stop, attach, list）

**コマンド構成:**
```bash
cmd_init()    # プロジェクト初期化
cmd_start()   # セッション開始
cmd_send()    # メッセージ送信
cmd_status()  # 状態表示
cmd_stop()    # セッション停止
cmd_attach()  # セッションアタッチ
cmd_list()    # エージェント一覧
```

**特徴:**
- プロジェクトモード対応（lib/project.shをロード）
- HTTPサーバー起動機能（ポート3000）
- ワークフロー指示書の管理
- 詳細なヘルプとオプション

### 2. send_message.sh (280行)
**主要機能:**
- 独立したメッセージ送信スクリプト
- 柔軟なターゲット指定（個別、ユニット、グループ）

**ターゲット種別:**
- 個別エージェント: 00-33の2桁番号
- ユニット: design, development, business
- グループ: managers, all
- 送信者除外機能（-s オプション）

**オプション:**
```bash
-p TARGET  # 送信先指定
-e         # Enterキー送信（実行）
-s AGENT   # 送信者指定（ループバック防止）
```

### 3. init_unit.sh (196行)
**主要機能:**
- OpenSpec対応のユニット初期化
- 13エージェントのディレクトリ構造作成
- README.mdとワークフロー指示書の配置

**初期化内容:**
- 各unitディレクトリ作成
- openspec init --tools claude実行
- 役割別README生成
- ワークフロー指示書コピー

## モジュール化後の構成

### mas_refactored.sh + libモジュール

#### モジュール構成:
1. **lib/tmux.sh** - tmux操作関数
2. **lib/agent.sh** - エージェント管理
3. **lib/message.sh** - メッセージルーティング
4. **lib/session.sh** - セッション管理
5. **lib/project.sh** - プロジェクト管理（オプション）

## 重要な相違点と問題

### 🔴 削除された機能

1. **プロジェクト初期化機能の劣化**
   - オリジナル: OpenSpec統合、ワークフロー指示書配置
   - リファクタ版: 基本的なディレクトリ作成のみ

2. **HTTPサーバー起動の不整合**
   - オリジナル: ポート3000で`send_message.sh`を使用
   - リファクタ版: ポート8765だが`send_message.sh`非対応

3. **send_message.shの統合問題**
   - オリジナル: 独立スクリプトとして高機能
   - リファクタ版: `mas_refactored.sh send`に統合されたが機能低下

### 🟡 変更された実装

1. **メッセージ送信コマンドの構文変更**
   ```bash
   # オリジナル
   ./send_message.sh -p design -e "メッセージ"

   # リファクタ版
   ./mas_refactored.sh send design "メッセージ" -e
   ```

2. **エージェント設定の管理**
   - オリジナル: mas.sh内にハードコード
   - リファクタ版: lib/agent.shに分離（良い変更）

3. **エラー処理の問題**
   - オリジナル: `set -e`でも動作
   - リファクタ版: 算術演算で`((count++))`がエラー（修正済み）

### 🟢 改善された点

1. **コードの構造化**
   - 機能別モジュール分離により保守性向上
   - 責任の明確化

2. **SESSION_NAME管理**
   - exportによる明示的なスコープ管理（修正後）

## APIとの不整合

### /runs エンドポイントの問題
```typescript
// api/routes/runs.ts
const command = `${MAS_ROOT}/mas.sh start --config "${configPath}" --no-attach`;
```

**問題点:**
1. `mas.sh`に`--config`オプションが存在しない
2. 動的なエージェント構成をサポートしていない
3. UUID形式のセッションIDを生成していない

### /message エンドポイントの修正
```typescript
// 元の実装（壊れている）
const command = `${MAS_ROOT}/send_message.sh -t "${target}" -m "${message}"`;

// 修正後
const command = `${MAS_ROOT}/mas_refactored.sh send "${target}" "${message}"`;
```

## 推奨される修正

### 1. 緊急修正
- [ ] `mas_refactored.sh`に`--config`オプション追加
- [ ] send_message.shの機能を完全に統合
- [ ] HTTPサーバーとの統合修正

### 2. 機能復元
- [ ] OpenSpec統合の復活
- [ ] ワークフロー指示書管理の実装
- [ ] プロジェクトモードの完全サポート

### 3. API整合性
- [ ] /runs エンドポイントの実装
- [ ] 動的エージェント構成のサポート
- [ ] セッションID管理の統一

## 結論

モジュール化により構造は改善されたが、以下の重要な機能が失われています：

1. **OpenSpec統合** - init_unit.shの高度な初期化機能
2. **柔軟なメッセージ送信** - send_message.shの豊富なオプション
3. **API互換性** - mas.shの設定ファイルサポート

これらの機能を復元することで、完全に機能するMASシステムを実現できます。