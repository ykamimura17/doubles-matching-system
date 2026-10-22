import {initializeApp,applicationDefault} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";

const [action,projectArgument,confirmation,uid]=process.argv.slice(2);
const projectId=process.env.FIREBASE_PROJECT_ID;
if(projectId!=="loe26d"||projectId!==projectArgument||confirmation!=="--confirm-existing-project"){
 console.error("Usage: FIREBASE_PROJECT_ID=loe26d node scripts/setup-new-firebase.mjs grant-admin loe26d --confirm-existing-project ADMIN_UID");
 process.exit(1);
}
if(action!=="grant-admin")throw Error("Only grant-admin is allowed; existing Firestore data must not be initialized");
const app=initializeApp({projectId,credential:applicationDefault()});
{
 if(!uid)throw Error("A Firebase Authentication UID is required");
 const auth=getAuth(app);
 const user=await auth.getUser(uid);
 if(!user.email||user.disabled)throw Error("Select an active, non-anonymous user with an email address");
 const claims={...(user.customClaims??{}),admin:true};
 await auth.setCustomUserClaims(uid,claims);
 console.log("Granted admin claim in project",projectId,"for UID",uid);
 console.log("Sign out and sign in again to refresh the ID token.");
}
