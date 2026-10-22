import test from 'node:test';
import assert from 'node:assert/strict';
import {applyPlayerAction} from '../src/lib/players.mjs';
const empty=()=>({players:[],courts:[],pairHistory:[],matchHistory:[],courtCount:3});
const create={action:'create',name:'  田中 一郎  ',level:2,status:'waiting',comment:''};
test('registration creates unique IDs with zero records and preserves existing state',()=>{
 const first=applyPlayerAction(empty(),create);
 const next=applyPlayerAction(first,{...create,name:'山本'});
 assert.deepEqual(next.players.map(p=>p.id),[1,2]);
 assert.equal(next.players[0].name,'田中 一郎');
 assert.equal(next.players[0].matchCount,0);assert.equal(first.players.length,1);
});
test('editing and rest/return preserve scores and history',()=>{
 const state=applyPlayerAction(empty(),create);state.players[0].point=9;state.players[0].win=3;
 const edited=applyPlayerAction(state,{...create,action:'edit',id:1,name:'田中',comment:'備考',status:'rest'});
 const returned=applyPlayerAction(edited,{action:'status',id:1,status:'waiting'});
 assert.equal(returned.players[0].point,9);assert.equal(returned.players[0].win,3);
 assert.equal(returned.players[0].comment,'備考');assert.equal(returned.players[0].status,'waiting');
 assert.deepEqual(returned.matchHistory,state.matchHistory);
});
test('playing players and occupied courts cannot be modified by player management',()=>{
 const state=applyPlayerAction(empty(),create);
 state.courts=[{id:3,status:'playing',teamA:[state.players[0]],teamB:[]}];
 assert.throws(()=>applyPlayerAction(state,{action:'status',id:1,status:'rest'}),/試合中/);
 assert.throws(()=>applyPlayerAction(state,{action:'courts',courtCount:2}),/試合中/);
 assert.equal(applyPlayerAction(state,{action:'courts',courtCount:4}).courtCount,4);
});
test('registration cannot set points, playing status or invalid names',()=>{
 for(const body of [{...create,name:' '},{...create,status:'playing'},{...create,point:999},{...create,level:4}])assert.throws(()=>applyPlayerAction(empty(),body));
});
