import type {Player,State} from "../types";
import {applyMatchResult,assertStart,chooseMatch} from "../matching";

/**
 * Playwright専用の固定シナリオ。
 * 開発サーバーで NEXT_PUBLIC_E2E_MODE=true の場合だけ画面から利用する。
 * Firebase SDK・本番API・実データには一切アクセスしない。
 */
function player(id:number,name:string,point:number,status:Player["status"]="waiting"):Player{
 return {id,name,level:2,status,point,matchCount:point===0?0:2,win:point===0?0:Math.floor(point/3),lose:0,draw:0};
}
export function createScenarioState():State{
 const players=[
  player(1,"田中",9,"playing"),player(2,"山本",6,"playing"),
  player(3,"佐藤",3,"playing"),player(4,"安村",1,"playing"),
  player(5,"森田",0),player(6,"山下",0),player(7,"吉田",0),player(8,"中野",0)
 ];
 return {players,courts:[{id:1,status:"playing",teamA:[players[0],players[1]],teamB:[players[2],players[3]]}],matchHistory:[{id:100,date:"2026-10-22",courtId:3,teamA:["田中","山本"],teamB:["佐藤","安村"],scoreA:4,scoreB:0}],pairHistory:[],courtCount:3};
}
type ActionResult={state?:State;response:Record<string,unknown>};
export function performScenarioAction(state:State,input:Record<string,unknown>):ActionResult{
 const action=input.action;
 const courtId=Number(input.courtId);
 if(action==="preview"){
  const teams=chooseMatch(state);
  assertStart(state,courtId,[...teams.teamA,...teams.teamB].map(p=>p.id));
  return {response:{teams}};
 }
 if(action==="start"){
  const ids=input.playerIds;
  if(!Array.isArray(ids)||!ids.every(x=>typeof x==="number"))throw Error("選手の選択が不正です");
  const teams=assertStart(state,courtId,ids);
  const players=state.players.map(p=>ids.includes(p.id)?{...p,status:"playing" as const}:p);
  const courts=state.courts.filter(c=>c.id!==courtId).concat({id:courtId,status:"playing" as const,teamA:teams.teamA,teamB:teams.teamB});
  const pairHistory=[...state.pairHistory,{p1:teams.teamA[0].id,p2:teams.teamA[1].id},{p1:teams.teamB[0].id,p2:teams.teamB[1].id}];
  return {state:{...state,players,courts,pairHistory},response:{ok:true}};
 }
 if(action==="result"){
  const scoreA=Number(input.scoreA),scoreB=Number(input.scoreB);
  return {state:applyMatchResult(state,courtId,scoreA,scoreB),response:{ok:true}};
 }
 if(action==="cancel"){
  const court=state.courts.find(c=>c.id===courtId&&c.status==="playing");
  if(!court?.teamA||!court.teamB)throw Error("試合が見つかりません");
  const ids=new Set([...court.teamA,...court.teamB].map(p=>p.id));
  return {state:{...state,courts:state.courts.map(c=>c.id===courtId?{id:c.id,status:"empty" as const}:c),players:state.players.map(p=>ids.has(p.id)?{...p,status:"waiting" as const}:p)},response:{ok:true}};
 }
 throw Error("対応していない操作です");
}
