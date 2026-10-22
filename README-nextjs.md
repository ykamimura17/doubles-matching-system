# Next.js 移行版（開発中）

既存のHTML版は削除せず、Next.js App Router + React + TypeScript の新しいフロントエンドを並行導入します。

## 開発

1. Node.js 20以降をインストール
2. `npm install`
3. `.env.example` を `.env.local` にコピーし、Firebaseの値を設定
4. Firebase Authenticationでメール/パスワード認証を有効化し、管理者ユーザーにサーバー側から `admin: true` のカスタムクレームを付与
5. 自分のFirebase `tennis-club-system` の `system/current` を使用（既存データは上書きしない）
6. `npm run dev`、`npm run typecheck`、`npm test`

## アーキテクチャ

公開先は **Vercel Hobby + Firebase Spark**。[接続手順](docs/vercel-firebase-spark.md) に環境変数と管理者設定を記載。

- `src/app/page.tsx`: レスポンシブUI・Firestore購読
- `src/components/CourtCard.tsx`: Figma風のコートカード
- `src/lib/matching.ts`: マッチング・結果計算のドメイン処理
- `src/app/api/matches/route.ts`: 管理者専用のAPI。Firebase IDトークンとcustom claimを検証し、Firestoreトランザクションで試合開始・結果登録・取消を処理
- `src/lib/firebase-admin.ts`: サーバー限定のFirebase Admin SDK

**重要**: 管理者パスワードをクライアントに埋め込まない。Firebase Adminの秘密鍵はサーバー環境変数のみ。Firestoreセキュリティルールでは `system/current` のクライアント直接書き込みを禁止し、読み取りを必要な認証範囲に制限する。Firestoreルール・管理者アカウント・本番デプロイの設定が完了するまでは本番移行しない。

## 移行時の注意

既存のFirestoreドキュメントには日付がTimestamp型で保存されている場合があります。表示に使用する場合は正規化してください。既存のHTML版からは試合データが同時更新される可能性があるため、新版へ切り替える際は旧版の書き込みを停止すること。今後の段階で、選手追加・休憩管理・ランキング詳細・MVP/SVP・履歴編集などの管理画面を移植します。
