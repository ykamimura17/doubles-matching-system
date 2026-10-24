import {z} from 'zod';
export const rulesSchema=z.object({rulesDescription:z.string().max(5000,'ルール説明は5000文字以内で入力してください')}).strict();
