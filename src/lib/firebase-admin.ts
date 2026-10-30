import "server-only";
import {getApps,initializeApp,applicationDefault,cert} from "firebase-admin/app";
import {readServiceAccount} from "./firebase-service-account.mjs";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";

/**
 * Vercel: server-only service account environment variables.
 * Local: ADC or the same service account environment variables.
 * Never expose server credentials via NEXT_PUBLIC_*.
 */
function app(){
 const projectId=process.env.FIREBASE_PROJECT_ID;
 if(projectId!=="tennis-club-system")throw new Error("FIREBASE_PROJECT_ID must be tennis-club-system");
 const existing=getApps()[0];
 if(existing){
  if(existing.options.projectId!==projectId)throw new Error("Firebase Admin project ID mismatch");
  return existing;
 }
 const serviceAccount=readServiceAccount(process.env);
 return initializeApp({credential:serviceAccount?cert(serviceAccount):applicationDefault(),projectId});
}
export function adminDb(){app();return getFirestore()}
export async function requireUser(header:string|null){
 if(!header?.startsWith("Bearer "))throw new Error("認証が必要です");
 app();
 try{return await getAuth().verifyIdToken(header.slice(7),true);}
 catch{throw new Error("認証情報が無効です。再読み込みしてお試しください");}
}
export async function requireAdmin(header:string|null){
 const token=await requireUser(header);
 if(token.admin!==true||token.firebase.sign_in_provider==="anonymous")throw new Error("管理者権限が必要です");
 return token;
}
