# Vercel Hobby + Firebase Spark

## 対象

Next.jsをVercelへ配備し、自分のFirebase **`tennis-club-system`** の **`system/current`** を使う。既存HTMLに記載された他者所有の `loe26d` には接続しない。Firebase側のプランはSparkであることを確認する。Google Cloudの請求先アカウントを紐付けるとBlazeへ移行する。今回の構成にApp Hosting、Cloud Run、Cloud Functionsは不要。

## Firestore

Standard edition、DB ID `(default)` を使用。初期ドキュメント `system/current` は `courtCount` を数値3、`players`、`courts`、`matchHistory`、`pairHistory` を空の配列にする。マップや文字列で作成しない。作成済みデータは上書きしない。空データでは試合開始できないため、検証用選手の準備が必要。選手登録UI/APIなどはNext.js版に未移植。

新プロジェクトのルールはリポジトリの `firestore.rules` に合わせる。認証済み利用者の `system/current` のgetだけを許可し、直接書込みは禁止する。Admin SDKはルールを迂回するためAPIのadmin claim検証とIAMも必要。今回のコード変更でルールや実データを反映したわけではない。

## Vercel

GitHub `ykamimura17/doubles-matching-system` をImport。Next.js、Root Directory `/`、Node.js 22.x。修正PRの統合後はmainを配備する。Build Commandは `vercel.json` の環境チェック付きコマンドを使用。Install Commandは `npm install`。

環境変数:

| 名前 | 値 |
|---|---|
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `tennis-club-system` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `tennis-club-system.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | このプロジェクトのWebアプリの `apiKey` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 同じWebアプリの `appId` |
| `FIREBASE_PROJECT_ID` | `tennis-club-system` |
| `FIREBASE_CLIENT_EMAIL` | 専用サービスアカウントJSONの `client_email` |
| `FIREBASE_PRIVATE_KEY` | 同じJSONの `private_key` |

API key・App IDは旧HTMLの値を使わない。公開設定はFirebaseの「プロジェクト設定→全般→マイアプリ→Webアプリ」で取得。`NEXT_PUBLIC_*` はビルド時に埋め込まれるため、変更後は再デプロイする。

## サーバー用サービスアカウント

Google Cloudコンソールで同じ `tennis-club-system` を選択し、「IAMと管理→サービスアカウント」で `vercel-runtime` 等を作成。`roles/datastore.user` と `roles/firebaseauth.viewer` をプロジェクトで付与する。実行IDにOwner、Editor、Auth管理者権限は付けない。

アカウントの「キー→鍵を追加→新しい鍵を作成→JSON」で鍵を取得。本人が `client_email` と `private_key` をVercelへ直接登録する。秘密鍵はSecret/Sensitive扱いにし、Git・チャット・CIログには載せない。PEMは実改行と文字列 `\n` の両方に対応。Vercel入力欄ではJSON外側の引用符を付けない。

まず検証用ブランチに限定したPreview環境で確認し、Production登録は確認後に行う。無関係なPRへ本番鍵を渡さない。`NEXT_PUBLIC_E2E_MODE` や `GOOGLE_APPLICATION_CREDENTIALS` をVercelに設定しない。ローカルではADCも利用可能。

IAM自体は無料。Google Cloud画面を開いたりサービスアカウントを作ることと、請求先登録は別。課金契約や無料トライアルを開始する必要はない。

## Authenticationとclaim

匿名認証（30日自動削除なし）・メール/パスワード認証はユーザー設定済み。管理者ユーザーを作成し、別の運用IDで `admin: true` を付与する。Vercelの実行IDにはclaim変更権限を追加しない。

```powershell
gcloud auth application-default login --impersonate-service-account=SETUP_SERVICE_ACCOUNT_EMAIL
$env:FIREBASE_PROJECT_ID = 'tennis-club-system'
node scripts/setup-new-firebase.mjs grant-admin tennis-club-system --confirm-existing-project ADMIN_UID
```

スクリプト名は従来のままだが、bootstrapは禁止。作成済みデータに書き込まない。確認フラグ `--confirm-existing-project` は既に作成済みのプロジェクトを指す。管理者はclaim付与後に再ログインする。必要なVercelのホスト名をAuthの承認済みドメインで確認する。

## 検証

型チェック・単体テスト・build・固定データの正常系E2Eとは別に、実Firebaseで匿名読取り、管理者ログイン、試合開始・結果登録・取消、一般利用者の直接書込み拒否を確認する。環境チェックは値の形式・対象のみで、鍵の有効性・IAMの検証ではない。

公式資料: [IAM料金](https://cloud.google.com/iam/pricing)、[Firebaseプラン](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)、[Admin SDK](https://firebase.google.com/docs/admin/setup)
