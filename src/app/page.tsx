"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {onAuthStateChanged,signInAnonymously,signInWithEmailAndPassword,signOut,type User} from "firebase/auth";
import {doc,onSnapshot} from "firebase/firestore";
import {getFirebase} from "@/lib/firebase-client";
import {PlayersPanel} from "@/components/PlayersPanel";
import {applyPlayerAction} from "@/lib/players.mjs";
import {CourtCard} from "@/components/CourtCard";
import type {Player,State} from "@/lib/types";
import {emptyState} from "@/lib/types";
import {createScenarioState,performScenarioAction} from "@/lib/e2e/scenario";
const e2eMode=process.env.NODE_ENV==="development" && process.env.NEXT_PUBLIC_E2E_MODE==="true";
type Mode="menu"|"manual"|"preview"|"score";
export default function Home(){
 const pathname=usePathname();
 const showCourts=pathname==="/courts";
 const showPlayers=pathname==="/players";
 const showRanking=pathname==="/ranking";
 const showHistory=pathname==="/history";
 const showHome=pathname==="/";
 const [state,setState]=useState<State>(emptyState),[error,setError]=useState(""),[user,setUser]=useState<User|null>(null),[admin,setAdmin]=useState(false),[email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [selected,setSelected]=useState<number|null>(null),[mode,setMode]=useState<Mode>("menu"),[ids,setIds]=useState<number[]>([0,0,0,0]),[scores,setScores]=useState([0,4]),[loading,setLoading]=useState(false);
 useEffect(()=>{if(e2eMode){setState(createScenarioState());setAdmin(true);return;}try{const {auth,db}=getFirebase();const stopAuth=onAuthStateChanged(auth,async u=>{
  if(!u){setUser(null);setAdmin(false);try{await signInAnonymously(auth)}catch(e){setError(e instanceof Error?e.message:"参加者認証に失敗しました")}return}
  setUser(u);try{setAdmin(!u.isAnonymous&&Boolean((await u.getIdTokenResult(true)).claims.admin))}catch(e){setAdmin(false);setError(e instanceof Error?e.message:"権限の確認に失敗しました")}
 });return stopAuth}catch(e){setError(e instanceof Error?e.message:"Firebase設定を確認してください")}},[]);
 // Permission-denied listeners do not recover after anonymous sign-in.
 // Start only after auth resolves, and replace the listener when the user changes.
 useEffect(()=>{
  if(e2eMode)return;
  if(!user){setState(emptyState);return;}
  try{
   const {db}=getFirebase();
   setError("");
   return onSnapshot(doc(db,"system","current"),snapshot=>{
    setState(snapshot.exists()?{...emptyState,...snapshot.data()} as State:emptyState);
   },e=>setError(e.message));
  }catch(e){setError(e instanceof Error?e.message:"Firebase設定を確認してください")}
 },[user]);
 const active=useMemo(()=>state.courts.filter(c=>c.status==="playing"),[state.courts]);
 const waiting=useMemo(()=>state.players.filter(p=>p.status==="waiting"),[state.players]);
 const ranked=useMemo(()=>[...state.players].sort((a,b)=>b.point-a.point),[state.players]);
 const selectedCourt=active.find(c=>c.id===selected);
 async function login(e:React.FormEvent){e.preventDefault();setError("");try{await signInWithEmailAndPassword(getFirebase().auth,email,password);setPassword("")}catch(e){setError(e instanceof Error?e.message:"ログインできません")}}
 async function request(body:Record<string,unknown>){
 if(e2eMode){
  const result=performScenarioAction(state,body);
  if(result.state)setState(result.state);
  return result.response;
 }
 if(!user)throw Error("管理者ログインが必要です");const token=await user.getIdToken();const response=await fetch("/api/matches",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+token},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(data.error||"操作に失敗しました");return data}
 async function action(body:Record<string,unknown>){setLoading(true);setError("");try{return await request(body)}catch(e){setError(e instanceof Error?e.message:"操作に失敗しました");return null}finally{setLoading(false)}}
 async function savePlayerAction(body:Record<string,unknown>){
  setError("");
  try{
   if(e2eMode){setState(current=>applyPlayerAction(current,body));return true;}
   if(!user)throw Error("管理者ログインが必要です");
   const token=await user.getIdToken();
   const response=await fetch("/api/players",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+token},body:JSON.stringify(body)});
   const result=await response.json();
   if(!response.ok)throw Error(result.error||"保存できませんでした");
   return true;
  }catch(e){setError(e instanceof Error?e.message:"保存できませんでした");return false;}
 }
 function openCourt(id:number){setSelected(id);setMode(active.some(c=>c.id===id)?"score":"menu");setIds([0,0,0,0]);setScores([0,4])}
 async function automatic(){if(selected===null)return;const result=await action({action:"preview",courtId:selected});if(result){setIds([...result.teams.teamA,...result.teams.teamB].map((p:Player)=>p.id));setMode("preview")}}
 function manualPreview(){if(ids.some(id=>!id)||new Set(ids).size!==4){setError("待機中の選手4名を重複なく選択してください");return}setError("");setMode("preview")}
 async function commit(body:Record<string,unknown>){if(await action(body)){setSelected(null);setMode("menu")}}
 const names=(values:number[])=>values.map(id=>state.players.find(p=>p.id===id)?.name||"未選択").join("・");
 return <div className="shell"><header className="site-header"><div><small>TENNIS MANAGER</small><h1>テニス部のシステム</h1></div><span className="header-sub">ダブルス練習会</span></header>
 <nav className="nav" aria-label="メインナビゲーション">{[["/","ホーム"],["/courts","コート"],["/players","選手"],["/ranking","順位"],["/history","履歴"]].map(([href,label])=><Link key={href} href={href} aria-current={pathname===href?"page":undefined}>{label}</Link>)}</nav>
 <section className="login"><span>{admin?"管理者でログイン中":user?"参加者としてログイン中":"閲覧モード"}</span>{e2eMode?<span>テスト環境</span>:user&&!user.isAnonymous?<button onClick={()=>signOut(getFirebase().auth)}>ログアウト</button>:<form onSubmit={login}><input type="email" aria-label="管理者メール" placeholder="管理者メール" value={email} onChange={e=>setEmail(e.target.value)} required/><input type="password" aria-label="パスワード" placeholder="パスワード" value={password} onChange={e=>setPassword(e.target.value)} required/><button>管理者ログイン</button></form>}</section>
 {error&&<p role="alert" className="error">{error}</p>}
 <main>{showHome&&<section className="panel"><div className="section-heading"><div><small>DASHBOARD</small><h2>ホーム</h2></div></div><div className="stats"><div>参加者<strong>{state.players.length}</strong></div><div>試合中<strong>{active.length}</strong></div><div>待機中<strong>{waiting.length}</strong></div></div><div className="page-shortcuts"><Link href="/courts">コート状況を見る →</Link><Link href="/players">選手一覧を見る →</Link><Link href="/ranking">ランキングを見る →</Link><Link href="/history">試合履歴を見る →</Link></div></section>}{showCourts&&<section id="courts" className="panel"><div className="section-heading"><div><small>COURT STATUS</small><h2>コート状況</h2></div></div><div className="stats"><div>全コート<strong>{String(state.courtCount).padStart(2,"0")}</strong></div><div>試合中<strong>{String(active.length).padStart(2,"0")}</strong></div><div>空き<strong>{String(Math.max(0,state.courtCount-active.length)).padStart(2,"0")}</strong></div></div><h3>コート一覧</h3><div className="court-grid">{Array.from({length:state.courtCount},(_,i)=><CourtCard key={i} id={i+1} court={active.find(c=>c.id===i+1)} admin={admin} onClick={()=>openCourt(i+1)}/>)}</div>
 {admin&&selected!==null&&<div className="action-panel"><div className="action-heading"><h3>COURT {String(selected).padStart(2,"0")} / {selectedCourt?"試合中":"空き"}</h3><button className="subtle" onClick={()=>setSelected(null)}>閉じる</button></div>
 {mode==="menu"&&<div className="action-row"><button onClick={automatic} disabled={loading}>自動マッチング</button><button className="secondary" onClick={()=>setMode("manual")}>手動入力</button></div>}
 {mode==="manual"&&<><p>待機中の選手を4名選択してください。</p><div className="manual-grid">{ids.map((id,i)=><label key={i}>{i<2?"チームA":"チームB"} / 選手{i%2+1}<select value={id} onChange={e=>setIds(old=>old.map((v,j)=>i===j?Number(e.target.value):v))}><option value={0}>選手を選択</option>{waiting.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>)}</div><button onClick={manualPreview}>組み合わせを確認</button></>}
 {mode==="preview"&&<><div className="preview"><strong>{names(ids.slice(0,2))}</strong><span>VS</span><strong>{names(ids.slice(2))}</strong></div><div className="action-row"><button disabled={loading} onClick={()=>commit({action:"start",courtId:selected,playerIds:ids})}>この組み合わせで試合開始</button><button className="secondary" onClick={()=>setMode("menu")}>戻る</button></div></>}
 {mode==="score"&&<><div className="preview"><strong>{selectedCourt?.teamA?.map(p=>p.name).join("・")}</strong><span>VS</span><strong>{selectedCourt?.teamB?.map(p=>p.name).join("・")}</strong></div><div className="score-grid">{scores.map((score,i)=><label key={i}>チーム{i===0?"A":"B"}<input type="number" min="0" max="4" value={score} onChange={e=>setScores(old=>old.map((v,j)=>i===j?Number(e.target.value):v))}/></label>)}</div><div className="action-row"><button disabled={loading} onClick={()=>commit({action:"result",courtId:selected,scoreA:scores[0],scoreB:scores[1]})}>結果を登録</button><button className="secondary" disabled={loading} onClick={()=>commit({action:"cancel",courtId:selected})}>試合取消</button></div></>}
 </div>}</section>}
 {showPlayers&&<PlayersPanel state={state} admin={admin} save={savePlayerAction}/>}
 {showRanking&&<section id="ranking" className="panel"><div className="section-heading"><div><small>RANKING</small><h2>ランキング</h2></div><span>ポイント順</span></div>{ranked.map((p,i)=><div className="rank" key={p.id}><span>{String(i+1).padStart(2,"0")}</span><strong>{p.name}</strong><div><b>{p.point} pt</b><small>{p.win}/{p.lose}/{p.draw}</small></div></div>)}<p className="hint">勝利 +3pt / 引分 +1pt / 敗北 -1pt</p></section>}
 {showHistory&&<section id="history" className="panel"><div className="section-heading"><div><small>MATCH HISTORY</small><h2>試合履歴</h2></div></div>{state.matchHistory.slice(0,20).map(m=><div className="history" key={m.id}><span>COURT {m.courtId}</span><strong>{m.teamA.join("・")}　{m.scoreA} - {m.scoreB}　{m.teamB.join("・")}</strong></div>)}</section>}</main></div>;
}
