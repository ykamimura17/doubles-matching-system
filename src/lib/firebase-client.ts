import {getApp,getApps,initializeApp} from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";

const config={
 apiKey:process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
 authDomain:process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
 projectId:process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
 appId:process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export function getFirebase(){
 const missing=Object.entries(config).filter(([,value])=>!value).map(([key])=>key);
 if(missing.length)throw new Error("Firebase client settings are missing: "+missing.join(", "));
 const existing=getApps()[0];
 if(existing?.options.projectId!==undefined&&existing.options.projectId!==config.projectId)throw new Error("Firebase client project mismatch");
 const app=existing??initializeApp(config);
 return {auth:getAuth(app),db:getFirestore(app)};
}
