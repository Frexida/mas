#!/bin/bash

# MAS API Documentation deployment script for Apache

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SOURCE_DIR="/home/mtdnot/dev/anag/mas"
TARGET_DIR="/var/www/mas"
API_DOCS_DIR="$TARGET_DIR/api-docs"

echo -e "${GREEN}MAS API Documentation Deployment Script${NC}"
echo "========================================="

# Check if running with sudo
if [ "$EUID" -eq 0 ]; then
   echo -e "${YELLOW}Running as root${NC}"
else
   echo -e "${RED}This script needs sudo privileges. Please run with sudo.${NC}"
   exit 1
fi

# Create target directory
echo -e "\n${GREEN}1. Creating target directory...${NC}"
mkdir -p "$API_DOCS_DIR"
echo "   Created: $API_DOCS_DIR"

# Copy files
echo -e "\n${GREEN}2. Copying files...${NC}"
cp "$SOURCE_DIR/openapi.yaml" "$API_DOCS_DIR/"
echo "   ✓ openapi.yaml"

cp "$SOURCE_DIR/api-docs.html" "$API_DOCS_DIR/index.html"
echo "   ✓ api-docs.html → index.html (Swagger UI)"

cp "$SOURCE_DIR/api-redoc.html" "$API_DOCS_DIR/redoc.html"
echo "   ✓ api-redoc.html → redoc.html"

# Create a simple landing page
cat > "$API_DOCS_DIR/landing.html" << 'EOF'
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MAS API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #007bff;
            padding-bottom: 10px;
        }
        .links {
            margin-top: 30px;
        }
        .link-card {
            display: block;
            padding: 20px;
            margin: 15px 0;
            background: #f8f9fa;
            border-left: 4px solid #007bff;
            text-decoration: none;
            color: #333;
            transition: all 0.3s;
        }
        .link-card:hover {
            background: #e9ecef;
            transform: translateX(5px);
        }
        .link-card h3 {
            margin: 0 0 10px 0;
            color: #007bff;
        }
        .link-card p {
            margin: 0;
            color: #666;
        }
        .info {
            margin-top: 30px;
            padding: 20px;
            background: #e7f3ff;
            border-radius: 5px;
        }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 MAS API Documentation</h1>
        <p>MAS (Multi-Agent System) APIのドキュメントページです。</p>

        <div class="links">
            <a href="index.html" class="link-card">
                <h3>📘 Swagger UI</h3>
                <p>インタラクティブなAPIドキュメント。実際にAPIを試すことができます。</p>
            </a>

            <a href="redoc.html" class="link-card">
                <h3>📗 ReDoc</h3>
                <p>読みやすく整理されたAPIリファレンスドキュメント。</p>
            </a>

            <a href="openapi.yaml" class="link-card">
                <h3>📄 OpenAPI Specification</h3>
                <p>OpenAPI 3.0.3形式の仕様書ファイル（YAML）</p>
            </a>
        </div>

        <div class="info">
            <h3>主要エンドポイント</h3>
            <ul>
                <li><code>POST /runs</code> - MASセッションを開始</li>
                <li><code>POST /message</code> - tmuxセッションにメッセージを送信</li>
            </ul>

            <h3>APIサーバー</h3>
            <p>デフォルト: <code>http://localhost:8765</code></p>
        </div>
    </div>
</body>
</html>
EOF
echo "   ✓ Created landing page"

# Set permissions
echo -e "\n${GREEN}3. Setting permissions...${NC}"
chown -R www-data:www-data "$TARGET_DIR"
chmod -R 755 "$TARGET_DIR"
echo "   ✓ Owner: www-data:www-data"
echo "   ✓ Permissions: 755"

# Create Apache config (optional)
echo -e "\n${GREEN}4. Apache configuration...${NC}"
APACHE_CONF="/etc/apache2/sites-available/mas-api.conf"

if [ ! -f "$APACHE_CONF" ]; then
    cat > "$APACHE_CONF" << 'EOF'
# MAS API Documentation Site
Alias /mas-api /var/www/mas/api-docs

<Directory /var/www/mas/api-docs>
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted

    # YAML files MIME type
    <FilesMatch "\.yaml$">
        ForceType text/yaml
    </FilesMatch>

    # Default to landing page
    DirectoryIndex landing.html index.html
</Directory>
EOF
    echo "   ✓ Created Apache config: $APACHE_CONF"

    # Enable the configuration
    a2ensite mas-api.conf 2>/dev/null || true

    # Reload Apache
    systemctl reload apache2
    echo "   ✓ Apache reloaded"
else
    echo "   ℹ Apache config already exists"
fi

# Summary
echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "\nAccess the API documentation at:"
echo -e "  ${YELLOW}http://$(hostname -I | awk '{print $1}')/mas-api/${NC}"
echo -e "  ${YELLOW}http://localhost/mas-api/${NC}"
echo -e "\nAvailable pages:"
echo -e "  • Landing page: /mas-api/"
echo -e "  • Swagger UI:   /mas-api/index.html"
echo -e "  • ReDoc:        /mas-api/redoc.html"
echo -e "  • OpenAPI spec: /mas-api/openapi.yaml"
