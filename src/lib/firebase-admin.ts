import "server-only";
import {getApps,initializeApp,applicationDefault} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";

/**
 * Google managed hosting (Cloud Run / App Hosting): ADC from the runtime identity.
 * Local: gcloud auth application-default login
 * Never expose server credentials via NEXT_PUBLIC_*.
 */
function app(){
 const projectId=process.env.FIREBASE_PROJECT_ID;
 if(!projectId)throw new Error("FIREBASE_PROJECT_ID is required for Firebase Admin SDK");
 const existing=getApps()[0];
 if(existing){
  if(existing.options.projectId!==projectId)throw new Error("Firebase Admin project ID mismatch");
  return existing;
 }
 return initializeApp({credential:applicationDefault(),projectId});
}
export function adminDb(){app();return getFirestore()}
export async function requireAdmin(header:string|null){
 if(!header?.startsWith("Bearer "))throw new Error("認証が必要です");
 app();
 const token=await getAuth().verifyIdToken(header.slice(7),true);
 if(token.admin!==true||token.firebase.sign_in_provider==="anonymous")throw new Error("管理者権限が必要です");
 return token;
}
