// Shared by the dashboard, ranking and awards. Points remain the primary criterion.
export function rankPlayers(state){
 const names=new Map();
 for(const p of state.players)names.set(p.name,(names.get(p.name)??0)+1);
 const entries=state.players.map(player=>{
  let gamesWon=0;
  for(const m of state.matchHistory){
   const onA=m.teamAIds?m.teamAIds.includes(player.id):names.get(player.name)===1&&m.teamA.includes(player.name);
   const onB=m.teamBIds?m.teamBIds.includes(player.id):names.get(player.name)===1&&m.teamB.includes(player.name);
   if(onA)gamesWon+=m.scoreA;else if(onB)gamesWon+=m.scoreB;
  }
  return {...player,gamesWon};
 });
 const compare=(a,b)=>b.point-a.point||b.win*(a.matchCount||1)-a.win*(b.matchCount||1)||b.win-a.win||b.gamesWon-a.gamesWon||a.lose-b.lose;
 entries.sort(compare);
 return entries.map((p,i)=>({...p,rank:i&&compare(p,entries[i-1])===0?0:i+1})).map((p,i,all)=>{
  if(!p.rank){let j=i-1;while(j>=0&&!all[j].rank)j--;return {...p,rank:all[j].rank};}return p;
 });
}
