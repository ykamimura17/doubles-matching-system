import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import {applyPlayerAction,playerActionSchema} from "../src/lib/players.mjs";

function setup(token="participant"){
 let state={players:[
  {id:1,name:"待機選手",level:2,status:"waiting",point:3,matchCount:1,win:1,lose:0,draw:0},
  {id:2,name:"試合中選手",status:"playing"},
  {id:3,name:"コート上の選手",status:"waiting"}
 ],courts:[{id:1,status:"playing",teamA:[{id:2},{id:3}],teamB:[]}],courtCount:3};
 let writes=0,reads=0;
 const ref={};
 const db={doc:()=>ref,runTransaction:async operation=>operation({
  get:async()=>{reads++;return {exists:true,data:()=>state};},
  update:(_ref,changes)=>{writes++;state={...state,...changes};}
 })};
 const authenticate=async header=>{
  if(!["Bearer participant","Bearer member","Bearer admin"].includes(header))throw Error("認証が必要です");
 };
 const imports={
  "next/server":{NextResponse:{json:(data,options)=>({data,status:options?.status??200})}},
  "@/lib/firebase-admin":{adminDb:()=>db,requireUser:authenticate,requireAdmin:async header=>{
   await authenticate(header);if(header!=="Bearer admin")throw Error("管理者権限が必要です");
  }},
  "@/lib/players.mjs":{applyPlayerAction,playerActionSchema}
 };
 const exports={};
 const source=fs.readFileSync(new URL("../src/app/api/players/route.ts",import.meta.url),"utf8");
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 vm.runInNewContext(outputText,{exports,Error,require:name=>{assert.ok(name in imports);return imports[name];}});
 return {post:body=>exports.POST({headers:{get:()=>token===null?null:"Bearer "+token},json:async()=>body}),get state(){return state;},get writes(){return writes;},get reads(){return reads;}};
}
test("anonymous participants and regular users can rest and return without changing records",async()=>{
 for(const token of ["participant","member","admin"]){
  const api=setup(token),original={...api.state.players[0]};
  assert.equal((await api.post({action:"status",id:1,status:"rest"})).status,200);
  assert.equal(api.state.players[0].status,"rest");
  assert.equal((await api.post({action:"status",id:1,status:"waiting"})).status,200);
  assert.deepEqual(api.state.players[0],original);
 }
});
test("participants cannot create or edit players or change the court count",async()=>{
 for(const action of [
  {action:"create",name:"新規",level:2,status:"waiting"},
  {action:"edit",id:1,name:"変更",level:3,status:"rest"},
  {action:"courts",courtCount:4}
 ]){
  const api=setup();
  assert.equal((await api.post(action)).status,403);
  assert.equal(api.reads,0);assert.equal(api.writes,0);
  assert.equal((await setup("admin").post(action)).status,200);
 }
});
test("missing and invalid credentials cannot change status",async()=>{
 for(const token of [null,"invalid"]){
  const api=setup(token);
  assert.equal((await api.post({action:"status",id:1,status:"rest"})).status,403);
  assert.equal(api.reads,0);assert.equal(api.writes,0);
 }
});
test("playing or occupied players and extra fields cannot be changed through status requests",async()=>{
 for(const body of [
  {action:"status",id:2,status:"rest"},
  {action:"status",id:3,status:"rest"},
  {action:"status",id:1,status:"playing"},
  {action:"status",id:1,status:"rest",point:999},
  {action:"status",id:1,status:"rest",name:"変更"}
 ]){
  const api=setup();
  assert.equal((await api.post(body)).status,400);
  assert.equal(api.writes,0);
 }
});
