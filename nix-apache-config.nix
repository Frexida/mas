# NixOS Apache configuration for MAS-UI
# この設定を /etc/nixos/configuration.nix に追加するか、
# インクルードして使用できます

{ config, lib, pkgs, ... }:

{
  # Apache (httpd) サービスの設定
  services.httpd = {
    enable = true;

    # 既存のVirtualHostに追加する場合
    virtualHosts."localhost" = {
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

            # キャッシュ設定
            <IfModule mod_expires.c>
                ExpiresActive On
                ExpiresByType application/javascript "access plus 1 year"
                ExpiresByType text/css "access plus 1 year"
                ExpiresByType image/png "access plus 1 year"
                ExpiresByType image/jpeg "access plus 1 year"
                ExpiresByType image/svg+xml "access plus 1 year"
                ExpiresByType font/woff "access plus 1 year"
                ExpiresByType font/woff2 "access plus 1 year"
            </IfModule>

            # セキュリティヘッダー
            <IfModule mod_headers.c>
                Header set X-Frame-Options "SAMEORIGIN"
                Header set X-Content-Type-Options "nosniff"
                Header set X-XSS-Protection "1; mode=block"
            </IfModule>
        </Directory>
      '';
    };

    # または、独自のVirtualHostとして設定
    # virtualHosts."mas-ui.local" = {
    #   documentRoot = "/var/www/mas-ui";
    #   serverAliases = [ "mas-ui.localhost" ];
    #   extraConfig = ''
    #     <Directory "/var/www/mas-ui">
    #       Options FollowSymLinks
    #       AllowOverride None
    #       Require ip 192.168.11.0/24
    #       Require ip 127.0.0.1
    #
    #       # SPAのためのリライトルール
    #       <IfModule mod_rewrite.c>
    #         RewriteEngine On
    #         RewriteCond %{REQUEST_FILENAME} !-f
    #         RewriteCond %{REQUEST_FILENAME} !-d
    #         RewriteRule ^ /index.html [L]
    #       </IfModule>
    #     </Directory>
    #   '';
    # };
  };
}