# Unit 0 - Manager

## 概要
このディレクトリは mas-tmux システムの Unit 0 として、Managerの役割を担当します。

## 役割
### Manager (マネージャー)
- タスクの受領と分析
- 各ワーカーへのタスク配分
- ワーカーからの提案の統合
- 最終的な承認プロセスの管理

**使用モデル**: Claude Opus

## 使用方法
```bash
# このディレクトリに移動
cd unit/0

# Claude Codeでタスクを実行
clauded /openspec:proposal "タスクの内容"
```

## OpenSpec設定
このディレクトリはOpenSpecで管理されています。
- ツール: Claude
- 仕様とコンテキストは `.openspec/` ディレクトリに保存されます

## 関連ファイル
- `../../setup_mas_tmux.sh` - tmuxセッションのセットアップ
- `../../send_message.sh` - ペイン間のメッセージ送信
