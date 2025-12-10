# mas-tmux - Multi-Unit Multi-Agent System

tmuxを用いて13体のAIエージェントを4つのユニットで管理・運用するマルチユニットシステムです。

## システム構成

### ユニット構成
システムは以下の4つのユニットで構成されています：

#### メタ管理
- **00: メタマネージャー** (Opus) - 全体統括、ユニット間調整、高レベル意思決定

#### デザインユニット
- **10: デザインマネージャー** (Opus) - デザイン戦略、品質管理、チーム統括
- **11: UIデザイナー** (Sonnet) - ユーザーインターフェース設計
- **12: UXデザイナー** (Sonnet) - ユーザー体験設計
- **13: ビジュアルデザイナー** (Sonnet) - ビジュアルデザイン、ブランディング

#### 開発ユニット
- **20: 開発マネージャー** (Opus) - 技術選定、アーキテクチャ設計、開発統括
- **21: フロントエンド開発** (Sonnet) - UI実装、クライアントサイド開発
- **22: バックエンド開発** (Sonnet) - サーバーサイド実装、API開発
- **23: DevOps** (Sonnet) - インフラ構築、CI/CD、デプロイメント

#### 経営・会計ユニット
- **30: 経営・会計マネージャー** (Opus) - 予算管理、戦略立案、ビジネス統括
- **31: 会計担当** (Sonnet) - コスト分析、予算計画、財務管理
- **32: 戦略担当** (Sonnet) - ビジネス戦略、市場分析、競合分析
- **33: 分析担当** (Sonnet) - データ分析、パフォーマンス評価、KPI管理

### tmuxウィンドウ構成
- **Window 0: managers** - マネージャー群（00, 10, 20, 30）
- **Window 1: design** - デザインユニット（10, 11, 12, 13）
- **Window 2: development** - 開発ユニット（20, 21, 22, 23）
- **Window 3: business** - 経営・会計ユニット（30, 31, 32, 33）

## インストール

### 前提条件
- tmux
- claude code (clauded)
- npm (openspecインストール用)

### セットアップ手順

```bash
# 1. リポジトリをクローン
git clone <repository_url>
cd mas-tmux

# 2. openspecをインストール（未インストールの場合）
npm install -g openspec

# 3. インストールスクリプトを実行
./install.sh

# 4. PATHを設定（.bashrcまたは.zshrcに追加）
export PATH="$HOME/.local/bin:$PATH"

# 5. 新しいターミナルを開くか、以下を実行
source ~/.bashrc  # または source ~/.zshrc
```

## 使い方

### 基本的な起動
```bash
# マルチユニットシステムを起動（初期化も自動実行）
mas

# Unit初期化をスキップして起動
mas --skip-init

# tmuxセッションにアタッチしない場合
mas --no-attach
```

### メッセージ送信

#### 個別エージェントへの送信
```bash
# 特定のエージェントに送信（2桁番号）
./send_message.sh -p 11 "UIデザインのタスク"
./send_message.sh -p 22 "APIの実装について"
```

#### ユニット単位での送信
```bash
# デザインユニット全体（10-13）
./send_message.sh -p design "デザインチームへの通知"

# 開発ユニット全体（20-23）
./send_message.sh -p development "開発チームへの通知"

# 経営・会計ユニット全体（30-33）
./send_message.sh -p business "経営チームへの通知"
```

#### グループ送信
```bash
# 全マネージャー（00, 10, 20, 30）
./send_message.sh -p managers "マネージャー会議を開始"

# 全エージェント（13体全て）
./send_message.sh -p all "全体連絡事項"
```

#### 実行オプション
```bash
# -e オプションでEnterキーも送信（コマンド実行）
./send_message.sh -p 00 -e "/openspec:proposal 新機能の開発"
```

### セッション管理
```bash
# セッション一覧を表示
tmux ls

# 既存セッションにアタッチ
tmux attach -t mas-tmux

# ウィンドウ切り替え（アタッチ中）
# Ctrl-b 0 : マネージャー群
# Ctrl-b 1 : デザインユニット
# Ctrl-b 2 : 開発ユニット
# Ctrl-b 3 : 経営・会計ユニット

# セッションを終了
tmux kill-session -t mas-tmux
```

## ディレクトリ構造
```
mas-tmux/
├── mas.sh              # メイン起動スクリプト（マルチユニット対応）
├── init_unit.sh        # 13エージェント初期化スクリプト
├── send_message.sh     # 柔軟なメッセージルーティング
├── install.sh          # インストールスクリプト
└── unit/               # 各エージェントの作業ディレクトリ
    ├── 00/             # メタマネージャー
    ├── 10-13/          # デザインユニット
    ├── 20-23/          # 開発ユニット
    └── 30-33/          # 経営・会計ユニット
```

## ワークフロー例

### 大規模プロジェクトの開始
```bash
# 1. メタマネージャーにプロジェクト概要を伝える
./send_message.sh -p 00 -e "/openspec:proposal ECサイトの構築"

# 2. 各マネージャーに詳細タスクを配分
./send_message.sh -p managers "各ユニットでタスクを分解してください"

# 3. デザインユニットでUI/UX設計
./send_message.sh -p design "ECサイトのデザイン案を作成"

# 4. 開発ユニットで実装
./send_message.sh -p development "デザインに基づいて実装開始"

# 5. 経営・会計ユニットでコスト分析
./send_message.sh -p business "プロジェクトの予算計画を策定"
```

## アンインストール
```bash
./install.sh --uninstall
```

## 技術要件
- tmux 2.0以上
- claude code (clauded)
- openspec
- bash 4.0以上
- npm（openspecインストール用）

## トラブルシューティング

### tmuxセッションが既に存在する場合
```bash
tmux kill-session -t mas-tmux
mas
```

### エージェントが応答しない場合
特定のウィンドウ・ペインを確認：
```bash
tmux attach -t mas-tmux
# Ctrl-b [window番号] でウィンドウ切り替え
# Ctrl-b q でペイン番号確認
```

### メッセージが届かない場合
```bash
# セッションの存在確認
tmux has-session -t mas-tmux

# エージェントの状態確認
tmux list-panes -t mas-tmux:managers
```

## ライセンス
[ライセンス情報を記載]