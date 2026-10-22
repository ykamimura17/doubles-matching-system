import {describe,it,expect} from "vitest";
import {updateHistory} from "./history";
import type {State,Player} from "./types";
const makePlayer=(id:number,name:string,win:number,lose:number):Player=>({id,name,level:2,status:"waiting",point:win*3,matchCount:win+lose,win,lose,draw:0});
const fixture=():State=>({players:[makePlayer(1,"A",1,0),makePlayer(2,"B",1,0),makePlayer(3,"C",0,1),makePlayer(4,"D",0,1)],courts:[],pairHistory:[],courtCount:3,matchHistory:[{id:10,date:"2026-10-23",courtId:1,teamA:["A","B"],teamB:["C","D"],scoreA:4,scoreB:0}]});
describe("history editing",()=>{
 it("recalculates wins and points on result reversal",()=>{const next=updateHistory(fixture(),10,"edit",0,4);expect(next.players[0]).toMatchObject({point:0,win:0,lose:1,matchCount:1});expect(next.players[2]).toMatchObject({point:3,win:1,lose:0,matchCount:1});expect(next.matchHistory[0]).toMatchObject({scoreA:0,scoreB:4})});
 it("removes result contributions on deletion",()=>{const next=updateHistory(fixture(),10,"delete");expect(next.matchHistory).toHaveLength(0);expect(next.players[0]).toMatchObject({point:0,win:0,matchCount:0})});
 it("rejects invalid score totals",()=>expect(()=>updateHistory(fixture(),10,"edit",4,4)).toThrow());
 it("rejects ambiguous player names",()=>{const state=fixture();state.players.push(makePlayer(5,"A",0,0));expect(()=>updateHistory(state,10,"delete")).toThrow()});
});
