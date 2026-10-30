import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import {z} from "zod";

function loadTs(path,imports){
 const source=fs.readFileSync(new URL(path,import.meta.url),"utf8");
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const exports={};
 vm.runInNewContext(outputText,{exports,require:name=>{
  if(!(name in imports))throw Error("Unexpected import: "+name);
  return imports[name];
 },Error,process:{env:{FIREBASE_PROJECT_ID:"tennis-club-system"}}});
 return exports;
}
function setup(token="participant"){
 const calls=[];
 const claims={
  participant:{uid:"guest",firebase:{sign_in_provider:"anonymous"}},
  member:{uid:"member",firebase:{sign_in_provider:"password"}},
  admin:{uid:"admin",admin:true,firebase:{sign_in_provider:"password"}}
 };
 const players=[1,2,3,4].map(id=>({id,name:"P"+id,status:"waiting"}));
 const state={players,courts:[{id:1,status:"playing",teamA:players.slice(0,2),teamB:players.slice(2)}],pairHistory:[],matchHistory:[]};
 const ref={get:async()=>({data:()=>state})};
 const db={doc:()=>{calls.push("db");return ref;},runTransaction:async operation=>operation({
  get:async()=>({data:()=>state}),update:(_ref,data)=>calls.push(data)
 })};
 const auth=loadTs("../src/lib/firebase-admin.ts",{
  "server-only":{},
  "firebase-admin/app":{getApps:()=>[{options:{projectId:"tennis-club-system"}}]},
  "./firebase-service-account.mjs":{},
  "firebase-admin/firestore":{getFirestore:()=>db},
  "firebase-admin/auth":{getAuth:()=>({verifyIdToken:async(value,checkRevoked)=>{
   assert.equal(checkRevoked,true);
   if(!claims[value])throw Error("invalid token");
   return claims[value];
  }})}
 });
 const route=loadTs("../src/app/api/matches/route.ts",{
  "next/server":{NextResponse:{json:(data,options)=>({data,status:options?.status??200})}},
  zod:{z},
  "@/lib/firebase-admin":auth,
  "@/lib/matching":{
   chooseMatch:()=>({teamA:players.slice(0,2),teamB:players.slice(2)}),
   assertStart:()=>({teamA:players.slice(0,2),teamB:players.slice(2)}),
   applyMatchResult:()=>state
  }
 });
 return {auth,calls,post:body=>route.POST({headers:{get:()=>token===null?null:"Bearer "+token},json:async()=>body})};
}

test("anonymous and regular authenticated users can preview, start and register results",async()=>{
 for(const token of ["participant","member","admin"]){
  for(const body of [
   {action:"preview",courtId:1},
   {action:"start",courtId:1,playerIds:[1,2,3,4]},
   {action:"result",courtId:1,scoreA:4,scoreB:0}
  ]){
   const {post,calls}=setup(token);
   assert.equal((await post(body)).status,200);
   assert.ok(calls.includes("db"));
  }
 }
});
test("missing, invalid and revoked tokens cannot reach match data",async()=>{
 for(const token of [null,"invalid","revoked"]){
  for(const action of ["preview","start","result","cancel"]){
   const {post,calls}=setup(token);
   assert.equal((await post({action,courtId:1,playerIds:[1,2,3,4],scoreA:4,scoreB:0})).status,403);
   assert.equal(calls.length,0);
  }
 }
});
test("cancelling a match remains restricted to non-anonymous administrators",async()=>{
 for(const token of ["participant","member"]){
  const {post,calls}=setup(token);
  assert.equal((await post({action:"cancel",courtId:1})).status,403);
  assert.equal(calls.length,0);
 }
 assert.equal((await setup("admin").post({action:"cancel",courtId:1})).status,200);
});
test("requireAdmin still protects the other management APIs",async()=>{
 const {auth}=setup();
 await assert.rejects(auth.requireAdmin("Bearer participant"),/管理者権限/);
 await assert.rejects(auth.requireAdmin("Bearer member"),/管理者権限/);
 assert.equal((await auth.requireAdmin("Bearer admin")).uid,"admin");
});
