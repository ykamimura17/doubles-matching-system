# 新しい Firebase プロジェクトへの接続

## 接続設計

- ブラウザ: `NEXT_PUBLIC_FIREBASE_*` の Web App 設定を使い、Firebase Authentication と Firestore Web SDK を初期化
- 閲覧者: 匿名認証でサインイン。Firestore の `system/current` を読み取りのみ可能
- 管理者: メール/パスワードでサインイン。Firebase Admin SDK から `admin: true` の Custom Claim を付与されたユーザーのみ管理APIを実行可能
- Next.js API Route: Bearer ID Token を Admin SDK で検証し、Firestore Admin SDK でトランザクションを実行
- サーバー: **ADC (Application Default Credentials)**。Google Cloud Run / Firebase App Hosting ではサービスアカウントを割り当て、秘密鍵ファイルを配布しない
- `NEXT_PUBLIC_*` はブラウザのJSに含まれる。秘密鍵やAdminの認証情報を絶対にこのプレフィックスで設定しない

## プロジェクト作成（既存Firebaseは使用しない）

1. 新しいGoogle Cloud / Firebaseプロジェクトを作成する（元のプロジェクトIDとは別にする）
2. Firebase Authenticationで **匿名認証** と **メール/パスワード認証** を有効化
3. Cloud Firestoreを新プロジェクトに作成
4. `firestore.rules` を新プロジェクトに反映（読み取りはログイン済みのみ、書き込みは全て拒否）
5. 新プロジェクトにWebアプリを登録し、Web App設定を取得して `.env.local` に登録
6. 管理者となるメール/パスワードユーザーをFirebase Authenticationで作成
7. ADCを使える環境で初期データの作成と管理者権限の付与を実行
8. Next.jsデプロイ先にサービスアカウントとWeb App設定を登録し、新プロジェクトへ接続できることを確認
9. 実Firebaseで読み取り／管理者の試合作成・結果登録を確認してから旧環境から切り替える

## 必要な環境変数

ブラウザ用（公開値）:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<new-project-id>
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

サーバー用:

```dotenv
FIREBASE_PROJECT_ID=<same-new-project-id>
```

**Cloud Run / Firebase App Hosting のGoogle管理環境でADCを使う場合、秘密鍵を環境変数に渡す必要はありません。**

`NEXT_PUBLIC_*` は `next build` 時点でJavaScriptに埋め込まれるため、**ビルド時に新環境の値**を渡します。ビルド後に環境変数だけを変えてもブラウザ側設定は変わりません。

## ローカルでの認証

```sh
gcloud auth application-default login
# 自分の新FirebaseプロジェクトIDを渡す
FIREBASE_PROJECT_ID=<new-project-id> node scripts/setup-new-firebase.mjs bootstrap <new-project-id> --confirm-new-project
FIREBASE_PROJECT_ID=<new-project-id> node scripts/setup-new-firebase.mjs grant-admin <new-project-id> --confirm-new-project <admin-uid>
```

- 初期データは空の `system/current` のみ。存在する場合は**上書きしない**。
- Admin Claim付与後は、管理者がログアウトして再ログインする。
- ADCに使用するサービスアカウントには必要最小限の権限だけを割り当てる。
- CLIで扱うFirebaseプロジェクトIDを必ず照合し、誤って旧環境を変更しないこと。

## デプロイについて

- Cloud Run / Firebase App Hosting: 実行IDに適切な権限を付与し、`applicationDefault()` を使用
- Vercel: 秘密鍵不要のWorkload Identity FederationなどでGoogle ADCの取得経路を構成するか、サービスアカウントキーをシークレットとして厳重に管理する方式が必要。現行実装はADC前提なので、キーを環境変数に置いただけでは使えません

## 公開前チェック

- [ ] 新しいFirebaseプロジェクト作成済み
- [ ] 匿名認証とメール/パスワード認証が有効
- [ ] Firestoreのルールをデプロイ済み
- [ ] テスト管理者のメール/パスワードユーザーと `admin: true` クレームを設定
- [ ] Firebase Web Appの環境変数が新環境を指している
- [ ] Googleサーバー環境のADCに新プロジェクトへの適切な権限がある
- [ ] 参加者は閲覧のみ・管理者は試合開始／終了できることを実環境で確認
- [ ] main のマージと本番切替を、上記の確認が済むまで保留
