# Unit 2 - Design Worker

## 概要
このディレクトリは mas-tmux システムの Unit 2 として、Design Workerの役割を担当します。

## 役割
### Design Worker (デザインワーカー)
- ユーザビリティ観点からの提案
- インターフェースデザインの検討
- ユーザー体験の最適化

**使用モデル**: Claude Sonnet

## 使用方法
```bash
# このディレクトリに移動
cd unit/2

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
