import "server-only";
import {getApps,initializeApp,cert,applicationDefault} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
function app(){
 if(getApps().length)return getApps()[0];
 const projectId=process.env.FIREBASE_PROJECT_ID;
 const email=process.env.FIREBASE_CLIENT_EMAIL;
 const key=process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,"\n");
 return initializeApp(email&&key&&projectId?{credential:cert({projectId,clientEmail:email,privateKey:key})}:{credential:applicationDefault(),projectId});
}
export function adminDb(){app();return getFirestore()}
export async function requireAdmin(header:string|null){
 if(!header?.startsWith("Bearer "))throw new Error("認証が必要です");
 app();const token=await getAuth().verifyIdToken(header.slice(7),true);
 if(token.admin!==true)throw new Error("管理者権限が必要です");
 return token;
}
