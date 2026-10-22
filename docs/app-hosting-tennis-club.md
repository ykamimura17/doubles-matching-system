# tennis-club-system の App Hosting 接続

## 現在の状態

対象は新プロジェクト `tennis-club-system` のみ。匿名認証（30日自動削除なし）とメール/パスワード認証はユーザー設定済み。Firestore、IAM、課金、Webアプリ登録、App Hostingバックエンドはこの変更では実環境を確認・変更していない。

PR #1 → #2 → #3 → #4 は未マージのスタック。この変更は #4 を基点とする。重複する変更があるため、まとめて無検証でmainへマージしない。

## コンソールでの接続

1. FirebaseコンソールでプロジェクトIDを照合し、Blazeプランを確認する。課金の有効化は所有者が行う。
2. 新プロジェクトにWebアプリを登録する。公開設定の `apiKey` と `appId` を取得する。
3. Firestore `(default)` を作成する。リージョンはデータ保存先なので作成前に選定する。
4. App Hostingでバックエンドを作成し、GitHubアプリに `ykamimura17/doubles-matching-system` のアクセスを許可する。リポジトリルートは `/`。
5. 最初はこの設定を含む検証ブランチを接続し、自動ロールアウトを無効にする。mainへの接続・自動公開は受入検証後に行う。バックエンドIDやリージョンは実際に作成した値を記録する。
6. App Hostingの環境変数に `NEXT_PUBLIC_FIREBASE_API_KEY` と `NEXT_PUBLIC_FIREBASE_APP_ID` を設定し、ビルドと実行の両方で利用可能にする。他の3変数は `apphosting.yaml` に定義済み。公開Web設定であり秘密鍵ではない。
7. `NEXT_PUBLIC_E2E_MODE` は設定しない。`GOOGLE_APPLICATION_CREDENTIALS` やサービスアカウント秘密鍵も設定しない。

App Hostingのサービスアカウントが実行時ADCを供給する。実際のバックエンド実行IDのIAMを確認し、Firestoreのデータ操作権限（`roles/datastore.user`）と、失効済みIDトークン検査に必要なユーザー取得権限（例: `roles/firebaseauth.viewer`）があることを確認する。実行IDに管理者claimを変更する権限は不要。初期化・claim付与は別の権限付き運用IDで行う。

## ルール・初期化・管理者

Firebase CLIとGoogle Cloud CLIにログインした管理端末で実行する。CLIログインとADCログインは別。ローカルのAuth操作ではサービスアカウント偽装ADCを推奨（呼出者に当該IDのToken Creator権限が必要）。対象サービスアカウントは新プロジェクトに限定して用意する。

```sh
gcloud auth application-default login --impersonate-service-account=SETUP_SERVICE_ACCOUNT_EMAIL
firebase deploy --only firestore:rules --project tennis-club-system
```

PowerShell:

```powershell
$env:FIREBASE_PROJECT_ID = 'tennis-club-system'
node scripts/setup-new-firebase.mjs bootstrap tennis-club-system --confirm-new-project
node scripts/setup-new-firebase.mjs grant-admin tennis-club-system --confirm-new-project ADMIN_UID
```

`ADMIN_UID` は新プロジェクトで作成した管理者のUIDに置換する。パスワードをGitHubや環境変数テンプレートに書かない。スクリプトは他のプロジェクトを拒否し、初期データは既存なら上書きしない。claim付与は既存claimを保持する。管理者は再ログインしてIDトークンを更新する。

Firestoreルールは認証済み利用者による `system/current` のgetのみ許可し、直接書込みは拒否する。Admin SDKはルールを迂回するため、APIのIDトークン・admin claim検証と実行IDのIAMも必要。

## 検証と公開条件

`.env.local` を `.env.example` から作り、Web設定2項目を補う。

```sh
node --env-file=.env.local scripts/check-firebase-config.mjs
```

これは値の整合性のみ確認し、Firebase接続成功は保証しない。GitHub CIはtypecheck、単体テスト、ビルド、固定データによるdesktop/mobile E2Eを実行する。CIに本番認証情報を渡さない。

実Firebase環境では匿名ログインと読取り、管理者ログインとclaim、試合開始・結果登録・取消、一般利用者の書込み拒否を確認する。現行の空データ初期化だけでは選手がいないため試合作成できない。新環境に検証用選手を用意する手段は別途必要（選手登録UI/APIは未移植）。テストデータや実データを旧環境から無断でコピーしない。

App Hosting URLをAuthenticationの承認済みドメインで確認し、必要なら追加する。ロールアウトのビルドログ、実行ログ、ADCによるFirestore/Authアクセスを確認する。これらが完了するまでmainへのマージと旧環境からの切替は保留する。

公式資料:
- https://firebase.google.com/docs/app-hosting/configure
- https://firebase.google.com/docs/app-hosting/firebase-sdks
- https://firebase.google.com/docs/admin/setup
- https://cloud.google.com/docs/authentication/set-up-adc-local-dev-environment
