# WannaV社内システム管理

## 📋 プロジェクト概要

**WannaV社内システム管理**は、社内で開発したシステムの修正履歴やコストを管理するための総合管理システムです。

### 主な機能

✅ **リポジトリ管理**
- GitHub の `@kyo10310415` にある全てのリポジトリを一覧表示
- リポジトリごとに表示/非表示を切り替え可能
- GitHub API経由での自動同期

✅ **更新履歴管理**
- GitHub Webhook 経由での自動記録
- 手動での更新履歴入力
- コミット情報の記録（SHA、作成者、メッセージ）

✅ **タスク管理**
- システムごとの簡単なタスク管理
- 期限設定とメモ機能
- タスクの完了/未完了ステータス管理

✅ **コスト管理**
- システムごとのコスト項目と金額の管理
- 複数通貨対応（JPY, USD, EUR）
- 請求サイクル管理（月次、年次、一回のみ）
- コスト合計の自動計算

## 🛠 技術スタック

- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Render)
- **Frontend**: EJS + TailwindCSS
- **GitHub連携**: GitHub REST API + Webhooks
- **デプロイ**: Render

## 📂 プロジェクト構成

```
wannav-system-manager/
├── src/
│   ├── index.ts              # メインアプリケーション
│   ├── migrate.ts            # データベースマイグレーション
│   ├── database/
│   │   ├── db.ts             # データベース接続
│   │   └── schema.sql        # データベーススキーマ
│   ├── services/
│   │   └── github.service.ts # GitHub API連携
│   ├── controllers/
│   │   ├── repository.controller.ts
│   │   ├── changelog.controller.ts
│   │   ├── task.controller.ts
│   │   └── cost.controller.ts
│   └── routes/
│       ├── repository.routes.ts
│       ├── changelog.routes.ts
│       ├── task.routes.ts
│       └── cost.routes.ts
├── views/
│   ├── repositories/
│   │   ├── index.ejs         # リポジトリ一覧
│   │   └── detail.ejs        # リポジトリ詳細
│   └── partials/
│       ├── header.ejs
│       └── footer.ejs
├── package.json
├── tsconfig.json
├── render.yaml               # Render設定ファイル
└── README.md
```

## 🚀 Renderへのデプロイ手順

### 1. GitHubリポジトリの準備

このコードは既に GitHub の `wannav-system-manager` リポジトリにプッシュされています。

### 2. Renderダッシュボードでの設定

#### A. PostgreSQLデータベースの作成

1. [Render Dashboard](https://dashboard.render.com/) にログイン
2. **New** → **PostgreSQL** を選択
3. 以下の設定を入力：
   - **Name**: `wannav-db`
   - **Database**: `wannav_system_manager`
   - **User**: `wannav_user`
   - **Region**: 任意（Tokyo推奨）
   - **Plan**: Free または有料プラン
4. **Create Database** をクリック

#### B. Webサービスの作成

1. **New** → **Web Service** を選択
2. GitHubリポジトリを接続：
   - **Connect repository**: `kyo10310415/wannav-system-manager`
3. 以下の設定を入力：
   - **Name**: `wannav-system-manager`
   - **Environment**: `Node`
   - **Region**: 任意（Tokyo推奨）
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

#### C. 環境変数の設定

**Environment Variables** セクションで以下を設定：

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `GITHUB_TOKEN` | あなたのGitHub Personal Access Token |
| `GITHUB_USERNAME` | `kyo10310415` |
| `SESSION_SECRET` | ランダムな文字列（自動生成可） |
| `DATABASE_URL` | データベース作成時に生成された接続文字列 |

#### D. データベース接続

1. 作成したPostgreSQLデータベースの詳細ページを開く
2. **Internal Database URL** または **External Database URL** をコピー
3. Webサービスの環境変数 `DATABASE_URL` に貼り付け

#### E. デプロイ実行

1. **Create Web Service** をクリック
2. 自動的にビルドとデプロイが開始されます
3. デプロイ完了後、ログに以下が表示されます：
   ```
   Server is running on port 3000
   Environment: production
   ```

### 3. データベースマイグレーション

デプロイ後、初回のみデータベースマイグレーションが必要です：

1. Renderダッシュボードで **Shell** タブを開く
2. 以下のコマンドを実行：
   ```bash
   npm run db:migrate
   ```

### 4. アプリケーションへのアクセス

デプロイが完了したら、Renderから提供されるURLにアクセスできます：
- 例: `https://wannav-system-manager.onrender.com`

## 📱 使い方

### 1. リポジトリの同期

1. トップページにアクセス
2. **GitHub同期** ボタンをクリック
3. `@kyo10310415` の全リポジトリが自動的に取得され、データベースに保存されます

### 2. リポジトリの表示/非表示切り替え

- 各リポジトリカードの右上にある目のアイコンをクリックすると、表示/非表示を切り替えられます

### 3. リポジトリ詳細画面

リポジトリ名をクリックすると、詳細画面に移動します。以下の機能が利用できます：

#### **更新履歴タブ**
- **更新履歴を追加** ボタンから手動で履歴を記録
- GitHub Webhook経由で自動記録された履歴も表示

#### **タスク管理タブ**
- **タスクを追加** ボタンから新規タスクを作成
- タスク名、メモ、期限を設定
- チェックボックスで完了/未完了を切り替え

#### **コスト管理タブ**
- **コストを追加** ボタンから新規コストを記録
- 項目名、金額、通貨、請求サイクルを設定
- 自動的に合計コストを計算して表示

### 4. GitHub Webhookの設定（オプション）

リポジトリの更新を自動記録するには、GitHub Webhookを設定します：

1. GitHubリポジトリページで **Settings** → **Webhooks** を開く
2. **Add webhook** をクリック
3. 以下を設定：
   - **Payload URL**: `https://your-render-url.onrender.com/changelogs/webhook`
   - **Content type**: `application/json`
   - **Events**: `Just the push event` を選択
4. **Add webhook** をクリック

これで、リポジトリにプッシュされるたびに自動的に更新履歴が記録されます。

## 🔧 ローカル開発

### 必要な環境

- Node.js 18以上
- PostgreSQL 14以上
- npm または yarn

### セットアップ

1. リポジトリをクローン：
   ```bash
   git clone https://github.com/kyo10310415/wannav-system-manager.git
   cd wannav-system-manager
   ```

2. 依存関係をインストール：
   ```bash
   npm install
   ```

3. `.env` ファイルを作成（`.env.example` を参考に）：
   ```bash
   cp .env.example .env
   ```

4. `.env` ファイルを編集して環境変数を設定

5. データベースマイグレーション：
   ```bash
   npm run db:migrate
   ```

6. 開発サーバーを起動：
   ```bash
   npm run dev
   ```

7. ブラウザで `http://localhost:3000` にアクセス

## 📊 データベーススキーマ

### repositories
- リポジトリ情報を管理
- GitHub IDとの紐付け
- 表示/非表示フラグ

### change_logs
- 更新履歴を記録
- 手動入力とWebhook自動記録の両方に対応
- コミットSHA、作成者情報を保存

### tasks
- システムごとのタスクを管理
- 期限、メモ、ステータスを記録

### costs
- システムごとのコストを管理
- 複数通貨対応
- 請求サイクル情報

## 🔐 セキュリティ

- GitHub Personal Access Tokenは環境変数で管理
- セッションシークレットは本番環境で必ず変更すること
- PostgreSQL接続はSSL推奨

## 📝 ライセンス

MIT License

## 👤 作成者

WannaV

---

## 🎯 今後の改善予定

- [ ] ユーザー認証機能の追加
- [ ] 複数GitHubアカウント対応
- [ ] レポート・グラフ表示機能
- [ ] コスト予測機能
- [ ] メール通知機能
