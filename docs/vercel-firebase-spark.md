# Vercel Hobby + Firebase Spark

## 構成と現在地

Next.jsの画面・APIはVercel、認証とデータは新Firebaseプロジェクト `tennis-club-system` に配置する。App Hosting、Cloud Run、Cloud Functionsは使用しない。FirebaseはSparkを維持する。すでにBlazeの場合も、この変更で課金解除や既存リソースの削除は行わない。

Hobbyは個人・非商用用途が条件。上限を超えると機能の利用が制限される。Firebase Sparkにも利用上限がある。今回のコード変更ではVercelアカウント、Firebaseのプラン・Web設定・Firestore・IAM・管理者claimを実環境で確認していない。

## 1. Firebase側の準備

1. プロジェクトIDが `tennis-club-system` であることとSparkプランを確認。
2. 匿名認証（30日自動削除なし）とメール/パスワード認証は設定済み。Webアプリを登録し `firebaseConfig` を取得する。
3. Firestore Standard `(default)` を本番モードで作成する。リージョンは作成前に選定する。
4. `firebase deploy --only firestore:rules --project tennis-club-system` でリポジトリのルールを反映。Firebase CLIのログインが必要。
5. Authenticationに管理者のメール/パスワードユーザーを作成しUIDを記録。claim付与は後述の別運用IDで行う。

## 2. Vercel専用のサーバー認証

新プロジェクトに `vercel-runtime` などの専用サービスアカウントを作成する。

- プロジェクトで `roles/datastore.user` を付与（Firestoreの読取り・更新）。
- `roles/firebaseauth.viewer` を付与（失効チェックに使うユーザー取得）。
- Owner、Editor、Firebase Authentication Adminは実行IDに付与しない。
- サービスアカウントの鍵を作成し、JSONの `client_email` と `private_key` を本人がVercelへ直接登録する。鍵JSONをGit、チャット、CIログに載せない。運用端末上のコピーも管理する。

Vercelで以下をサーバー環境変数として設定する。`NEXT_PUBLIC_` を付けない。

| 変数 | 値 |
|---|---|
| `FIREBASE_PROJECT_ID` | `tennis-club-system` |
| `FIREBASE_CLIENT_EMAIL` | 専用サービスアカウントの `client_email` |
| `FIREBASE_PRIVATE_KEY` | 専用鍵の `private_key` |

秘密鍵はSensitive設定を使用する。PEMの実改行と文字列 `\n` のどちらも対応する。Vercel入力欄では外側に引用符を付けない。`GOOGLE_APPLICATION_CREDENTIALS` はVercelに設定しない。ローカルADCは引き続き使える。

OIDC/WIFもVercel全プランで利用可能だが、この実装はサービスアカウント鍵方式。前提API・IAM・Sparkでの利用条件を未検証のWIF設定として完了扱いしない。

## 3. Vercelプロジェクト

1. Hobbyアカウントで `ykamimura17/doubles-matching-system` をImport。Next.js、Root Directory `/`、Node.js 22.x。
2. 初回は設定が揃うまで公開しない。既定mainにはNext.js移行が未マージなので、検証は `feat/app-hosting-tennis-club` ブランチから行う（ブランチ名は旧配備先を含むが、内容はVercel用）。
3. `vercel.json` のBuild Commandは環境整合チェック後にNext.jsをビルドする。Install Commandは `npm install`（lockfile導入時は `npm ci`）。
4. 下表の公開Web設定と前項のサーバー設定を、最初は対象ブランチのPreview環境に限定して登録する。共有Preview全体や無関係なPRへ秘密鍵を渡さない。Productionへの設定は実接続検証後。

| 公開環境変数 | 値 |
|---|---|
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `tennis-club-system` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `tennis-club-system.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | 新Webアプリの `apiKey` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 新Webアプリの `appId` |

`NEXT_PUBLIC_*` はビルド時に埋め込まれる。変更後は再デプロイする。`NEXT_PUBLIC_E2E_MODE` は設定しない。Previewの閲覧権限設定も確認する。

初回デプロイ後、Firebase Authenticationの承認済みドメインに必要なVercelホスト名を追加する（httpsやパスは含めない）。本番では固定ホスト名を使う。

## 4. 初期データ・admin claim

専用の運用IDに必要なFirestore作成権限とAuthのユーザー更新権限を用意する。Vercel実行用の鍵にclaim付与権限を追加しない。

PowerShellの例（Google Cloud CLIが必要、サービスアカウント偽装にはToken Creator権限が必要）:

```powershell
gcloud auth application-default login --impersonate-service-account=SETUP_SERVICE_ACCOUNT_EMAIL
$env:FIREBASE_PROJECT_ID = 'tennis-club-system'
node scripts/setup-new-firebase.mjs bootstrap tennis-club-system --confirm-new-project
node scripts/setup-new-firebase.mjs grant-admin tennis-club-system --confirm-new-project ADMIN_UID
```

初期化は既存ドキュメントを上書きしない。claimは既存claimを保持する。管理者は付与後に再ログインする。初期データは空なので、試合テストには新環境に検証用選手を用意する必要がある。選手登録UI/APIは未移植。旧環境からデータをコピーしない。

## 5. 検証・切替

ローカルでは `.env.local` を補完して以下を実行する。

```sh
node --env-file=.env.local scripts/check-firebase-config.mjs
npm run typecheck
npm test
npm run build
npm run test:e2e
```

環境チェックは値の形式と対象を検証するだけで、鍵の有効性・権限やFirebase接続は検証しない。CIのbuildは公開先と異なり `npm run build` を使い、本番の鍵を必要としない。E2Eは固定データの正常系で、実Firebase検証は別途必要。

実環境で匿名ログインと読取り、管理者ログイン、試合開始・結果登録・取消、一般利用者の直接書込み拒否を確認する。FirestoreルールはAdmin SDKには適用されないため、API認可とIAMも確認する。

PR #1〜#4は未マージ。本PRは#4に積んだ配備準備。重複を整理して順次統合し、受入検証後にmainとProductionを切り替える。旧環境は変更しない。

## 公式資料

- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Vercel環境変数](https://vercel.com/docs/environment-variables)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase料金プラン](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
