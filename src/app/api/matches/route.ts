import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {adminDb,requireAdmin} from "@/lib/firebase-admin";
import {applyMatchResult,assertStart,chooseMatch} from "@/lib/matching";
import type {State} from "@/lib/types";
const bodySchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("preview"),courtId:z.number().int().positive()}),
 z.object({action:z.literal("start"),courtId:z.number().int().positive(),playerIds:z.array(z.number().int()).length(4)}),
 z.object({action:z.literal("result"),courtId:z.number().int().positive(),scoreA:z.number().int(),scoreB:z.number().int()}),
 z.object({action:z.literal("cancel"),courtId:z.number().int().positive()})
]);
export async function POST(request:NextRequest){
 try{
  await requireAdmin(request.headers.get("authorization"));
  const body=bodySchema.parse(await request.json());
  const ref=adminDb().doc("system/current");
  if(body.action==="preview"){
   const snap=await ref.get();const state=snap.data() as State|undefined;
   if(!state)throw new Error("システムデータがありません");
   assertStart(state,body.courtId,chooseMatch(state).teamA.concat(chooseMatch(state).teamB).map(p=>p.id));
   return NextResponse.json({teams:chooseMatch(state)});
  }
  const result=await adminDb().runTransaction(async tx=>{
   const snap=await tx.get(ref);const state=snap.data() as State|undefined;
   if(!state)throw new Error("システムデータがありません");
   if(body.action==="start"){
    const teams=assertStart(state,body.courtId,body.playerIds);
    const players=state.players.map(p=>body.playerIds.includes(p.id)?{...p,status:"playing" as const}:p);
    const courts=state.courts.filter(c=>c.id!==body.courtId).concat({id:body.courtId,status:"playing" as const,teamA:teams.teamA,teamB:teams.teamB});
    const pairHistory=state.pairHistory.concat([{p1:teams.teamA[0].id,p2:teams.teamA[1].id},{p1:teams.teamB[0].id,p2:teams.teamB[1].id}]);
    tx.update(ref,{players,courts,pairHistory});return {ok:true};
   }
   if(body.action==="result"){
    const updated=applyMatchResult(state,body.courtId,body.scoreA,body.scoreB);
    tx.update(ref,{players:updated.players,courts:updated.courts,matchHistory:updated.matchHistory});return {ok:true};
   }
   const court=state.courts.find(c=>c.id===body.courtId&&c.status==="playing");
   if(!court?.teamA||!court.teamB)throw new Error("試合が見つかりません");
   const ids=new Set([...court.teamA,...court.teamB].map(p=>p.id));
   tx.update(ref,{courts:state.courts.map(c=>c.id===body.courtId?{id:c.id,status:"empty"}:c),players:state.players.map(p=>ids.has(p.id)?{...p,status:"waiting"}:p)});
   return {ok:true};
  });
  return NextResponse.json(result);
 }catch(error){
  const msg=error instanceof Error?error.message:"エラーが発生しました";
  const status=msg.includes("権限")||msg.includes("認証")?403:msg.includes("Firebase")||msg.includes("credential")?500:400;
  return NextResponse.json({error:msg},{status});
 }
}
