import {NextRequest,NextResponse} from 'next/server';
import {adminDb,requireAdmin} from '@/lib/firebase-admin';
import {applyPlayerAction,playerActionSchema} from '@/lib/players.mjs';
import type {State} from '@/lib/types';

export const runtime='nodejs';
export async function POST(request:NextRequest){
 try{await requireAdmin(request.headers.get('authorization'))}
 catch{return NextResponse.json({error:'管理者としてログインしてください'},{status:403})}
 try{
  const body=playerActionSchema.parse(await request.json());
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
