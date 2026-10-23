"use client";
import {useState} from 'react';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import type {Player,PlayerStatus,State} from '@/lib/types';

const statusLabels:Record<PlayerStatus,string>={waiting:'待機中',playing:'試合中',rest:'休憩中'};
const levels:Record<number,string>={1:'初級',2:'中級',3:'上級'};
type Draft={name:string;level:number;status:'waiting'|'rest';comment:string};
const initialDraft:Draft={name:'',level:2,status:'waiting',comment:''};
export function PlayersPanel({state,admin,save}:{state:State;admin:boolean;save:(body:Record<string,unknown>)=>Promise<boolean>}){
 const pathname=usePathname();
 const router=useRouter();
 const isRegistration=pathname==='/players/new';
 const [filter,setFilter]=useState<'all'|PlayerStatus>('all');
 const [mode,setMode]=useState<'list'|'create'|'edit'|'status'|'courts'>('list');
 const [draft,setDraft]=useState<Draft>(initialDraft),[selected,setSelected]=useState(0);
 const [courtCount,setCourtCount]=useState(String(state.courtCount)),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[formError,setFormError]=useState('');
 const counts={all:state.players.length,waiting:state.players.filter(p=>p.status==='waiting').length,playing:state.players.filter(p=>p.status==='playing').length,rest:state.players.filter(p=>p.status==='rest').length};
 const players=state.players.filter(p=>filter==='all'||p.status===filter);
 const editable=state.players.filter(p=>p.status!=='playing');
 function open(next:typeof mode,p?:Player){
  setMode(next);setNotice('');setFormError('');
  setSelected(p?.id??editable[0]?.id??0);
  setDraft(p?{name:p.name,level:p.level,status:p.status==='rest'?'rest':'waiting',comment:p.comment??''}:initialDraft);
  setCourtCount(String(state.courtCount));
 }
 async function submit(e:React.FormEvent){
  e.preventDefault();setBusy(true);setNotice('');setFormError('');
  try{
   if(!['courts','status'].includes(mode)&&!draft.name.trim()){setFormError('名前を入力してください');return;}
   if(mode==='courts'&&(!/^(?:[1-9]|1[0-2])$/.test(courtCount))){setFormError('コート数は1〜12の整数で入力してください');return;}
   const body=mode==='courts'?{action:'courts',courtCount:Number(courtCount)}:mode==='status'?{action:'status',id:selected,status:draft.status}:mode==='edit'?{action:'edit',id:selected,...draft}:{action:'create',...draft};
   if(await save(body)){setMode('list');setNotice(mode==='create'?'選手を登録しました':'変更を保存しました');setDraft(initialDraft);if(isRegistration)router.push('/players?registered=1');}
  }finally{setBusy(false)}
 }
 return isRegistration?<section className="player-registration-page" aria-labelledby="registration-title"><div className="registration-topline"><Link href="/players">← プレイヤー一覧へ戻る</Link><span>PLAYER REGISTRATION</span></div><header className="registration-header"><span className="admin-badge">管理者向け</span><h1 id="registration-title">プレイヤー登録</h1><p>練習会に参加する選手の基本情報と初期ステータスを設定します。</p></header>{!admin?<div className="registration-restricted"><h2>管理者ログインが必要です</h2><p>選手登録は管理者のみ利用できます。</p><Link className="primary-link" href="/login">管理者ログインへ</Link></div>:<div className="registration-layout"><div className="registration-form-card"><h2>選手情報</h2><form onSubmit={submit}><label>プレイヤー名 <span>必須</span><input autoFocus maxLength={50} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="例）田中 一郎" required/></label><label>レベル <span>必須</span><select value={draft.level} onChange={e=>setDraft({...draft,level:Number(e.target.value)})}>{[1,2,3].map(level=><option key={level} value={level}>{levels[level]}</option>)}</select></label><label>参加ステータス<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as Draft['status']})}><option value="waiting">待機中</option><option value="rest">休憩中</option></select></label><label>コメント <small>任意</small><textarea rows={4} maxLength={300} value={draft.comment} onChange={e=>setDraft({...draft,comment:e.target.value})} placeholder="プレーの特徴、備考など"/></label>{formError&&<p role="alert">{formError}</p>}<div className="registration-actions"><button disabled={busy} type="submit">{busy?'登録中…':'プレイヤーを登録する →'}</button><Link href="/players">キャンセル</Link></div></form></div><aside className="registration-guide"><h2>登録ガイド</h2><p>レベルは自動マッチングのチームバランス調整に使用します。</p><div><strong>上級</strong><span>300</span></div><div><strong>中級</strong><span>200</span></div><div><strong>初級</strong><span>100</span></div><p>待機中の選手は次のマッチング候補になります。休憩中の選手は候補から除外されます。</p></aside></div>}</section>:<section id="players" className="players-panel" aria-labelledby="players-heading">
  <header className="players-heading"><span className="players-emblem" aria-hidden="true">●</span><div><h2 id="players-heading">プレイヤー一覧</h2><p>参加者 {state.players.length} 名 ・ リアルタイム更新</p></div></header>
  <div className="players-overview">{(['all','waiting','playing','rest'] as const).map(key=><div key={key} className={key==='rest'?'rest-metric':''}><span>{key==='all'?'参加者':statusLabels[key]}</span><strong>{String(counts[key]).padStart(2,'0')}</strong></div>)}</div>
  <div className="players-filters" aria-label="状態で絞り込み">{(['all','waiting','playing','rest'] as const).map(key=><button key={key} type="button" aria-pressed={filter===key} onClick={()=>setFilter(key)}>{key==='all'?'すべて':statusLabels[key]}</button>)}</div>
  <h3 className="players-mobile-title">選手と参加状況 <small>・ 戦績：勝/負/分</small></h3>
  <div className="players-table" role="table" aria-label="選手一覧">
   <div className="players-table-head" role="row">{['プレイヤー','レベル','状態','ポイント（勝/負/分）','試合数',...(admin?['操作']:[])].map(label=><span key={label} role="columnheader">{label}</span>)}</div>
   {players.map(p=><div className="player player-row" role="row" key={p.id}>
    <div role="cell" className="player-identity"><span className="player-avatar" aria-hidden="true">{Array.from(p.name)[0]}</span><div><strong>{p.name}</strong><small className="mobile-player-detail">{levels[p.level]} ・ {statusLabels[p.status]}</small>{p.comment&&<small className="player-comment">{p.comment}</small>}</div></div>
    <span role="cell" className="desktop-player-detail">{levels[p.level]}</span><span role="cell" className="desktop-player-detail">{statusLabels[p.status]}</span>
    <div role="cell" className="player-record"><strong>{p.point} pt</strong><small>{p.win}/{p.lose}/{p.draw}</small></div><span role="cell" className="player-match-count">{p.matchCount}<span className="mobile-match-label"> 試合</span></span>
    {admin&&<div role="cell" className="player-controls"><button type="button" className="secondary" disabled={p.status==='playing'||busy} onClick={()=>open('edit',p)} aria-label={`${p.name}を編集`}>編集</button><button type="button" className="secondary" disabled={p.status==='playing'||busy} onClick={()=>{open('status',p);setDraft({...initialDraft,status:p.status==='rest'?'waiting':'rest'})}} aria-label={`${p.name}を${p.status==='rest'?'復帰':'休憩'}にする`}>{p.status==='rest'?'復帰':'休憩'}</button></div>}
   </div>)}
   {!players.length&&<div className="players-empty">{state.players.length?'該当する選手はいません':'選手がまだ登録されていません'}{admin&&!state.players.length&&<p>プレイヤー登録から参加者を追加してください。</p>}</div>}
  </div>
  {admin&&<div className="players-admin-actions"><Link className="players-register-link" href="/players/new">＋ プレイヤー登録</Link><button type="button" className="secondary" disabled={!editable.length} onClick={()=>open('status')}>ステータス変更</button><button type="button" className="secondary" onClick={()=>open('courts')}>コート数設定</button></div>}
  {notice&&<p className="players-notice" role="status">{notice}</p>}
  {admin&&mode!=='list'&&<div className="player-editor"><div className="player-editor-heading"><div><span className="admin-badge">管理者モード</span><h3>{mode==='create'?'プレイヤーを登録':mode==='edit'?'選手編集':mode==='status'?'ステータス変更':'コート数設定'}</h3></div><button type="button" className="secondary" disabled={busy} onClick={()=>setMode('list')}>閉じる</button></div>
   <form onSubmit={submit}>
    {mode==='status'?<><label>選手<select aria-label="選手" value={selected} onChange={e=>setSelected(Number(e.target.value))} required>{editable.map(p=><option key={p.id} value={p.id}>{p.name}（{statusLabels[p.status]}）</option>)}</select></label><label>変更後の状態<select aria-label="ステータス" value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as Draft['status']})}><option value="waiting">待機中</option><option value="rest">休憩中</option></select></label></>:mode==='courts'?<label>コート数<input aria-label="コート数" type="number" min="1" max="12" value={courtCount} onChange={e=>setCourtCount(e.target.value)} required/><small>試合中のコートは減らせません。</small></label>:<>
     <label>名前<input autoFocus maxLength={50} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="例）田中 一郎" required/></label>
     <label>レベル<select aria-label="レベル" value={draft.level} onChange={e=>setDraft({...draft,level:Number(e.target.value)})}>{[1,2,3].map(level=><option value={level} key={level}>{levels[level]}</option>)}</select></label>
     <label>{mode==='create'?'初期ステータス':'ステータス'}<select aria-label="ステータス" value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as Draft['status']})}><option value="waiting">待機中</option><option value="rest">休憩中</option></select></label>
     <label>コメント<input maxLength={300} value={draft.comment} onChange={e=>setDraft({...draft,comment:e.target.value})} placeholder="備考（任意）"/></label></>}
    {formError&&<p role="alert">{formError}</p>}<button disabled={busy} type="submit">{busy?'保存中…':mode==='create'?'選手を登録する':'変更を保存'}</button>
   </form>
  </div>}
 </section>;
}
