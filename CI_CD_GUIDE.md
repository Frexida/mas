# MAS CI/CD ガイド

## 概要
このドキュメントは、MAS（Multi-Agent System）のHTTPサーバーとメッセージングシステムをCI/CDパイプラインに統合するためのガイドです。

## サポートするCI/CDプラットフォーム

### 1. AWS CodeBuild
**設定ファイル**: `buildspec.yml`

#### セットアップ手順

1. **CodeBuildプロジェクトの作成**
```bash
aws codebuild create-project \
  --name mas-tmux-build \
  --source type=GITHUB,location=https://github.com/your-org/mas-tmux \
  --artifacts type=S3,location=your-bucket/artifacts \
  --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:5.0,computeType=BUILD_GENERAL1_SMALL \
  --service-role arn:aws:iam::YOUR_ACCOUNT:role/codebuild-role
```

2. **環境変数の設定**
```bash
aws codebuild update-project --name mas-tmux-build \
  --environment-variables-override \
    name=MAS_HTTP_PORT,value=8765,type=PLAINTEXT \
    name=NODE_ENV,value=test,type=PLAINTEXT
```

3. **ビルドの実行**
```bash
aws codebuild start-build --project-name mas-tmux-build
```

#### buildspec.ymlの主要機能
- Node.js 18のインストール
- tmux環境のセットアップ
- HTTPサーバーの起動とテスト
- パフォーマンステスト（100ms以下の基準）
- テスト結果のアーティファクト化

### 2. GitHub Actions
**設定ファイル**: `.github/workflows/ci.yml`

#### セットアップ手順

1. **リポジトリにワークフローを追加**
   - `.github/workflows/ci.yml`をコミット
   - GitHub Actionsが自動的に有効化

2. **必要なSecretsを設定**
   - `Settings` > `Secrets` > `Actions`で以下を追加：
     - `AWS_ACCESS_KEY_ID`（デプロイ用）
     - `AWS_SECRET_ACCESS_KEY`（デプロイ用）

3. **ブランチ保護ルールの設定**
```yaml
# Settings > Branches > Add rule
- Branch name pattern: main
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Include administrators
```

#### ワークフローの特徴
- マトリックステスト（並列実行）
- PR自動コメント機能
- セキュリティスキャン
- 定期実行（毎日午前3時UTC）

### 3. Jenkins
**設定ファイル**: `Jenkinsfile`

```groovy
pipeline {
    agent any

    environment {
        MAS_HTTP_PORT = '8765'
        NODE_VERSION = '18'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup') {
            steps {
                sh '''
                    # Node.jsセットアップ
                    nvm install ${NODE_VERSION}
                    nvm use ${NODE_VERSION}

                    # 依存関係インストール
                    sudo apt-get update
                    sudo apt-get install -y tmux curl bc jq
                '''
            }
        }

        stage('Test') {
            steps {
                sh '''
                    # CI用テストランナー実行
                    CI=true bash tests/ci_test_runner.sh
                '''
            }
        }

        stage('Report') {
            steps {
                junit 'tests/results/junit.xml'
                archiveArtifacts artifacts: 'tests/results/**/*.log'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Build succeeded!'
        }
        failure {
            echo 'Build failed!'
        }
    }
}
```

### 4. GitLab CI/CD
**設定ファイル**: `.gitlab-ci.yml`

```yaml
stages:
  - test
  - build
  - deploy

variables:
  MAS_HTTP_PORT: "8765"
  NODE_VERSION: "18"

before_script:
  - apt-get update -y
  - apt-get install -y tmux curl bc jq
  - node --version

test:unit:
  stage: test
  script:
    - CI=true bash tests/ci_test_runner.sh
  artifacts:
    when: always
    reports:
      junit: tests/results/junit.xml
    paths:
      - tests/results/

test:performance:
  stage: test
  script:
    - bash tests/test_performance.sh
  allow_failure: true

build:package:
  stage: build
  script:
    - tar -czf mas-tmux-${CI_COMMIT_SHA}.tar.gz .
  artifacts:
    paths:
      - mas-tmux-*.tar.gz
  only:
    - main
    - develop

deploy:production:
  stage: deploy
  script:
    - echo "Deploying to production..."
  only:
    - main
  when: manual
```

## CI用テストランナー

### 使用方法
```bash
# ローカルでのテスト実行
bash tests/ci_test_runner.sh

# CI環境での実行
CI=true bash tests/ci_test_runner.sh

# 詳細ログ付き
VERBOSE=true bash tests/ci_test_runner.sh

# タイムアウト設定（秒）
TEST_TIMEOUT=600 bash tests/ci_test_runner.sh
```

### 主な機能
- 自動的なシステム起動・停止
- JUnit XML形式のレポート生成
- タイムアウト処理
- CI環境の自動検出
- 並列テスト実行サポート

## テスト基準

### 必須基準（ビルド失敗条件）
| 項目 | 基準 | 理由 |
|-----|------|-----|
| HTTPサーバー起動 | 30秒以内 | システムの基本機能 |
| レスポンスタイム | 平均100ms以下 | パフォーマンス要件 |
| エラー率 | 1%未満 | 信頼性要件 |
| 必須テスト合格率 | 100% | 機能要件 |

### 推奨基準（警告のみ）
| 項目 | 基準 | 理由 |
|-----|------|-----|
| メモリ使用量 | 100MB以下 | リソース効率 |
| CPU使用率 | 50%以下 | システム負荷 |
| コードカバレッジ | 80%以上 | テスト網羅性 |

## ベストプラクティス

### 1. ブランチ戦略
```
main (本番)
  ├── develop (開発)
  │   ├── feature/XXX (機能開発)
  │   └── bugfix/XXX (バグ修正)
  └── hotfix/XXX (緊急修正)
```

### 2. コミットメッセージ規約
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `test`: テスト
- `refactor`: リファクタリング
- `chore`: その他

### 3. テストピラミッド
```
         /\
        /  \  E2E Tests (10%)
       /    \
      /------\ Integration Tests (30%)
     /        \
    /----------\ Unit Tests (60%)
```

### 4. デプロイメント戦略

#### Blue-Green Deployment
```bash
# 新バージョンをGreenにデプロイ
aws deploy create-deployment \
  --application-name mas-tmux \
  --deployment-group green \
  --s3-location bucket=deployments,key=mas-tmux-${VERSION}.zip

# ヘルスチェック
./health_check.sh green

# トラフィック切り替え
aws elb modify-load-balancer-attributes \
  --load-balancer-name mas-lb \
  --target green
```

#### Rolling Update
```bash
# ECSサービス更新
aws ecs update-service \
  --cluster mas-cluster \
  --service mas-service \
  --task-definition mas-tmux:${VERSION} \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100"
```

## モニタリングとアラート

### CloudWatch Alarms
```bash
# レスポンスタイムアラーム
aws cloudwatch put-metric-alarm \
  --alarm-name mas-high-response-time \
  --alarm-description "Response time > 200ms" \
  --metric-name ResponseTime \
  --namespace MAS/HTTP \
  --statistic Average \
  --period 300 \
  --threshold 200 \
  --comparison-operator GreaterThanThreshold
```

### Datadog Integration
```yaml
# datadog.yaml
init_config:

instances:
  - url: http://localhost:8765/health
    name: mas_http_server
    timeout: 5
    tags:
      - service:mas
      - env:production
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. tmuxセッションエラー
```bash
# エラー: "can't find session"
# 解決:
tmux kill-server
tmux new-session -d -s mas-tmux-test
```

#### 2. ポート競合
```bash
# エラー: "address already in use"
# 解決:
lsof -i :8765 | grep LISTEN
kill -9 <PID>
```

#### 3. Node.jsバージョン不一致
```bash
# エラー: "Node version mismatch"
# 解決:
nvm install 18
nvm use 18
```

#### 4. テストタイムアウト
```bash
# エラー: "Test timed out"
# 解決:
TEST_TIMEOUT=600 bash tests/ci_test_runner.sh
```

## 継続的改善

### メトリクス収集
- ビルド時間の推移
- テスト実行時間
- 失敗率とその原因
- デプロイ頻度

### 定期レビュー項目
- [ ] テストカバレッジの向上
- [ ] ビルド時間の最適化
- [ ] 依存関係の更新
- [ ] セキュリティ脆弱性のスキャン

## リソース

### 公式ドキュメント
- [AWS CodeBuild](https://docs.aws.amazon.com/codebuild/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Jenkins Pipeline](https://www.jenkins.io/doc/book/pipeline/)
- [GitLab CI/CD](https://docs.gitlab.com/ee/ci/)

### 関連ファイル
- [buildspec.yml](./buildspec.yml) - AWS CodeBuild設定
- [.github/workflows/ci.yml](./.github/workflows/ci.yml) - GitHub Actions
- [tests/ci_test_runner.sh](./tests/ci_test_runner.sh) - CIテストランナー
- [tests/README.md](./tests/README.md) - テストドキュメント

---
最終更新: 2025-12-12
バージョン: 1.0.0