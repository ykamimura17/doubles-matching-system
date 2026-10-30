"use client";
import {useEffect,useRef,type Dispatch,type SetStateAction} from "react";
import type {Match} from "@/lib/types";

export function HistoryTeams({match}:{match:Match}){
 return <div className="history-teams">
  {[match.teamA,match.teamB].map((team,index)=>{
   const score=index===0?match.scoreA:match.scoreB;
   const opponent=index===0?match.scoreB:match.scoreA;
   return <div className="history-team-row" key={index} aria-label={`チーム${index===0?"A":"B"} ${team.join("・")} ${score}ゲーム`}>
    <div className="history-pair">{team.map((name,i)=><span className="history-player" key={i}>{name}</span>)}</div>
    <b className={"history-team-score"+(score>opponent?" history-team-winner":"")}>{score}</b>
   </div>;
  })}
 </div>;
}

type Props={
 match:Match;
 action:"edit"|"delete";
 scores:number[];
 setScores:Dispatch<SetStateAction<number[]>>;
 busy:boolean;
 error:string;
 onClose:()=>void;
 onSave:()=>void;
};

export function HistoryDialog({match,action,scores,setScores,busy,error,onClose,onSave}:Props){
 const dialogRef=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const dialog=dialogRef.current;
  if(!dialog)return;
  const overflow=document.body.style.overflow;
  const previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  document.body.style.overflow="hidden";
  dialog.showModal();
  return ()=>{dialog.close();document.body.style.overflow=overflow;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});};
 },[]);
 const invalid=scores.some(score=>!Number.isInteger(score)||score<0||score>4)||scores[0]+scores[1]!==4;
 return <dialog ref={dialogRef} className="history-dialog" aria-labelledby="history-dialog-title"
  onCancel={event=>{event.preventDefault();if(!busy)onClose();}}>
  <form onSubmit={event=>{event.preventDefault();if(!busy&&(action==="delete"||!invalid))onSave();}}>
   <div className="action-heading"><h3 id="history-dialog-title">{action==="edit"?"試合結果を修正":"試合履歴を削除しますか？"}</h3><button type="button" className="subtle" disabled={busy} onClick={onClose} aria-label="閉じる">閉じる</button></div>
   <p className="hint">COURT {String(match.courtId).padStart(2,"0")}</p>
   {action==="edit"?<>
    <div className="history-score-fields">
     {[match.teamA,match.teamB].map((team,index)=><label className="history-team-row" key={index}>
      <div><span className="history-team-label">チーム{index===0?"A":"B"}</span><div className="history-pair">{team.map((name,i)=><span className="history-player" key={i}>{name}</span>)}</div></div>
      <input aria-label={`チーム${index===0?"A":"B"} スコア`} type="number" inputMode="numeric" min="0" max="4" step="1" required disabled={busy} value={scores[index]} onChange={event=>setScores(old=>old.map((value,i)=>i===index?Number(event.target.value):value))}/>
     </label>)}
    </div>
    <p className="hint">合計4ゲームで入力してください（4–0 / 3–1 / 2–2）。</p>
   </>:<><HistoryTeams match={match}/><p>削除すると、この試合の勝敗・ポイントがランキングから除外されます。この操作は取り消せません。</p></>}
   {error&&<p role="alert" className="error">{error}</p>}
   <div className="action-row"><button type="submit" className={action==="delete"?"danger-button":undefined} disabled={busy||(action==="edit"&&invalid)}>{busy?"処理中...":action==="edit"?"変更を保存する":"削除を確定"}</button><button type="button" className="secondary" disabled={busy} onClick={onClose}>キャンセル</button></div>
  </form>
 </dialog>;
}
