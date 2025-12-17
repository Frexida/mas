#!/bin/bash

# Fix permissions for MAS API documentation files

echo "Fixing permissions for /var/www/mas/api-docs/"
echo "Please run this script with sudo"

# Fix file permissions
chmod 644 /var/www/mas/api-docs/index.html
chmod 644 /var/www/mas/api-docs/redoc.html
chmod 644 /var/www/mas/api-docs/api-docs.html
chmod 644 /var/www/mas/api-docs/api-redoc.html
chmod 644 /var/www/mas/api-docs/landing.html
chmod 644 /var/www/mas/api-docs/openapi.yaml

# Change ownership to www-data
chown -R www-data:www-data /var/www/mas/

# Set directory permissions
chmod 755 /var/www/mas/
chmod 755 /var/www/mas/api-docs/

echo "Permissions fixed!"
ls -la /var/www/mas/api-docs/