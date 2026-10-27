import {z} from 'zod';
export const rulesSchema=z.object({rulesDescription:z.string().max(5000,'ルール説明は5000文字以内で入力してください')}).strict();
export const defaultTournamentRules=`・4ゲーム固定（勝ち：3点／引分け：1点／負け：−1点）
・試合数の制限はなく、最終的な合計ポイントが多い人を優勝とします。
・同点の場合は、勝率→勝ち数→総取得ゲーム数→負け数（少ない順）で判定し、すべて同じ場合は同率順位とします。
・ペア固定なし。毎試合、別の方と組むようお願いします。同じペアでも対戦相手のペアが異なれば可とします。
・男性から女性にサーブを打つときは、1本のみとします。`;
