# 新Firebaseプロジェクトへの接続

対象は `tennis-club-system` のみ。配備先は **Vercel Hobby + Firebase Spark**。
接続・運用手順は [Vercel接続手順](vercel-firebase-spark.md) を参照。

- 画面と管理APIはNext.jsをVercelのNode.js環境で実行。
- 参加者は匿名認証、管理者はメール/パスワード認証と `admin: true` claim。
- Firestore `system/current` は認証済み利用者の読取りのみ許可。直接書込みは拒否。
- 管理APIはIDトークンとadmin claimを検証してAdmin SDKから更新。
- Vercelは専用サービスアカウントのサーバー環境変数で認証。ローカルはADCも使用可能。
- 旧Firebaseは変更しない。実Firebaseで受入検証が済むまでmainのマージ・公開切替は保留。
