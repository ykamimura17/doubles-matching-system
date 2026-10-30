import {test,expect} from "@playwright/test";

for(const role of ["admin","participant"]){
test.describe(`コート・試合管理（${role}）`,()=>{
 test.beforeEach(async({page})=>{await page.goto(`/courts?role=${role}`);await expect(page.getByText("テスト環境")).toBeVisible()});
 test("現在の試合と空きコートを表示する",async({page})=>{
  const cards=page.locator("#courts .court-card");
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0).locator(".team.top")).toHaveText("田中・山本");
  await expect(cards.nth(0).locator(".team.vs")).toHaveText("VS");
  await expect(cards.nth(0).locator(".team.bottom")).toHaveText("佐藤・安村");
  await expect(cards.nth(1)).toContainText("空き");
 });
 test("空きコートで自動マッチングを確定し試合を開始できる",async({page})=>{
  const card=page.locator("#courts .court-card").nth(1);
  await card.getByRole("button",{name:/マッチングを選択/}).click();
  await page.getByRole("button",{name:"自動マッチング"}).click();
  await expect(page.locator(".preview")).toContainText("森田");
  await page.getByRole("button",{name:"この組み合わせで試合開始"}).click();
  await expect(card).toContainText("試合中");
  await expect(card.locator(".team.top")).not.toBeEmpty();
  await expect(card.locator(".team.bottom")).not.toBeEmpty();
 });
 test("手動で4名を選んで試合を開始できる",async({page})=>{
  const card=page.locator("#courts .court-card").nth(2);
  await card.getByRole("button",{name:/マッチングを選択/}).click();
  await page.getByRole("button",{name:"手動入力"}).click();
  const selects=page.locator(".manual-grid select");
  for(const [index,id] of [5,6,7,8].entries())await selects.nth(index).selectOption(String(id));
  await page.getByRole("button",{name:"組み合わせを確認"}).click();
  await expect(page.locator(".preview")).toContainText("森田・山下");
  await page.getByRole("button",{name:"この組み合わせで試合開始"}).click();
  await expect(card.locator(".team.top")).toHaveText("森田・山下");
  await expect(card.locator(".team.bottom")).toHaveText("吉田・中野");
 });
 test("試合結果を登録するとコートが空きに戻る",async({page})=>{
  const card=page.locator("#courts .court-card").first();
  await card.getByRole("button",{name:/結果を入力/}).click();
  const scoreInputs=page.locator(".score-grid input");
  await scoreInputs.nth(0).fill("4");
  await scoreInputs.nth(1).fill("0");
  await page.getByRole("button",{name:"結果を登録"}).click();
  await expect(card).toContainText("空き");
  await page.goto("/history");
  await expect(page.locator("#history .history").first().locator(".history-team-score")).toHaveText(["4","0"]);
 });
 test("参加者には取消や履歴の管理ボタンを表示しない",async({page})=>{
  test.skip(role!=="participant");
  await page.locator("#courts .court-card").first().getByRole("button",{name:/結果を入力/}).click();
  await expect(page.getByRole("button",{name:"結果を登録",exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"試合取消",exact:true})).toHaveCount(0);
  await page.goto("/history?role=participant");
  await expect(page.getByText("テスト環境")).toBeVisible();
  await expect(page.getByRole("button",{name:"編集",exact:true})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"削除",exact:true})).toHaveCount(0);
 });
});
}
