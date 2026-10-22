"use client";
import type {Court} from "@/lib/types";
export function CourtCard({id,court,onClick,admin}:{id:number;court?:Court;onClick:()=>void;admin:boolean}){
 const playing=court?.status==="playing";
 const names=(team:typeof court.teamA)=>team?.map(p=>p.name).join("・");
 return <article className="court-card"><div className="court-header"><strong>COURT {String(id).padStart(2,"0")}</strong><span className={"pill "+(playing?"":"empty")}>{playing?"● 試合中":"○ 空き"}</span></div>
 <div className="court-field"><div className="field-lines"/><div className="field-services"/><div className="field-net"/>{playing&&<><strong className="team top">{names(court.teamA)}</strong><span className="team vs">VS</span><strong className="team bottom">{names(court.teamB)}</strong></>}</div>
 {admin?<button className="court-footer" onClick={onClick}>{playing?"タップして結果を入力":"タップしてマッチングを選択"} →</button>:<div className="court-footer muted">{playing?"試合中":"空きコート"}</div>}</article>
}
