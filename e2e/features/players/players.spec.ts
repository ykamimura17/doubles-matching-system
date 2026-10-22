import {test,expect} from "@playwright/test";
test.describe("選手",()=>{
 test("参加選手と状態・ポイント・戦績を確認できる",async({page})=>{
  await page.goto("/players");
  const panel=page.locator("#players");
  await expect(panel).toContainText("8 名");
  const cards=panel.locator(".player");
  await expect(cards).toHaveCount(8);
  await expect(cards.first()).toContainText("田中");
  await expect(cards.first()).toContainText("試合中");
  await expect(cards.first()).toContainText("9 pt");
  await expect(cards.last()).toContainText("待機中");
 });
 test('登録した選手を編集し休憩・復帰できる',async({page})=>{
  await page.goto('/players');const panel=page.locator('#players');
  await panel.getByRole('button',{name:'＋ プレイヤー登録'}).click();
  await panel.getByLabel('名前',{exact:true}).fill('新規 太郎');
  await panel.getByLabel('レベル',{exact:true}).selectOption('3');
  await panel.getByLabel('コメント',{exact:true}).fill('左利き');
  await panel.getByRole('button',{name:'選手を登録する',exact:true}).click();
  const row=panel.locator('.player').filter({hasText:'新規 太郎'});
  await expect(row).toContainText('0 pt');await expect(row).toContainText('左利き');
  await panel.getByRole('button',{name:'新規 太郎を編集',exact:true}).click();
  await panel.getByLabel('名前',{exact:true}).fill('新規 次郎');
  await panel.getByRole('button',{name:'変更を保存',exact:true}).click();
  await panel.getByRole('button',{name:'新規 次郎を休憩にする',exact:true}).click();
  await panel.getByRole('button',{name:'変更を保存',exact:true}).click();
  await panel.getByRole('button',{name:'休憩中',exact:true}).click();
  await expect(panel.locator('.player')).toHaveCount(1);
  await expect(panel.locator('.player')).toContainText('新規 次郎');
  await panel.getByRole('button',{name:'新規 次郎を復帰にする',exact:true}).click();
  await panel.getByRole('button',{name:'変更を保存',exact:true}).click();
  await panel.getByRole('button',{name:'待機中',exact:true}).click();
  await expect(panel.locator('.player').filter({hasText:'新規 次郎'})).toContainText('待機中');
 });
 test('管理者がコート数を設定できる',async({page})=>{
  await page.goto('/players');const panel=page.locator('#players');
  await panel.getByRole('button',{name:'コート数設定',exact:true}).click();
  await panel.getByLabel('コート数',{exact:true}).fill('4');
  await panel.getByRole('button',{name:'変更を保存',exact:true}).click();
  await expect(panel.getByRole('status')).toContainText('変更を保存しました');
 });
});
