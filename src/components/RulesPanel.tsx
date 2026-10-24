"use client";
import {useState} from 'react';
export function RulesPanel({description,admin,save}:{description:string;admin:boolean;save:(text:string)=>Promise<boolean>}){
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
 async function submit(e:React.FormEvent){
  e.preventDefault();if(busy)return;setBusy(true);setNotice('');setError('');
  try{if(await save(draft)){setEditing(false);setNotice('ルール説明を保存しました')}else{setError('保存できませんでした。もう一度お試しください。')}}
  catch{setError('保存できませんでした。もう一度お試しください。')}
  finally{setBusy(false)}
 }
 return <section className="dashboard-section rules-panel" aria-labelledby="rules-heading">
  <div className="section-heading"><h2 id="rules-heading">大会ルール</h2>{admin&&!editing&&<button className="secondary" onClick={()=>{setDraft(description);setEditing(true);setNotice('');setError('')}}>ルールを編集</button>}</div>
  {admin&&editing?<form onSubmit={submit}><label htmlFor="rules-description">ルール説明</label><textarea id="rules-description" rows={8} maxLength={5000} value={draft} disabled={busy} onChange={e=>setDraft(e.target.value)} aria-describedby="rules-help"/><small id="rules-help">5000文字以内・改行できます。説明文の変更はスコアの入力条件には影響しません。</small><p>{draft.length} / 5000文字</p><div className="action-row"><button type="submit" disabled={busy}>{busy?'保存中…':'ルールを保存'}</button><button type="button" className="secondary" disabled={busy} onClick={()=>{setEditing(false);setError('')}}>キャンセル</button></div></form>:<p className="rules-description">{description.trim()?description:'ルール説明はまだ登録されていません。'}</p>}
  {notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}
 </section>
}
