import {NextRequest,NextResponse} from 'next/server';
import {adminDb,requireAdmin} from '@/lib/firebase-admin';
import {rulesSchema} from '@/lib/rules.mjs';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 try{await requireAdmin(request.headers.get('authorization'))}
 catch{return NextResponse.json({error:'管理者としてログインしてください'},{status:403})}
 try{
  const body=rulesSchema.parse(await request.json());
  await adminDb().doc('system/current').update({rulesDescription:body.rulesDescription});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'保存できませんでした。説明文は5000文字以内で入力してください。'},{status:400})}
}
