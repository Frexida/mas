{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    chromium
    nodejs_20
    glib
    gtk3
    xorg.libX11
    xorg.libXcomposite
    xorg.libXcursor
    xorg.libXdamage
    xorg.libXext
    xorg.libXfixes
    xorg.libXi
    xorg.libXrandr
    xorg.libXrender
    xorg.libxcb
    xorg.libX11
    cairo
    pango
    atk
    gdk-pixbuf
    alsa-lib
    freetype
    fontconfig
    dbus
    libstdcxx5
    gcc
  ];

  shellHook = ''
    export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath [
      pkgs.glib
      pkgs.gtk3
      pkgs.xorg.libX11
      pkgs.xorg.libXcomposite
      pkgs.xorg.libXcursor
      pkgs.xorg.libXdamage
      pkgs.xorg.libXext
      pkgs.xorg.libXfixes
      pkgs.xorg.libXi
      pkgs.xorg.libXrandr
      pkgs.xorg.libXrender
      pkgs.xorg.libxcb
      pkgs.cairo
      pkgs.pango
      pkgs.atk
      pkgs.gdk-pixbuf
      pkgs.alsaLib
      pkgs.freetype
      pkgs.fontconfig
      pkgs.dbus
      pkgs.libstdcxx5
      pkgs.gcc.cc.lib
    ]}:$LD_LIBRARY_PATH
    echo "Playwright dependencies loaded"
  '';
}