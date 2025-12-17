# MAS-UI デプロイメントガイド (NixOS + Apache)

このドキュメントでは、MAS-UIを `/var/www` に配置してApacheで配信する手順を説明します。

## 前提条件

- Node.js と npm がインストールされていること
- sudo権限があること
- Apache (httpd) がNixOSで設定済み

## デプロイ手順

### 1. アプリケーションのビルド

```bash
# プロジェクトディレクトリに移動
cd /home/mtdnot/dev/anag/mas-ui

# 依存関係のインストール（初回のみ）
npm install

# プロダクション用ビルド
npm run build:prod
```

### 2. /var/www へのデプロイ

```bash
# デプロイスクリプトの実行（sudoが必要）
npm run deploy

# または直接スクリプトを実行
sudo ./deploy.sh
```

このスクリプトは以下を実行します：
- `/var/www/mas-ui` ディレクトリの作成
- 既存ファイルのバックアップ
- ビルド済みファイルのコピー
- 適切なパーミッションの設定

### 3. Apache の設定

NixOSでApacheを使用している場合、以下の2つの方法があります：

#### 方法1: 手動で Apache 設定を追加（推奨・即座に反映）

既存のApache設定ファイルを編集します：

```bash
# 設定ファイルのバックアップ
sudo cp /etc/httpd/httpd.conf /etc/httpd/httpd.conf.backup

# Apache設定ファイルを編集
sudo nano /etc/httpd/httpd.conf
```

適切なVirtualHost内（例：`localhost` または `mtdnot.dev`）に以下を追加：

```apache
# MAS-UI用のAlias設定
Alias "/mas-ui" "/var/www/mas-ui"

<Directory "/var/www/mas-ui">
    Options FollowSymLinks
    AllowOverride None

    # LANからのアクセスを許可
    Require ip 192.168.11.0/24
    Require ip 127.0.0.1
    Require ip ::1

    # SPAのためのリライトルール
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /mas-ui/
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /mas-ui/index.html [L]
    </IfModule>
</Directory>
```

Apacheを再起動：

```bash
# 設定ファイルの構文チェック
sudo apachectl configtest

# Apacheを再起動
sudo systemctl restart httpd
```

#### 方法2: NixOS設定で管理（永続的）

`/etc/nixos/configuration.nix` を編集して、Apache設定を追加：

```nix
{ config, lib, pkgs, ... }:

{
  # ... 既存の設定 ...

  services.httpd = {
    enable = true;

    virtualHosts."localhost" = {
      documentRoot = "/var/www";

      extraConfig = ''
        # MAS-UI用のAlias設定
        Alias "/mas-ui" "/var/www/mas-ui"

        <Directory "/var/www/mas-ui">
            Options FollowSymLinks
            AllowOverride None

            # LANからのアクセスを許可
            Require ip 192.168.11.0/24
            Require ip 127.0.0.1
            Require ip ::1

            # SPAのためのリライトルール
            <IfModule mod_rewrite.c>
                RewriteEngine On
                RewriteBase /mas-ui/
                RewriteCond %{REQUEST_FILENAME} !-f
                RewriteCond %{REQUEST_FILENAME} !-d
                RewriteRule . /mas-ui/index.html [L]
            </IfModule>
        </Directory>
      '';
    };
  };

  # ... 他の設定 ...
}
```

設定を適用：

```bash
sudo nixos-rebuild switch
```

### 4. アクセス確認

ブラウザで以下にアクセス：
```
http://localhost/mas-ui/
http://192.168.11.XXX/mas-ui/  # あなたのサーバーのLAN IPアドレス
```

## パーミッションの設定

NixOSのApacheはユーザー`wwwrun`で動作するため：

```bash
# パーミッションの設定
sudo chown -R wwwrun:wwwrun /var/www/mas-ui
sudo chmod -R 755 /var/www/mas-ui
```

## ベースパスの変更

アプリケーションのパスを変更したい場合（例：`/mas-ui/` から `/` へ）：

1. `vite.config.ts` の `base` を変更
2. Apache設定の `Alias` と `RewriteBase` を調整
3. 再ビルドして再デプロイ

## トラブルシューティング

### 404エラーが出る場合
- Apache設定が正しく読み込まれているか確認：`sudo apachectl configtest`
- ファイルのパーミッションを確認：`ls -la /var/www/mas-ui/`
- Apacheのエラーログを確認：`sudo tail -f /var/log/httpd/error.log`

### 白い画面が表示される場合
- ブラウザのコンソールでエラーを確認
- ベースパスが正しく設定されているか確認
- Apache のアクセスログを確認：`sudo tail -f /var/log/httpd/access.log`

### パーミッションエラー
```bash
sudo chown -R wwwrun:wwwrun /var/www/mas-ui
sudo chmod -R 755 /var/www/mas-ui
```

### mod_rewrite が動作しない場合
NixOSのApache設定でmod_rewriteが有効になっていることを確認：
```bash
httpd -M | grep rewrite
```

## 更新のデプロイ

アプリケーションを更新する場合：

```bash
# コードの更新
git pull

# 再ビルドとデプロイ
npm run deploy
```

## セキュリティに関する注意

- 本番環境では必ずHTTPSを使用してください
- APIエンドポイントは適切に保護してください
- 定期的にセキュリティアップデートを適用してください
- LANアクセスのみに制限されていることを確認してください

## 参考ファイル

- `apache-mas-ui.conf`: 手動適用用のApache設定
- `nix-apache-config.nix`: NixOS設定用のサンプル
- `deploy.sh`: デプロイ自動化スクリプト