# Vercel Hobbyと既存Firebaseへの接続

## 対象

Next.jsの画面・管理APIをVercelに配置し、既存HTMLのFirebaseプロジェクト **`loe26d`** の **`system/current`** を使用する。`tennis-club-system` は今回使用しない。Firestoreの新規作成、初期化、データコピーは不要。

Hobbyは個人・非商用用途が条件。Firebaseのプランは既存プロジェクト側で確認する（コード変更でSparkへ変更されるわけではない）。FirebaseとVercelには無料利用枠の上限がある。

## Vercel設定

1. Hobbyアカウントで `ykamimura17/doubles-matching-system` をImportし、Next.js、Root Directory `/`、Node.js 22.xを指定する。
2. 統合後はmainを配備対象にする。検証用Previewで先に動作を確認する。
3. `vercel.json` のBuild Commandは環境整合チェック後にNext.jsをビルドする。Install Commandは `npm install`。
4. `.env.example` の公開Web設定4項目を登録する。値は既存HTMLから転記済み。`NEXT_PUBLIC_*` はビルド時に埋め込まれるので変更時は再デプロイする。
5. 以下のサーバー用環境変数を登録する。

| 変数 | 値 |
|---|---|
| `FIREBASE_PROJECT_ID` | `loe26d` |
| `FIREBASE_CLIENT_EMAIL` | `loe26d` 内の専用サービスアカウントのメール |
| `FIREBASE_PRIVATE_KEY` | 専用サービスアカウントのRSA秘密鍵 |

専用実行IDにはFirestore操作用の `roles/datastore.user` と失効チェック用の `roles/firebaseauth.viewer` を付与する。Owner、Editor、Authの管理権限は実行IDに付けない。秘密鍵は本人がVercelのSensitive環境変数へ直接登録し、Git・チャット・CIログには載せない。実改行と文字列 `\n` に対応。外側の引用符はVercel入力欄に含めない。

最初の鍵登録先は対象ブランチのPreviewに限定し、無関係なPRに渡さない。Productionへの登録は検証後。`GOOGLE_APPLICATION_CREDENTIALS` と `NEXT_PUBLIC_E2E_MODE` はVercelに設定しない。ローカルではADCも使用できる。

## 既存環境の認証・データ

新プロジェクトで有効化した認証設定は `loe26d` に引き継がれない。既存側で匿名認証とメール/パスワード認証が使えるか確認し、管理者UIDに `admin: true` を付与する必要がある。

専用の運用IDでの例（ADC取得にはGoogle Cloud CLI、偽装にはToken Creator権限が必要）:

```powershell
gcloud auth application-default login --impersonate-service-account=SETUP_SERVICE_ACCOUNT_EMAIL
$env:FIREBASE_PROJECT_ID = 'loe26d'
node scripts/setup-new-firebase.mjs grant-admin loe26d --confirm-existing-project ADMIN_UID
```

スクリプトのbootstrapは拒否される。既存データには書き込まない。claim付与は既存claimを保持する。付与後に管理者は再ログインする。実行用IDにclaim変更権限を追加しない。

必要なVercelのホスト名をAuthenticationの承認済みドメインで確認する。httpsやパスは入力しない。

## ルールと切替

**既存HTMLはブラウザからFirestoreへ直接書き込む。リポジトリの `firestore.rules` を既存環境にそのまま反映すると、その書込みを拒否する。** 今回はルールを反映していない。既存HTMLの運用を続ける間は、自動deployを追加しない。

Next.js APIは管理者IDトークン・claimを検証して更新するが、既存Firestoreのルールが広く書込みを許可していれば、それは別のアクセス経路として残る。新API導入だけで既存環境全体の権限が強化されるわけではない。

公開切替前に既存データのエクスポート等によるバックアップを確保し、データ形式と読取りを確認する。書込みテストは既存運用データへの影響を管理したうえで行う。既存HTMLとNext.jsの管理操作を同時に行わない。HTMLは全体保存を行うため、新APIの更新を上書きする可能性がある。

選手登録、休憩管理、MVP/SVPなどはNext.js版に未移植。GitHubへのマージと、実際の公開・運用切替は別作業。

## 検証

```sh
node --env-file=.env.local scripts/check-firebase-config.mjs
npm run typecheck
npm test
npm run build
npm run test:e2e
```

環境チェックは値の形式・対象の確認のみ。鍵の有効性、IAM、実Firebase接続は別途確認が必要。CIは本番鍵を使わずビルドし、E2Eは固定データの正常系を確認する。

公式資料: [Hobby](https://vercel.com/docs/plans/hobby)、[Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
