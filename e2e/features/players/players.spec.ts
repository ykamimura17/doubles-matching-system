import {test,expect} from "@playwright/test";
test.describe("選手",()=>{
 test("参加選手と状態・ポイント・戦績を確認できる",async({page})=>{
  await page.goto("/");
  const panel=page.locator("#players");
  await expect(panel).toContainText("8 名");
  const cards=panel.locator(".player");
  await expect(cards).toHaveCount(8);
  await expect(cards.first()).toContainText("田中");
  await expect(cards.first()).toContainText("試合中");
  await expect(cards.first()).toContainText("9 pt");
  await expect(cards.last()).toContainText("待機中");
 });
});
