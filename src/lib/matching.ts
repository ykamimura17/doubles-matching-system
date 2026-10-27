import type {Player,State} from "./types";
export type Teams = {teamA:Player[];teamB:Player[]};
const rating=(p:Player)=>p.level*100+p.point*10;
export function chooseMatch(state:State):Teams {
 const waiting=state.players.filter(p=>p.status==="waiting").sort((a,b)=>a.matchCount-b.matchCount||rating(b)-rating(a)).slice(0,4);
 if(waiting.length!==4)throw Error("待機中の選手が4名必要です");
 const [a,b,c,d]=waiting;
 const patterns:Teams[]=[{teamA:[a,b],teamB:[c,d]},{teamA:[a,c],teamB:[b,d]},{teamA:[a,d],teamB:[b,c]}];
 const repeat=(x:Player,y:Player)=>state.pairHistory.filter(p=>(p.p1===x.id&&p.p2===y.id)||(p.p1===y.id&&p.p2===x.id)).length;
 const score=(teams:Teams)=>Math.abs(teams.teamA.reduce((s,p)=>s+rating(p),0)-teams.teamB.reduce((s,p)=>s+rating(p),0))+1000*(repeat(teams.teamA[0],teams.teamA[1])+repeat(teams.teamB[0],teams.teamB[1]));
 return patterns.sort((x,y)=>score(x)-score(y))[0];
}
export function assertStart(state:State,courtId:number,ids:number[]):Teams{
 if(!Number.isInteger(courtId)||courtId<1||courtId>state.courtCount)throw Error("無効なコートです");
 if(state.courts.some(c=>c.id===courtId&&c.status==="playing"))throw Error("このコートは試合中です");
 if(ids.length!==4||new Set(ids).size!==4)throw Error("重複しない選手4名を選択してください");
 const people=ids.map(id=>state.players.find(p=>p.id===id&&p.status==="waiting"));
 if(people.some(p=>!p))throw Error("待機中の選手のみ選択できます");
 return {teamA:people.slice(0,2) as Player[],teamB:people.slice(2) as Player[]};
}
export function applyMatchResult(state:State,courtId:number,scoreA:number,scoreB:number):State{
 if(!Number.isInteger(scoreA)||!Number.isInteger(scoreB)||scoreA<0||scoreB<0||scoreA>4||scoreB>4||scoreA+scoreB!==4)throw Error("ゲーム数の合計は4にしてください");
 const court=state.courts.find(c=>c.id===courtId&&c.status==="playing");
 if(!court?.teamA||!court.teamB)throw Error("試合が見つかりません");
 const teamA=court.teamA.map(p=>p.id),teamB=court.teamB.map(p=>p.id);
 const updated=state.players.map(p=>{
  if(![...teamA,...teamB].includes(p.id))return p;
  const onA=teamA.includes(p.id),own=onA?scoreA:scoreB,other=onA?scoreB:scoreA;
  return {...p,status:"waiting" as const,matchCount:p.matchCount+1,win:p.win+Number(own>other),lose:p.lose+Number(own<other),draw:p.draw+Number(own===other),point:p.point+(own>other?3:own===other?1:-1)};
 });
 return {...state,players:updated,courts:state.courts.map(c=>c.id===courtId?{id:c.id,status:"empty" as const}:c),matchHistory:[{id:Date.now(),date:new Date().toISOString(),courtId,lossPoint:-1,teamAIds:teamA,teamBIds:teamB,teamA:court.teamA.map(p=>p.name),teamB:court.teamB.map(p=>p.name),scoreA,scoreB},...state.matchHistory]};
}
