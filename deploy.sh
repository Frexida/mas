#!/bin/bash

# MAS-UI デプロイスクリプト
# このスクリプトはビルド済みのファイルを/var/wwwに配置します

set -e  # エラーが発生したら即座に停止

# カラー出力の設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# デプロイ先のディレクトリ
DEPLOY_DIR="/var/www/mas-ui"
BUILD_DIR="./dist"

echo -e "${GREEN}=== MAS-UI Deployment Script ===${NC}"
echo ""

# ビルドディレクトリの存在確認
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}Error: Build directory '$BUILD_DIR' not found.${NC}"
    echo "Please run 'npm run build' first."
    exit 1
fi

# デプロイディレクトリの作成（存在しない場合）
echo -e "${YELLOW}Creating deployment directory if not exists...${NC}"
sudo mkdir -p $DEPLOY_DIR

# 既存ファイルのバックアップ（オプション）
if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
    BACKUP_DIR="/var/www/mas-ui-backup-$(date +%Y%m%d-%H%M%S)"
    echo -e "${YELLOW}Backing up existing files to $BACKUP_DIR...${NC}"
    sudo cp -r $DEPLOY_DIR $BACKUP_DIR
fi

# ファイルのコピー
echo -e "${YELLOW}Deploying files to $DEPLOY_DIR...${NC}"
sudo rm -rf $DEPLOY_DIR/*
sudo cp -r $BUILD_DIR/* $DEPLOY_DIR/

# パーミッションの設定（NixOSのApache用）
echo -e "${YELLOW}Setting permissions...${NC}"
# NixOSのApacheはwwwrunユーザーで動作
sudo chown -R wwwrun:wwwrun $DEPLOY_DIR
sudo chmod -R 755 $DEPLOY_DIR

# デプロイ完了
echo ""
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo -e "Your application has been deployed to: ${GREEN}$DEPLOY_DIR${NC}"
echo ""
echo "Next steps:"
echo "1. Configure Apache to serve from $DEPLOY_DIR (see apache-mas-ui.conf)"
echo "2. Access your application at: http://localhost/mas-ui/"
echo "   or http://192.168.11.XXX/mas-ui/ from your LAN"
echo ""
echo -e "${YELLOW}Note: Make sure Apache is configured properly.${NC}"
echo "For NixOS: Use the provided nix-apache-config.nix or edit /etc/httpd/httpd.conf directly."