"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {onAuthStateChanged,signInAnonymously,signInWithEmailAndPassword,signOut,type User} from "firebase/auth";
import {doc,onSnapshot} from "firebase/firestore";
import {getFirebase} from "@/lib/firebase-client";
import {RulesPanel} from "@/components/RulesPanel";
import {PlayersPanel} from "@/components/PlayersPanel";
import {defaultTournamentRules} from "@/lib/rules.mjs";
import {rankPlayers} from "@/lib/ranking.mjs";
import {resetMatchHistory,updateHistory} from "@/lib/history";
import {applyPlayerAction} from "@/lib/players.mjs";
import {CourtCard} from "@/components/CourtCard";
import {HistoryDialog,HistoryTeams} from "@/components/HistoryDialog";
import {FooterIcon,type FooterIconName} from "@/components/FooterIcon";
import type {Player,State} from "@/lib/types";
import {emptyState} from "@/lib/types";
import {createScenarioState,performScenarioAction} from "@/lib/e2e/scenario";
const e2eMode=process.env.NODE_ENV==="development" && process.env.NEXT_PUBLIC_E2E_MODE==="true";
type Mode="menu"|"manual"|"preview"|"score";
export default function Home(){
 const pathname=usePathname();
 const showCourts=pathname==="/courts";
 const showPlayers=pathname==="/players"||pathname==="/players/new";
 const showRanking=pathname==="/ranking";
 const showHistory=pathname==="/history";
 const showHome=pathname==="/";
 const showLogin=pathname==="/login";
 const showAwards=pathname==="/awards";
 const [state,setState]=useState<State>(emptyState),[error,setError]=useState(""),[user,setUser]=useState<User|null>(null),[admin,setAdmin]=useState(false),[email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [historyPage,setHistoryPage]=useState(0),[historyFilter,setHistoryFilter]=useState<"all"|"today">("all");
 const [historySelection,setHistorySelection]=useState<number|null>(null),[historyAction,setHistoryAction]=useState<"edit"|"delete">("edit"),[historyScore,setHistoryScore]=useState([4,0]);
 const [resetConfirm,setResetConfirm]=useState(false);
 const [matchingSource,setMatchingSource]=useState<"auto"|"manual">("auto");
 const [selected,setSelected]=useState<number|null>(null),[mode,setMode]=useState<Mode>("menu"),[ids,setIds]=useState<number[]>([0,0,0,0]),[scores,setScores]=useState(["0","0"]),[loading,setLoading]=useState(false);
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
 const completed=state.matchHistory.length;
 const resting=state.players.filter(p=>p.status==="rest").length;
 const ranked=useMemo(()=>rankPlayers(state),[state.players,state.matchHistory]);
 const selectedCourt=active.find(c=>c.id===selected);
 const selectedHistory=state.matchHistory.find(match=>match.id===historySelection);
 const historyFiltered=useMemo(()=>state.matchHistory.filter(m=>historyFilter==="all"||m.date.slice(0,10)===new Date().toISOString().slice(0,10)),[state.matchHistory,historyFilter]);
 const historyPageCount=Math.max(1,Math.ceil(historyFiltered.length/10));
 const historyVisible=historyFiltered.slice(Math.min(historyPage,historyPageCount-1)*10,Math.min(historyPage,historyPageCount-1)*10+10);
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
 async function saveRules(rulesDescription:string){
  if(e2eMode){setState(current=>({...current,rulesDescription}));return true;}
  if(!user||!admin)return false;
  const response=await fetch('/api/rules',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+await user.getIdToken()},body:JSON.stringify({rulesDescription})});
  return response.ok;
 }
 async function saveHistory(){if(historySelection===null||loading)return;setLoading(true);setError("");try{const body={action:historyAction,matchId:historySelection,scoreA:historyScore[0],scoreB:historyScore[1]};if(e2eMode){setState(current=>updateHistory(current,body.matchId,body.action,body.scoreA,body.scoreB))}else{if(!user)throw Error("管理者ログインが必要です");const response=await fetch("/api/history",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+await user.getIdToken()},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw Error(result.error||"履歴を変更できませんでした")}setHistorySelection(null)}catch(e){setError(e instanceof Error?e.message:"履歴を変更できませんでした")}finally{setLoading(false)}}
 async function resetAllHistory(){
  if(!admin||!resetConfirm||loading)return;
  setLoading(true);setError("");
  try{
   if(e2eMode){setState(current=>resetMatchHistory(current))}
   else{
    if(!user)throw Error("管理者ログインが必要です");
    const response=await fetch("/api/history",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+await user.getIdToken()},body:JSON.stringify({action:"reset"})});
    const result=await response.json();
    if(!response.ok)throw Error(result.error||"リセットできませんでした");
   }
   setResetConfirm(false);setHistorySelection(null);setHistoryPage(0);
  }catch(e){setError(e instanceof Error?e.message:"リセットできませんでした")}
  finally{setLoading(false)}
 }
 function openCourt(id:number){setSelected(id);setMode(active.some(c=>c.id===id)?"score":"menu");setIds([0,0,0,0]);setScores(["0","0"])}
 async function automatic(){if(selected===null)return;const result=await action({action:"preview",courtId:selected});if(result){setIds([...result.teams.teamA,...result.teams.teamB].map((p:Player)=>p.id));setMatchingSource("auto");setMode("preview")}}
 function manualPreview(){if(ids.some(id=>!id)||new Set(ids).size!==4){setError("待機中の選手4名を重複なく選択してください");return}setError("");setMatchingSource("manual");setMode("preview")}
 async function commit(body:Record<string,unknown>){if(await action(body)){setSelected(null);setMode("menu")}}
 const names=(values:number[])=>values.map(id=>state.players.find(p=>p.id===id)?.name||"未選択").join("・");
 return <div className="app-frame"><aside className="desktop-sidebar"><Link className="sidebar-brand" href="/"><span>● COURTSIDE</span><small>DOUBLES LEAGUE</small></Link><nav aria-label="デスクトップナビゲーション">{[["/","▣ ダッシュボード"],["/courts","▦ コート状況"],["/players","♙ プレイヤー"],["/ranking","★ ランキング"],["/awards","◇ MVP / SVP"],["/history","▤ 試合履歴"]].map(([href,label])=><Link key={href} href={href} aria-current={pathname===href?"page":undefined}>{label}</Link>)}</nav><div className="sidebar-bottom"><Link href="/login">{admin?"管理者アカウント":"ログイン / モード選択"}</Link></div></aside><div className="app-content"><header className="mobile-header"><Link href="/">● COURTSIDE</Link><strong>{showHome?"10/31 社内大会":showCourts?"コート状況":showPlayers?(pathname==="/players/new"?"プレイヤー登録":"プレイヤー一覧"):showRanking?"ランキング":showHistory?"試合履歴":showAwards?"MVP / SVP":"ログイン"}</strong><Link href="/login" aria-label="ログイン画面">☰</Link></header><nav className="mobile-bottom-nav" aria-label="モバイルナビゲーション">{([["/","home","ホーム"],["/courts","court","コート"],["/players","player","選手"],["/ranking","ranking","順位"],["/history","history","履歴"]] as const).map(([href,icon,label])=><Link key={href} href={href} aria-current={pathname===href?"page":undefined}><span className="footer-nav-icon-slot" aria-hidden="true"><FooterIcon name={icon as FooterIconName}/></span><small>{label}</small></Link>)}</nav>{e2eMode&&<span className="e2e-marker">テスト環境</span>}
 {showLogin&&<section className="login-screen"><div className="login-hero"><small>WELCOME TO COURTSIDE</small><h1>ダブルスを、もっとスマートに。</h1><p>参加者はリアルタイム閲覧、管理者は運営・結果登録ができます。</p></div><div className="login-options"><div className="login-option"><h2>参加者モード</h2><p>試合・コート・順位・履歴をリアルタイムで閲覧できます。</p><Link className="primary-link" href="/">閲覧画面へ →</Link></div><div className="login-option"><h2>管理者モード</h2><p>選手・コート・マッチング・結果を管理します。</p>{admin?<><p>管理者でログイン中</p><button onClick={()=>signOut(getFirebase().auth)}>ログアウト</button></>:<form onSubmit={login}><label>管理者メール<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>管理者パスワード<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button>管理者としてログイン →</button></form>}</div></div><p className="hint">閲覧モードでは試合データを変更できません。</p>{admin&&<section className="history-reset-panel"><h2>試合履歴の管理</h2><p>大会の試合履歴・ペア履歴・選手の戦績と獲得ポイントをすべて初期化します。選手情報とコート数は維持されます。</p><p className="hint">管理者専用・取り消し不可。試合中はリセットできません。</p>{!resetConfirm?<button className="danger-button" disabled={loading||active.length>0||state.players.some(p=>p.status==="playing")} onClick={()=>setResetConfirm(true)}>全試合履歴をリセット</button>:<div role="group" aria-label="試合履歴リセットの最終確認" className="reset-confirm"><strong>本当にすべての試合履歴を削除しますか？</strong><p>ランキングのポイント・勝敗・試合数、ペア履歴もすべて0件に戻ります。復元はできません。</p><div className="action-row"><button className="danger-button" disabled={loading} onClick={resetAllHistory}>{loading?"処理中...":"すべて削除する"}</button><button className="secondary" disabled={loading} onClick={()=>setResetConfirm(false)}>キャンセル</button></div></div>}</section>}</section>}
 {error&&!(showHistory&&admin&&selectedHistory)&&<p role="alert" className="error">{error}</p>}
 <main>{showHome&&<div className="dashboard"><div className="dashboard-intro"><small>● LIVE &nbsp; TENNIS / MATCH DAY</small><h1>10/31 社内大会</h1><p>参加者 {state.players.length}名 / 稼働コート {active.length}面 / 終了試合 {completed}件</p></div><div className="dashboard-stats"><div><span>稼働中コート</span><strong>{String(active.length).padStart(2,"0")}</strong><small>全{state.courtCount}面</small></div><div><span>待機プレイヤー</span><strong>{String(waiting.length).padStart(2,"0")}</strong><small>{state.players.length}名中</small></div><div><span>終了した試合</span><strong>{String(completed).padStart(2,"0")}</strong><small>本日</small></div><div><span>休憩プレイヤー</span><strong>{String(resting).padStart(2,"0")}</strong><small>本日</small></div></div><section className="dashboard-section"><div className="section-heading"><h2>ライブコート</h2><Link href="/courts">全コートを見る →</Link></div><div className="dashboard-courts">{Array.from({length:state.courtCount},(_,i)=>{const court=active.find(c=>c.id===i+1);return <Link href="/courts" className="dashboard-court" key={i}><div><strong>COURT {String(i+1).padStart(2,"0")}</strong><span>{court?"● 試合中":"○ 空き"}</span></div><p>{court?court.teamA?.map(p=>p.name).join("・")+" vs "+court.teamB?.map(p=>p.name).join("・"):"次のマッチングを待っています"}</p><small>{court?"4ゲームマッチ • 進行中":"次の試合を準備中"}</small></Link>})}</div></section><RulesPanel description={state.rulesDescription??defaultTournamentRules} admin={admin} save={saveRules}/><div className="dashboard-extras"><section className="dashboard-section"><h2>次のアクション</h2><Link href="/courts">空きコートで次の組み合わせを作成 →</Link><p>待機中の選手からマッチングできます</p></section><section className="dashboard-section"><h2>暫定ランキング</h2>{ranked.slice(0,3).map((p,i)=><p key={p.id}>{String(p.rank).padStart(2,"0")} &nbsp; {p.name} &nbsp; {p.point} pts</p>)}<Link href="/ranking">ランキングを見る →</Link></section></div></div>}{showCourts&&<section id="courts" className="panel"><div className="section-heading"><div><small>COURT STATUS</small><h2>コート状況</h2></div></div><div className="stats"><div>全コート<strong>{String(state.courtCount).padStart(2,"0")}</strong></div><div>試合中<strong>{String(active.length).padStart(2,"0")}</strong></div><div>空き<strong>{String(Math.max(0,state.courtCount-active.length)).padStart(2,"0")}</strong></div></div><h3>コート一覧</h3><div className="court-grid">{Array.from({length:state.courtCount},(_,i)=><CourtCard key={i} id={i+1} court={active.find(c=>c.id===i+1)} admin={admin} onClick={()=>openCourt(i+1)}/>)}</div>
 {admin&&selected!==null&&<>{(mode==="manual"||mode==="preview"||mode==="score")&&<div className="matching-modal-backdrop" aria-hidden="true" onClick={()=>setSelected(null)}/>}<div role={mode==="manual"||mode==="preview"||mode==="score"?"dialog":undefined} aria-modal={mode==="manual"||mode==="preview"||mode==="score"?true:undefined} aria-label={mode==="manual"?"手動マッチング入力":mode==="preview"?"マッチング結果確認":mode==="score"?"試合結果登録":undefined} className={"action-panel "+(mode==="menu"?"matching-sheet":mode==="preview"?"matching-preview-sheet matching-modal":mode==="manual"||mode==="score"?"matching-modal matching-preview-sheet":"")}><div className="action-heading"><h3>COURT {String(selected).padStart(2,"0")} / {selectedCourt?"試合中":"空き"}</h3><button className="subtle" onClick={()=>setSelected(null)}>閉じる</button></div>
 {mode==="menu"&&<><h3>マッチング方法を選択</h3><p>待機中の選手から次の試合を決めます。管理者専用</p><div className="matching-choices"><button onClick={automatic} disabled={loading}><strong>✦ 自動マッチング</strong><small>既存アルゴリズムで待機中の4名を選出</small></button><button className="secondary" onClick={()=>setMode("manual")}><strong>✎ 手動入力</strong><small>参加可能な選手4名とペアを指定</small></button></div><p className="hint">待機中のみ候補。試合中・休憩中の選手は除外します。</p></>}
 {mode==="manual"&&<><p>待機中の選手を4名選択してください。</p><div className="manual-grid">{ids.map((id,i)=><label key={i}>{i<2?"チームA":"チームB"} / 選手{i%2+1}<select value={id} onChange={e=>setIds(old=>old.map((v,j)=>i===j?Number(e.target.value):v))}><option value={0}>選手を選択</option>{waiting.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>)}</div><p className="hint">同一選手の重複選択は禁止。試合中・休憩中の選手は選択不可。</p><button onClick={manualPreview}>組み合わせを確認</button></>}
 {mode==="preview"&&<><h3>{matchingSource==="auto"?"自動マッチング結果確認":"手動マッチング結果確認"}</h3><p>現在の待機選手と戦績をもとに組み合わせを確認してください。</p><div className="preview"><strong>{names(ids.slice(0,2))}</strong><span>VS</span><strong>{names(ids.slice(2))}</strong></div><div className="action-row"><button disabled={loading} onClick={()=>commit({action:"start",courtId:selected,playerIds:ids})}>この組み合わせで試合開始</button>{matchingSource==="auto"&&<button className="secondary" disabled={loading} onClick={automatic}>組み合わせを再生成</button>}<button className="secondary" onClick={()=>setMode(matchingSource==="manual"?"manual":"menu")}>戻る</button></div></>}
 {mode==="score"&&<><h3>試合結果登録</h3><p>管理者専用 ・ 4ゲーム固定</p><div className="preview"><strong>{selectedCourt?.teamA?.map(p=>p.name).join("・")}</strong><span>VS</span><strong>{selectedCourt?.teamB?.map(p=>p.name).join("・")}</strong></div><div className="score-grid">{scores.map((score,i)=><label key={i}>チーム{i===0?"A":"B"}<input type="number" min="0" max="4" value={score} inputMode="numeric" onChange={e=>setScores(old=>old.map((v,j)=>i===j?e.target.value:v))}/></label>)}</div><p className="hint">入力条件：合計4ゲーム（4-0 / 3-1 / 2-2）。登録後に選手成績とコート状況を更新します。</p><div className="action-row"><button disabled={loading||scores.some(v=>!/^\d+$/.test(v)||Number(v)>4)||Number(scores[0])+Number(scores[1])!==4} onClick={()=>commit({action:"result",courtId:selected,scoreA:Number(scores[0]),scoreB:Number(scores[1])})}>結果を登録</button><button className="secondary" disabled={loading} onClick={()=>commit({action:"cancel",courtId:selected})}>試合取消</button><button className="secondary" onClick={()=>setSelected(null)}>入力を取り消す</button></div></>}
 </div></>}</section>}
 {showPlayers&&<PlayersPanel state={state} admin={admin} save={savePlayerAction}/>}
 {showRanking&&<section id="ranking" className="panel"><div className="section-heading"><div><small>RANKING</small><h2>ランキング</h2></div></div><div className="ranking-table"><div className="ranking-table-head"><span>順位</span><span>選手</span><span>ポイント（勝/負/分）</span><span>勝</span><span>負</span><span>分</span><span>試合数</span></div>{ranked.map((p,i)=><div className="ranking-table-row" key={p.id}><span className="rank-number">{String(p.rank).padStart(2,"0")}</span><strong>{p.name}</strong><b>{p.point} pt<small className="ranking-record">{p.win}/{p.lose}/{p.draw}</small></b><span>{p.win}</span><span>{p.lose}</span><span>{p.draw}</span><span>{p.matchCount}</span></div>)}</div><p className="hint">勝利 +3pt / 敗北 −1pt / 引分 +1pt</p><Link className="awards-link" href="/awards">MVP / SVPを見る →</Link><p className="hint ranking-note">備考：順位は合計ポイント、勝率、勝ち数、総取得ゲーム数、負け数（少ない順）の順で決定します。すべて同じ場合は同率順位となります。</p></section>}
{showHistory&&<section id="history" className="panel"><div className="section-heading"><div><small>MATCH HISTORY</small><h2>試合履歴</h2><p>新しい順・管理者は結果修正と履歴削除が可能</p></div></div><div className="history-filter"><button className={historyFilter==="all"?"filter-active":"secondary"} onClick={()=>{setHistoryFilter("all");setHistoryPage(0)}}>すべて</button><button className={historyFilter==="today"?"filter-active":"secondary"} onClick={()=>{setHistoryFilter("today");setHistoryPage(0)}}>本日</button></div><div className="history-list">{historyVisible.map((m,i)=><div className="history" key={m.id}><span>MATCH #{historyFiltered.length-Math.min(historyPage,historyPageCount-1)*10-i} ・ COURT {String(m.courtId).padStart(2,"0")}</span><HistoryTeams match={m}/>{admin&&<div className="history-actions"><button className="secondary" onClick={()=>{setError("");setHistorySelection(m.id);setHistoryAction("edit");setHistoryScore([m.scoreA,m.scoreB])}}>編集</button><button className="secondary" onClick={()=>{setError("");setHistorySelection(m.id);setHistoryAction("delete")}}>削除</button></div>}</div>)}</div><div className="history-pagination"><button className="secondary" disabled={historyPage===0} onClick={()=>setHistoryPage(p=>Math.max(0,p-1))}>← 前へ</button><span>{Math.min(historyPage,historyPageCount-1)+1} / {historyPageCount}</span><button className="secondary" disabled={historyPage>=historyPageCount-1} onClick={()=>setHistoryPage(p=>p+1)}>次へ →</button></div>{admin&&selectedHistory&&<HistoryDialog match={selectedHistory} action={historyAction} scores={historyScore} setScores={setHistoryScore} busy={loading} error={error} onClose={()=>{if(!loading){setHistorySelection(null);setError("");}}} onSave={saveHistory}/>}</section>}{showAwards&&<section className="awards-page"><div className="section-heading"><div><small>PLAYER AWARDS</small><h2>MVP / SVP</h2><p>ポイントランキング上位2位までの成績を表示（同率を含む）</p></div></div><div className="award-grid">{ranked.filter(p=>p.rank<=2).map(p=><article className={"award-card "+(p.rank===1?"mvp":"svp")} key={p.id}><small>{p.rank===1?"★ MOST VALUABLE PLAYER":"◆ SECOND VALUABLE PLAYER"}</small><h3>{p.name}</h3><strong>{p.point} POINTS</strong><p>{p.win}勝 {p.lose}敗 {p.draw}分 / {p.matchCount}試合</p><p>総取得ゲーム数 {p.gamesWon}</p><p>勝率 {p.matchCount?((p.win/p.matchCount)*100).toFixed(1):"0.0"}%</p></article>)}</div><div className="award-note"><h3>表彰基準</h3><p>合計ポイント→勝率→勝ち数→総取得ゲーム数→負け数（少ない順）で判定。すべて同じ場合は同率順位とし、1位をMVP、2位をSVPとして表示します。</p></div><Link className="awards-link" href="/ranking">← ランキングに戻る</Link></section>}</main></div></div>;
}
