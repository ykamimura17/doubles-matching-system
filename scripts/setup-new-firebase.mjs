import {initializeApp,applicationDefault} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";

const [action,projectArgument,confirmation,uid]=process.argv.slice(2);
const projectId=process.env.FIREBASE_PROJECT_ID;
if(projectId!=="tennis-club-system"||projectId!==projectArgument||confirmation!=="--confirm-new-project"){
 console.error("Usage: FIREBASE_PROJECT_ID=<new-project> node scripts/setup-new-firebase.mjs bootstrap|grant-admin <new-project> --confirm-new-project [ADMIN_UID]");
 process.exit(1);
}
if(!["bootstrap","grant-admin"].includes(action))throw Error("Unknown action");
const app=initializeApp({projectId,credential:applicationDefault()});
if(action==="bootstrap"){
 const ref=getFirestore(app).doc("system/current");
 const snap=await ref.get();
 if(snap.exists)throw Error("system/current already exists — refusing to overwrite");
 await ref.create({players:[],courts:[],matchHistory:[],pairHistory:[],courtCount:3});
 console.log("Initialized empty system/current in project",projectId);
}else{
 if(!uid)throw Error("A Firebase Authentication UID is required");
 const auth=getAuth(app);
 const user=await auth.getUser(uid);
 if(!user.email||user.disabled)throw Error("Select an active, non-anonymous user with an email address");
 const claims={...(user.customClaims??{}),admin:true};
 await auth.setCustomUserClaims(uid,claims);
 console.log("Granted admin claim in project",projectId,"for UID",uid);
 console.log("Sign out and sign in again to refresh the ID token.");
}
