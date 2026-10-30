import {NextRequest,NextResponse} from 'next/server';
import {adminDb,requireAdmin,requireUser} from '@/lib/firebase-admin';
import {applyPlayerAction,playerActionSchema} from '@/lib/players.mjs';
import type {State} from '@/lib/types';

export const runtime='nodejs';
export async function POST(request:NextRequest){
 let body;
 try{body=playerActionSchema.parse(await request.json());}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:'入力内容を確認してください'},{status:400});}
 try{
  const header=request.headers.get('authorization');
  if(body.action==='status')await requireUser(header);
  else await requireAdmin(header);
 }catch{return NextResponse.json({error:body.action==='status'?'参加者認証を確認してください':'管理者としてログインしてください'},{status:403})}
 try{
  const db=adminDb(),ref=db.doc('system/current');
  await db.runTransaction(async tx=>{
   const snap=await tx.get(ref);
   if(!snap.exists)throw Error('システムデータがありません');
   const next=applyPlayerAction(snap.data() as State,body);
   tx.update(ref,body.action==='courts'?{courtCount:next.courtCount}:{players:next.players});
  });
  return NextResponse.json({ok:true});
 }catch(error){
  const message=error instanceof Error?error.message:'保存できませんでした';
  return NextResponse.json({error:message},{status:400});
 }
}
