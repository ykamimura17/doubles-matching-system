import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {rankPlayers} from '../src/lib/ranking.mjs';
async function loadTs(path){const source=fs.readFileSync(new URL(path,import.meta.url),'utf8');const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});return import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));}
const {applyMatchResult}=await loadTs('../src/lib/matching.ts');
const {updateHistory,resetMatchHistory}=await loadTs('../src/lib/history.ts');
const player=(id,extra={})=>({id,name:`P${id}`,level:2,status:'waiting',point:0,matchCount:0,win:0,lose:0,draw:0,...extra});
function state(){const players=[1,2,3,4].map(id=>player(id,{status:'playing'}));return {players,courtCount:1,courts:[{id:1,status:'playing',teamA:players.slice(0,2),teamB:players.slice(2)}],matchHistory:[],pairHistory:[]};}
test('new results award 3/1/-1 and history edits/deletes permit negative points',()=>{
 const won=applyMatchResult(state(),1,3,1),id=won.matchHistory[0].id;
 assert.deepEqual(won.players.map(p=>p.point),[3,3,-1,-1]);
 assert.equal(won.matchHistory[0].lossPoint,-1);
 const reversed=updateHistory(won,id,'edit',0,4);
 assert.deepEqual(reversed.players.map(p=>p.point),[-1,-1,3,3]);
 assert.deepEqual(updateHistory(reversed,id,'delete').players.map(p=>p.point),[0,0,0,0]);
 const draw=updateHistory(won,id,'edit',2,2);
 assert.deepEqual(draw.players.map(p=>p.point),[1,1,1,1]);
});
test('legacy history keeps its original zero-loss scoring when removed',()=>{
 const old=applyMatchResult(state(),1,4,0);delete old.matchHistory[0].lossPoint;
 old.players[2].point=old.players[3].point=0;
 assert.deepEqual(updateHistory(old,old.matchHistory[0].id,'delete').players.map(p=>p.point),[0,0,0,0]);
});
test('ranking compares points, exact win rate, wins, games and fewer losses in order',()=>{
 function order(a,b,history=[]){return rankPlayers({players:[a,b],matchHistory:history}).map(p=>p.id);}
 assert.deepEqual(order(player(1,{point:2}),player(2,{point:1,win:5,matchCount:5})),[1,2]);
 assert.deepEqual(order(player(1,{win:1,matchCount:2}),player(2,{win:2,matchCount:5})),[1,2]);
 assert.deepEqual(order(player(1,{win:2,matchCount:4}),player(2,{win:1,matchCount:2})),[1,2]);
 assert.deepEqual(order(player(2),player(1),[{teamA:['P1'],teamB:['P2'],scoreA:3,scoreB:1}]),[1,2]);
 assert.deepEqual(order(player(2,{lose:2}),player(1,{lose:1})),[1,2]);
});
test('ties use competition ranks and include all tied award places',()=>{
 const ranks=rankPlayers({players:[player(1,{point:3}),player(2,{point:3}),player(3,{point:3}),player(4,{point:-1})],matchHistory:[]});
 assert.deepEqual(ranks.map(p=>p.rank),[1,1,1,4]);
});
test('game totals use IDs after renaming and reflect edited/deleted history',()=>{
 const s=applyMatchResult(state(),1,3,1);s.players[0].name='renamed';
 assert.equal(rankPlayers(s).find(p=>p.id===1).gamesWon,3);
 assert.equal(rankPlayers(updateHistory(s,s.matchHistory[0].id,'edit',2,2)).find(p=>p.id===1).gamesWon,2);
 assert.equal(rankPlayers(updateHistory(s,s.matchHistory[0].id,'delete')).find(p=>p.id===1).gamesWon,0);
});

test('admin history reset removes matches, pairs, and all player results while keeping metadata',()=>{
 const s=applyMatchResult(state(),1,3,1);
 s.pairHistory=[{p1:1,p2:2},{p1:3,p2:4}];
 s.players[0].status='rest';
 const reset=resetMatchHistory(s);
 assert.deepEqual(reset.matchHistory,[]);
 assert.deepEqual(reset.pairHistory,[]);
 assert.deepEqual(reset.players.map(p=>[p.point,p.matchCount,p.win,p.lose,p.draw]),Array.from({length:4},()=>[0,0,0,0,0]));
 assert.equal(reset.players[0].status,'rest');
 assert.deepEqual(reset.courts,s.courts);
 assert.equal(reset.courtCount,1);
 assert.deepEqual(s.matchHistory.length,1);
 assert.equal(s.pairHistory.length,2);
});
test('history reset rejects active courts and playing players without modifying data',()=>{
 const s=state();
 assert.throws(()=>resetMatchHistory(s),/試合中/);
 const onlyPlaying={...s,courts:[{id:1,status:'empty'}]};
 assert.throws(()=>resetMatchHistory(onlyPlaying),/試合中/);
});
