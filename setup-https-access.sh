#!/bin/bash

# Setup HTTPS access for mas-api documentation
# Run with sudo

set -e

echo "Setting up mas-api for HTTPS access at mtdnot.dev"
echo "================================================="

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
   echo "Please run with sudo"
   exit 1
fi

# Create symlink in /var/www
echo "Creating symlink..."
if [ -L "/var/www/mas-api" ]; then
    echo "  Removing existing symlink"
    rm /var/www/mas-api
fi

ln -s /var/www/mas/api-docs /var/www/mas-api
echo "  Created: /var/www/mas-api -> /var/www/mas/api-docs"

# Fix permissions if needed
echo "Fixing permissions..."
chmod 644 /var/www/mas/api-docs/*.html 2>/dev/null || true
chmod 644 /var/www/mas/api-docs/*.yaml 2>/dev/null || true
echo "  Permissions fixed"

# List the files
echo ""
echo "Files available:"
ls -la /var/www/mas-api/

echo ""
echo "Setup complete! You can now access:"
echo "  https://mtdnot.dev/mas-api/landing.html"
echo "  https://mtdnot.dev/mas-api/index.html  (Swagger UI)"
echo "  https://mtdnot.dev/mas-api/redoc.html  (ReDoc)"
echo "  https://mtdnot.dev/mas-api/openapi.yaml"

# Test local access
echo ""
echo "Testing local access..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost/mas-api/landing.html | grep -q "200"; then
    echo "  ✓ Local access working"
else
    echo "  ✗ Local access failed - check Apache configuration"
fi