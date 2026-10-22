import {z} from 'zod';

const fields = {
 name:z.string().trim().min(1,'名前を入力してください').max(50),
 level:z.number().int().min(1).max(3),
 status:z.enum(['waiting','rest']),
 comment:z.string().trim().max(300).default('')
};
export const playerActionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('create'),...fields}).strict(),
 z.object({action:z.literal('edit'),id:z.number().int().positive(),...fields}).strict(),
 z.object({action:z.literal('status'),id:z.number().int().positive(),status:fields.status}).strict(),
 z.object({action:z.literal('courts'),courtCount:z.number().int().min(1).max(12)}).strict()
]);

/** @param {import('./types').State} state @param {unknown} input */
export function applyPlayerAction(state,input){
 const body=playerActionSchema.parse(input);
 if(body.action==='courts'){
  if(state.courts.some(c=>c.status==='playing'&&c.id>body.courtCount))throw Error('試合中のコートを減らすことはできません');
  return {...state,courtCount:body.courtCount};
 }
 if(body.action==='create'){
  const id=Math.max(0,...state.players.map(p=>p.id))+1;
  return {...state,players:[...state.players,{id,name:body.name,level:body.level,status:body.status,comment:body.comment,point:0,matchCount:0,win:0,lose:0,draw:0}]};
 }
 const player=state.players.find(p=>p.id===body.id);
 if(!player)throw Error('選手が見つかりません');
 const onCourt=state.courts.some(c=>c.status==='playing'&&[...(c.teamA??[]),...(c.teamB??[])].some(p=>p.id===player.id));
 if(player.status==='playing'||onCourt)throw Error('試合中の選手は結果登録または取消後に変更してください');
 const changes=body.action==='edit'?{name:body.name,level:body.level,status:body.status,comment:body.comment}:{status:body.status};
 return {...state,players:state.players.map(p=>p.id===body.id?{...p,...changes}:p)};
}
