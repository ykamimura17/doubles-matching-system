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
 test('選手を編集し確認ダイアログから休憩・復帰できる',async({page})=>{
  await page.goto('/players');const panel=page.locator('#players');
  await expect(panel.getByRole('button',{name:'ステータス変更',exact:true})).toHaveCount(0);
  await expect(panel.getByRole('button',{name:'田中を休憩にする',exact:true})).toBeDisabled();
  await panel.getByRole('button',{name:'森田を編集',exact:true}).click();
  await panel.getByLabel('名前',{exact:true}).fill('新規 次郎');
  await panel.getByLabel('コメント',{exact:true}).fill('左利き');
  await panel.getByRole('button',{name:'変更を保存',exact:true}).click();
  const editedRow=panel.locator('.player').filter({hasText:'新規 次郎'});
  await expect(editedRow).toContainText('0 pt');await expect(editedRow).toContainText('左利き');
  const dismissRest=page.waitForEvent('dialog').then(async dialog=>{
   expect(dialog.type()).toBe('confirm');
   expect(dialog.message()).toBe('新規 次郎を休憩にしますか？');
   await dialog.dismiss();
  });
  await panel.getByRole('button',{name:'新規 次郎を休憩にする',exact:true}).click();
  await dismissRest;
  await expect(editedRow.getByRole('button',{name:'新規 次郎を休憩にする',exact:true})).toBeVisible();
  const acceptRest=page.waitForEvent('dialog').then(async dialog=>{await dialog.accept();});
  await panel.getByRole('button',{name:'新規 次郎を休憩にする',exact:true}).click();
  await acceptRest;
  await expect(panel.getByRole('status')).toContainText('新規 次郎を休憩にしました');
  await panel.getByRole('button',{name:'休憩中',exact:true}).click();
  await expect(panel.locator('.player')).toHaveCount(1);
  await expect(panel.locator('.player')).toContainText('新規 次郎');
  const dismissReturn=page.waitForEvent('dialog').then(async dialog=>{
   expect(dialog.message()).toBe('新規 次郎を復帰（待機中）にしますか？');
   await dialog.dismiss();
  });
  await panel.getByRole('button',{name:'新規 次郎を復帰にする',exact:true}).click();
  await dismissReturn;
  await expect(editedRow.getByRole('button',{name:'新規 次郎を復帰にする',exact:true})).toBeVisible();
  const acceptReturn=page.waitForEvent('dialog').then(async dialog=>{await dialog.accept();});
  await panel.getByRole('button',{name:'新規 次郎を復帰にする',exact:true}).click();
  await acceptReturn;
  await expect(panel.getByRole('status')).toContainText('新規 次郎を復帰（待機中）にしました');
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
