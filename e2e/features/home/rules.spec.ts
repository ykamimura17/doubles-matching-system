import {test,expect} from '@playwright/test';
test('ホームのルールを編集・キャンセル・保存できる',async({page})=>{
 await page.goto('/');
 const panel=page.getByRole('region',{name:'大会ルール'});
 await expect(panel).toContainText('負け：−1点');
 await panel.getByRole('button',{name:'ルールを編集'}).click();
 await panel.getByLabel('ルール説明',{exact:true}).fill('破棄する文章');
 await panel.getByRole('button',{name:'キャンセル',exact:true}).click();
 await expect(panel).not.toContainText('破棄する文章');
 await panel.getByRole('button',{name:'ルールを編集'}).click();
 await panel.getByLabel('ルール説明',{exact:true}).fill('4ゲーム固定\n勝利3pt・引分1pt・敗北0pt');
 await panel.getByRole('button',{name:'ルールを保存'}).click();
 await expect(panel.getByRole('status')).toHaveText('ルール説明を保存しました');
 await expect(panel.locator('.rules-description')).toHaveText('4ゲーム固定\n勝利3pt・引分1pt・敗北0pt');
 await panel.getByRole('button',{name:'ルールを編集'}).click();
 await expect(panel.getByLabel('ルール説明',{exact:true})).toHaveValue('4ゲーム固定\n勝利3pt・引分1pt・敗北0pt');
});
test('未認証のルール保存は拒否される',async({request})=>{
 const response=await request.post('/api/rules',{data:{rulesDescription:'書き換え'}});
 expect(response.status()).toBe(403);
});
