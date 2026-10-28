import type {State,Player} from "./types";
export function updateHistory(state:State,matchId:number,operation:"edit"|"delete",scoreA?:number,scoreB?:number):State{
 const match=state.matchHistory.find(m=>m.id===matchId);
 if(!match)throw Error("試合履歴が見つかりません");
 if(operation==="edit"&&(!Number.isInteger(scoreA)||!Number.isInteger(scoreB)||(scoreA??-1)<0||(scoreB??-1)<0||(scoreA??0)+(scoreB??0)!==4))throw Error("ゲーム数の合計は4にしてください");
 const members=[...match.teamA,...match.teamB];
 const ids=match.teamAIds&&match.teamBIds?[...match.teamAIds,...match.teamBIds]:null;
 if(ids){
  if(ids.length!==4||new Set(ids).size!==4||ids.some(id=>!state.players.some(p=>p.id===id)))throw Error("選手を一意に特定できないため編集できません");
 }else{
  if(new Set(members).size!==4)throw Error("同名選手が含まれる履歴は自動編集できません");
  if(members.some(name=>state.players.filter(p=>p.name===name).length!==1))throw Error("選手名を一意に特定できないため編集できません");
 }
 const contribution=(own:number,other:number)=>({win:Number(own>other),lose:Number(own<other),draw:Number(own===other),point:own>other?3:own===other?1:(match.lossPoint??0)});
 const players=state.players.map(p=>{
  const index=ids?ids.indexOf(p.id):members.indexOf(p.name);if(index<0)return p;
  const old=contribution(index<2?match.scoreA:match.scoreB,index<2?match.scoreB:match.scoreA);
  const next=operation==="edit"?contribution(index<2?scoreA!:scoreB!,index<2?scoreB!:scoreA!):{win:0,lose:0,draw:0,point:0};
  const updated:Player={...p,win:p.win-old.win+next.win,lose:p.lose-old.lose+next.lose,draw:p.draw-old.draw+next.draw,point:p.point-old.point+next.point,matchCount:p.matchCount-(operation==="delete"?1:0)};
  if([updated.win,updated.lose,updated.draw,updated.matchCount].some(n=>n<0))throw Error("戦績の整合性を確認できないため変更できません");
  return updated;
 });
 const matchHistory=operation==="delete"?state.matchHistory.filter(m=>m.id!==matchId):state.matchHistory.map(m=>m.id===matchId?{...m,scoreA:scoreA!,scoreB:scoreB!}:m);
 return {...state,players,matchHistory};
}

/** 全試合履歴・ペア履歴・集計戦績を大会開始前の状態に戻す。 */
export function resetMatchHistory(state:State):State{
 if(state.courts.some(c=>c.status==="playing")||state.players.some(p=>p.status==="playing"))throw Error("試合中のコート・選手がいるためリセットできません");
 return {...state,matchHistory:[],pairHistory:[],players:state.players.map(p=>({...p,point:0,matchCount:0,win:0,lose:0,draw:0}))};
}
