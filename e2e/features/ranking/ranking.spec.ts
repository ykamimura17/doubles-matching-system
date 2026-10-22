import {test,expect} from "@playwright/test";
test.describe("ランキング",()=>{
 test("ランキングが初期表示され得点順で勝敗分を確認できる",async({page})=>{
  await page.goto("/");
  const rows=page.locator("#ranking .rank");
  await expect(rows).toHaveCount(8);
  await expect(rows.first()).toContainText("田中");
  await expect(rows.first()).toContainText("9 pt");
  await expect(rows.first()).toContainText("3/0/0");
  await expect(rows.nth(1)).toContainText("山本");
 });
});
