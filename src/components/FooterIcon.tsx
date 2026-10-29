/** モバイルフッター向けの線画アイコン。SVGは現在のタブ色を継承します。 */
export type FooterIconName = "court" | "player" | "ranking" | "history";

export function FooterIcon({name}:{name:FooterIconName}){
 if(name==="court"){
  return <svg className="footer-nav-icon" viewBox="0 0 120 90" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
   <rect x="8" y="8" width="104" height="74" rx="1"/>
   <path d="M8 45H112"/>
   <path d="M36 8V82M84 8V82" strokeWidth="2.8"/>
   <path d="M36 26H84M36 64H84M60 26V64"/>
  </svg>;
 }
 if(name==="history"){
  return <svg className="footer-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
   <rect x="5" y="3" width="14" height="18" rx="2"/>
   <path d="M9 7h6M9 12h6M9 17h6"/>
  </svg>;
 }
 if(name==="player"){
  return <svg className="footer-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
   <circle cx="12" cy="7" r="3.5"/>
   <path d="M4.5 20v-1.8a7.5 7.5 0 0 1 15 0V20H4.5Z"/>
  </svg>;
 }
 return <svg className="footer-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M8 3h8v8a4 4 0 0 1-8 0V3Z"/>
  <path d="M8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4M12 15v4M8 21h8M9 19h6"/>
 </svg>;
}
