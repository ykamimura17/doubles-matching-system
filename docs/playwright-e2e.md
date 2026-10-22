# Playwright E2E

E2Eは **業務ドメイン / feature** ごとに分割し、正常系シナリオのみを作成しています。

- `e2e/features/courts/`: コート表示、自動／手動マッチングの開始、結果登録
- `e2e/features/players/`: 選手一覧・状態・ポイント
- `e2e/features/ranking/`: ランキング初期表示・ポイント順・戦績
- `e2e/features/history/`: 試合履歴

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

`playwright.config.ts` が専用のNext.js開発サーバーをポート3100で起動し、`NEXT_PUBLIC_E2E_MODE=true` に設定します。このときのみ `src/lib/e2e/scenario.ts` の固定データを使い、操作を**ブラウザー内のテスト用アダプター**で完結させます。Firebaseへの接続や書き込みは行いません。E2Eモードは `NODE_ENV=development` が必須で、本番ビルドでは無効です。

プロジェクトはDesktop ChromeとPixel 7相当のモバイル表示で並列検証します。失敗時はPlaywrightのtraceとスクリーンショットを保持し、CIでHTMLレポートをアーティファクトとして保存します。

**対象範囲**: 画面操作とUI・ドメインロジックの結合シナリオ。実際のFirebase Authentication、Firestoreセキュリティルール、Cloud APIの動作は含みません。これらは別途Firebase Emulator等による統合テストが必要です。
