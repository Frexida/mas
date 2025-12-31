#!/usr/bin/env bash
# mas-communication-rules.sh - MASエージェント間通信ルール

# 通信ルールマトリックス
# 1 = 通信許可, 0 = 通信禁止
declare -A COMM_MATRIX

# ルールの初期化
init_communication_rules() {
    # FROM: 00 (メタマネージャー)
    COMM_MATRIX["00-00"]=0  # 自分自身
    COMM_MATRIX["00-10"]=1  # → Design Manager OK
    COMM_MATRIX["00-11"]=0  # → UI Designer NG
    COMM_MATRIX["00-12"]=0  # → UX Designer NG
    COMM_MATRIX["00-13"]=0  # → Visual Designer NG
    COMM_MATRIX["00-20"]=1  # → Dev Manager OK
    COMM_MATRIX["00-21"]=0  # → Frontend Dev NG
    COMM_MATRIX["00-22"]=0  # → Backend Dev NG
    COMM_MATRIX["00-23"]=0  # → DevOps NG
    COMM_MATRIX["00-30"]=1  # → Business Manager OK
    COMM_MATRIX["00-31"]=0  # → Accounting NG
    COMM_MATRIX["00-32"]=0  # → Strategy NG
    COMM_MATRIX["00-33"]=0  # → Analysis NG

    # FROM: 10 (Design Manager)
    COMM_MATRIX["10-00"]=1  # → Meta Manager OK
    COMM_MATRIX["10-10"]=0  # 自分自身
    COMM_MATRIX["10-11"]=1  # → UI Designer OK (同ユニット)
    COMM_MATRIX["10-12"]=1  # → UX Designer OK (同ユニット)
    COMM_MATRIX["10-13"]=1  # → Visual Designer OK (同ユニット)
    COMM_MATRIX["10-20"]=0  # → Dev Manager NG (横の連携禁止)
    COMM_MATRIX["10-21"]=0  # → Frontend Dev NG
    COMM_MATRIX["10-22"]=0  # → Backend Dev NG
    COMM_MATRIX["10-23"]=0  # → DevOps NG
    COMM_MATRIX["10-30"]=0  # → Business Manager NG (横の連携禁止)
    COMM_MATRIX["10-31"]=0  # → Accounting NG
    COMM_MATRIX["10-32"]=0  # → Strategy NG
    COMM_MATRIX["10-33"]=0  # → Analysis NG

    # FROM: 11 (UI Designer)
    COMM_MATRIX["11-00"]=0  # → Meta Manager NG (階層飛ばし禁止)
    COMM_MATRIX["11-10"]=1  # → Design Manager OK (上司)
    COMM_MATRIX["11-11"]=0  # 自分自身
    COMM_MATRIX["11-12"]=1  # → UX Designer OK (同ユニット)
    COMM_MATRIX["11-13"]=1  # → Visual Designer OK (同ユニット)
    COMM_MATRIX["11-20"]=0  # → Dev Manager NG
    COMM_MATRIX["11-21"]=0  # → Frontend Dev NG (他ユニット)
    COMM_MATRIX["11-22"]=0  # → Backend Dev NG
    COMM_MATRIX["11-23"]=0  # → DevOps NG
    COMM_MATRIX["11-30"]=0  # → Business Manager NG
    COMM_MATRIX["11-31"]=0  # → Accounting NG
    COMM_MATRIX["11-32"]=0  # → Strategy NG
    COMM_MATRIX["11-33"]=0  # → Analysis NG

    # FROM: 12 (UX Designer)
    COMM_MATRIX["12-00"]=0  # → Meta Manager NG
    COMM_MATRIX["12-10"]=1  # → Design Manager OK
    COMM_MATRIX["12-11"]=1  # → UI Designer OK (同ユニット)
    COMM_MATRIX["12-12"]=0  # 自分自身
    COMM_MATRIX["12-13"]=1  # → Visual Designer OK (同ユニット)
    COMM_MATRIX["12-20"]=0  # → Dev Manager NG
    COMM_MATRIX["12-21"]=0  # → Frontend Dev NG
    COMM_MATRIX["12-22"]=0  # → Backend Dev NG
    COMM_MATRIX["12-23"]=0  # → DevOps NG
    COMM_MATRIX["12-30"]=0  # → Business Manager NG
    COMM_MATRIX["12-31"]=0  # → Accounting NG
    COMM_MATRIX["12-32"]=0  # → Strategy NG
    COMM_MATRIX["12-33"]=0  # → Analysis NG

    # FROM: 13 (Visual Designer)
    COMM_MATRIX["13-00"]=0  # → Meta Manager NG
    COMM_MATRIX["13-10"]=1  # → Design Manager OK
    COMM_MATRIX["13-11"]=1  # → UI Designer OK (同ユニット)
    COMM_MATRIX["13-12"]=1  # → UX Designer OK (同ユニット)
    COMM_MATRIX["13-13"]=0  # 自分自身
    COMM_MATRIX["13-20"]=0  # → Dev Manager NG
    COMM_MATRIX["13-21"]=0  # → Frontend Dev NG
    COMM_MATRIX["13-22"]=0  # → Backend Dev NG
    COMM_MATRIX["13-23"]=0  # → DevOps NG
    COMM_MATRIX["13-30"]=0  # → Business Manager NG
    COMM_MATRIX["13-31"]=0  # → Accounting NG
    COMM_MATRIX["13-32"]=0  # → Strategy NG
    COMM_MATRIX["13-33"]=0  # → Analysis NG

    # FROM: 20 (Dev Manager)
    COMM_MATRIX["20-00"]=1  # → Meta Manager OK
    COMM_MATRIX["20-10"]=0  # → Design Manager NG (横の連携禁止)
    COMM_MATRIX["20-11"]=0  # → UI Designer NG
    COMM_MATRIX["20-12"]=0  # → UX Designer NG
    COMM_MATRIX["20-13"]=0  # → Visual Designer NG
    COMM_MATRIX["20-20"]=0  # 自分自身
    COMM_MATRIX["20-21"]=1  # → Frontend Dev OK (同ユニット)
    COMM_MATRIX["20-22"]=1  # → Backend Dev OK (同ユニット)
    COMM_MATRIX["20-23"]=1  # → DevOps OK (同ユニット)
    COMM_MATRIX["20-30"]=0  # → Business Manager NG (横の連携禁止)
    COMM_MATRIX["20-31"]=0  # → Accounting NG
    COMM_MATRIX["20-32"]=0  # → Strategy NG
    COMM_MATRIX["20-33"]=0  # → Analysis NG

    # FROM: 21 (Frontend Dev)
    COMM_MATRIX["21-00"]=0  # → Meta Manager NG
    COMM_MATRIX["21-10"]=0  # → Design Manager NG
    COMM_MATRIX["21-11"]=0  # → UI Designer NG (他ユニット)
    COMM_MATRIX["21-12"]=0  # → UX Designer NG
    COMM_MATRIX["21-13"]=0  # → Visual Designer NG
    COMM_MATRIX["21-20"]=1  # → Dev Manager OK (上司)
    COMM_MATRIX["21-21"]=0  # 自分自身
    COMM_MATRIX["21-22"]=1  # → Backend Dev OK (同ユニット)
    COMM_MATRIX["21-23"]=1  # → DevOps OK (同ユニット)
    COMM_MATRIX["21-30"]=0  # → Business Manager NG
    COMM_MATRIX["21-31"]=0  # → Accounting NG
    COMM_MATRIX["21-32"]=0  # → Strategy NG
    COMM_MATRIX["21-33"]=0  # → Analysis NG

    # FROM: 22 (Backend Dev)
    COMM_MATRIX["22-00"]=0  # → Meta Manager NG
    COMM_MATRIX["22-10"]=0  # → Design Manager NG
    COMM_MATRIX["22-11"]=0  # → UI Designer NG
    COMM_MATRIX["22-12"]=0  # → UX Designer NG
    COMM_MATRIX["22-13"]=0  # → Visual Designer NG
    COMM_MATRIX["22-20"]=1  # → Dev Manager OK
    COMM_MATRIX["22-21"]=1  # → Frontend Dev OK (同ユニット)
    COMM_MATRIX["22-22"]=0  # 自分自身
    COMM_MATRIX["22-23"]=1  # → DevOps OK (同ユニット)
    COMM_MATRIX["22-30"]=0  # → Business Manager NG
    COMM_MATRIX["22-31"]=0  # → Accounting NG
    COMM_MATRIX["22-32"]=0  # → Strategy NG
    COMM_MATRIX["22-33"]=0  # → Analysis NG

    # FROM: 23 (DevOps)
    COMM_MATRIX["23-00"]=0  # → Meta Manager NG
    COMM_MATRIX["23-10"]=0  # → Design Manager NG
    COMM_MATRIX["23-11"]=0  # → UI Designer NG
    COMM_MATRIX["23-12"]=0  # → UX Designer NG
    COMM_MATRIX["23-13"]=0  # → Visual Designer NG
    COMM_MATRIX["23-20"]=1  # → Dev Manager OK
    COMM_MATRIX["23-21"]=1  # → Frontend Dev OK (同ユニット)
    COMM_MATRIX["23-22"]=1  # → Backend Dev OK (同ユニット)
    COMM_MATRIX["23-23"]=0  # 自分自身
    COMM_MATRIX["23-30"]=0  # → Business Manager NG
    COMM_MATRIX["23-31"]=0  # → Accounting NG
    COMM_MATRIX["23-32"]=0  # → Strategy NG
    COMM_MATRIX["23-33"]=0  # → Analysis NG

    # FROM: 30 (Business Manager)
    COMM_MATRIX["30-00"]=1  # → Meta Manager OK
    COMM_MATRIX["30-10"]=0  # → Design Manager NG (横の連携禁止)
    COMM_MATRIX["30-11"]=0  # → UI Designer NG
    COMM_MATRIX["30-12"]=0  # → UX Designer NG
    COMM_MATRIX["30-13"]=0  # → Visual Designer NG
    COMM_MATRIX["30-20"]=0  # → Dev Manager NG (横の連携禁止)
    COMM_MATRIX["30-21"]=0  # → Frontend Dev NG
    COMM_MATRIX["30-22"]=0  # → Backend Dev NG
    COMM_MATRIX["30-23"]=0  # → DevOps NG
    COMM_MATRIX["30-30"]=0  # 自分自身
    COMM_MATRIX["30-31"]=1  # → Accounting OK (同ユニット)
    COMM_MATRIX["30-32"]=1  # → Strategy OK (同ユニット)
    COMM_MATRIX["30-33"]=1  # → Analysis OK (同ユニット)

    # FROM: 31 (Accounting)
    COMM_MATRIX["31-00"]=0  # → Meta Manager NG
    COMM_MATRIX["31-10"]=0  # → Design Manager NG
    COMM_MATRIX["31-11"]=0  # → UI Designer NG
    COMM_MATRIX["31-12"]=0  # → UX Designer NG
    COMM_MATRIX["31-13"]=0  # → Visual Designer NG
    COMM_MATRIX["31-20"]=0  # → Dev Manager NG
    COMM_MATRIX["31-21"]=0  # → Frontend Dev NG
    COMM_MATRIX["31-22"]=0  # → Backend Dev NG
    COMM_MATRIX["31-23"]=0  # → DevOps NG
    COMM_MATRIX["31-30"]=1  # → Business Manager OK (上司)
    COMM_MATRIX["31-31"]=0  # 自分自身
    COMM_MATRIX["31-32"]=1  # → Strategy OK (同ユニット)
    COMM_MATRIX["31-33"]=1  # → Analysis OK (同ユニット)

    # FROM: 32 (Strategy)
    COMM_MATRIX["32-00"]=0  # → Meta Manager NG
    COMM_MATRIX["32-10"]=0  # → Design Manager NG
    COMM_MATRIX["32-11"]=0  # → UI Designer NG
    COMM_MATRIX["32-12"]=0  # → UX Designer NG
    COMM_MATRIX["32-13"]=0  # → Visual Designer NG
    COMM_MATRIX["32-20"]=0  # → Dev Manager NG
    COMM_MATRIX["32-21"]=0  # → Frontend Dev NG
    COMM_MATRIX["32-22"]=0  # → Backend Dev NG
    COMM_MATRIX["32-23"]=0  # → DevOps NG
    COMM_MATRIX["32-30"]=1  # → Business Manager OK
    COMM_MATRIX["32-31"]=1  # → Accounting OK (同ユニット)
    COMM_MATRIX["32-32"]=0  # 自分自身
    COMM_MATRIX["32-33"]=1  # → Analysis OK (同ユニット)

    # FROM: 33 (Analysis)
    COMM_MATRIX["33-00"]=0  # → Meta Manager NG
    COMM_MATRIX["33-10"]=0  # → Design Manager NG
    COMM_MATRIX["33-11"]=0  # → UI Designer NG
    COMM_MATRIX["33-12"]=0  # → UX Designer NG
    COMM_MATRIX["33-13"]=0  # → Visual Designer NG
    COMM_MATRIX["33-20"]=0  # → Dev Manager NG
    COMM_MATRIX["33-21"]=0  # → Frontend Dev NG
    COMM_MATRIX["33-22"]=0  # → Backend Dev NG
    COMM_MATRIX["33-23"]=0  # → DevOps NG
    COMM_MATRIX["33-30"]=1  # → Business Manager OK
    COMM_MATRIX["33-31"]=1  # → Accounting OK (同ユニット)
    COMM_MATRIX["33-32"]=1  # → Strategy OK (同ユニット)
    COMM_MATRIX["33-33"]=0  # 自分自身
}

# 通信が許可されているかチェック
# 引数: $1=送信元ID, $2=送信先ID
# 戻り値: 0=許可, 1=禁止
is_communication_allowed() {
    local from="$1"
    local to="$2"
    local key="${from}-${to}"

    # ルールが初期化されていない場合は初期化
    if [ ${#COMM_MATRIX[@]} -eq 0 ]; then
        init_communication_rules
    fi

    # ルールが存在しない場合は禁止
    if [ -z "${COMM_MATRIX[$key]}" ]; then
        return 1
    fi

    # 1なら許可、0なら禁止
    if [ "${COMM_MATRIX[$key]}" = "1" ]; then
        return 0
    else
        return 1
    fi
}

# エージェント名を取得
get_agent_name() {
    local id="$1"
    # 数字のみを返す
    echo "$id"
}

# 通信違反時のエラーメッセージ
print_communication_error() {
    local from="$1"
    local to="$2"

    echo ""
    echo "🚫 通信ルール違反検出！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "送信元: Agent $from"
    echo "送信先: Agent $to"
    echo ""
    echo "❌ この通信は禁止されています"
    echo ""

    # 具体的な理由を表示
    if [ "$from" = "$to" ]; then
        echo "理由: 自分自身への送信は無効です"
    elif [[ "$from" =~ ^(11|12|13|21|22|23|31|32|33)$ ]] && [ "$to" = "00" ]; then
        echo "理由: ワーカーからメタマネージャーへの直接通信は禁止"
        echo "対処: まず自分のマネージャーに報告してください"
    elif [[ "$from" =~ ^(10|20|30)$ ]] && [[ "$to" =~ ^(10|20|30)$ ]] && [ "$from" != "$to" ]; then
        echo "理由: ユニットマネージャー間の横通信は禁止"
        echo "対処: メタマネージャー(00)を経由してください"
    elif [[ "$from" =~ ^(11|12|13)$ ]] && [[ "$to" =~ ^(21|22|23|31|32|33)$ ]]; then
        echo "理由: 異なるユニット間のワーカー通信は禁止"
        echo "対処: 自分のマネージャー経由でメタマネージャーに依頼してください"
    elif [[ "$from" =~ ^(21|22|23)$ ]] && [[ "$to" =~ ^(11|12|13|31|32|33)$ ]]; then
        echo "理由: 異なるユニット間のワーカー通信は禁止"
        echo "対処: 自分のマネージャー経由でメタマネージャーに依頼してください"
    elif [[ "$from" =~ ^(31|32|33)$ ]] && [[ "$to" =~ ^(11|12|13|21|22|23)$ ]]; then
        echo "理由: 異なるユニット間のワーカー通信は禁止"
        echo "対処: 自分のマネージャー経由でメタマネージャーに依頼してください"
    else
        echo "理由: 階層構造に違反する通信です"
    fi

    echo ""
    echo "📋 許可されている送信先:"
    local allowed_targets=""
    for target in 00 10 11 12 13 20 21 22 23 30 31 32 33; do
        if is_communication_allowed "$from" "$target"; then
            allowed_targets="$allowed_targets $target"
        fi
    done

    if [ -n "$allowed_targets" ]; then
        echo "$allowed_targets"
    else
        echo "  なし"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}