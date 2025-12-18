# Agent .bashrc - エージェント用bashrc設定
# MAS プロジェクトルートディレクトリを設定
MAS_ROOT="/home/mtdnot/dev/anag/mas"

# mas コマンドへのエイリアスを設定
alias mas="${MAS_ROOT}/mas"

# mas コマンドを PATH に追加
export PATH="${MAS_ROOT}:${PATH}"

# 環境変数を設定
export MAS_PROJECT_ROOT="${MAS_ROOT}"
