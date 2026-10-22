import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {adminDb,requireAdmin} from "@/lib/firebase-admin";
import {updateHistory} from "@/lib/history";
import type {State} from "@/lib/types";
export const runtime="nodejs";
const schema=z.discriminatedUnion("action",[
 z.object({action:z.literal("edit"),matchId:z.number().int(),scoreA:z.number().int().min(0).max(4),scoreB:z.number().int().min(0).max(4)}),
 z.object({action:z.literal("delete"),matchId:z.number().int()})
]);
export async function POST(request:NextRequest){
 try{
  await requireAdmin(request.headers.get("authorization"));
  const input=schema.parse(await request.json());
  const ref=adminDb().doc("system/current");
  await adminDb().runTransaction(async tx=>{
   const snapshot=await tx.get(ref);
   if(!snapshot.exists)throw Error("システムデータがありません");
   const next=updateHistory(snapshot.data() as State,input.matchId,input.action,input.action==="edit"?input.scoreA:undefined,input.action==="edit"?input.scoreB:undefined);
   tx.update(ref,{players:next.players,matchHistory:next.matchHistory});
  });
  return NextResponse.json({ok:true});
 }catch(e){
  const message=e instanceof Error?e.message:"変更できませんでした";
  return NextResponse.json({error:message},{status:message.includes("認証")||message.includes("権限")?403:400});
 }
}
