import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const {outputText}=ts.transpileModule(fs.readFileSync(new URL('../src/lib/matching.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {chooseMatch}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
const players=[1,2,3,4].map(id=>({id,name:`P${id}`,level:2,status:'waiting',point:0,matchCount:0,win:0,lose:0,draw:0}));
const key=teams=>[teams.teamA,teams.teamB].map(t=>t.map(p=>p.id).sort().join(',')).sort().join('|');
const match=pairHistory=>chooseMatch({players,pairHistory,courts:[],matchHistory:[],courtCount:1});
test('pairs older than the latest ten entries still affect matching',()=>{
 const recent=Array.from({length:10},()=>({p1:90,p2:91}));
 assert.equal(key(match(recent)),'1,2|3,4');
 assert.equal(key(match([{p1:2,p2:1},...recent])),'1,3|2,4');
});
test('all repeated pairs remain allowed and the least repeated pair pattern wins',()=>{
 const history=[...Array.from({length:3},()=>({p1:1,p2:2})),...Array.from({length:2},()=>({p1:1,p2:3})),{p1:1,p2:4}];
 assert.equal(key(match(history)),'1,4|2,3');
});
