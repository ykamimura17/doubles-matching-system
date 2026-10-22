import {test,expect} from "@playwright/test";
test.describe("試合履歴",()=>{
 test("登録済みの対戦結果を閲覧できる",async({page})=>{
  await page.goto("/");
  const history=page.locator("#history .history");
  await expect(history).toHaveCount(1);
  await expect(history.first()).toContainText("COURT 3");
  await expect(history.first()).toContainText("田中・山本");
  await expect(history.first()).toContainText("4 - 0");
  await expect(history.first()).toContainText("佐藤・安村");
 });
});
