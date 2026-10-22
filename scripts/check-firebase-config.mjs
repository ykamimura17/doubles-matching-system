import {pathToFileURL} from "node:url";
const expected = "tennis-club-system";
export function checkConfig(env) {
  for (const key of ["FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"]) {
    if (env[key] !== expected) throw Error(`${key} must be ${expected}`);
  }
  if (env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN !== `${expected}.firebaseapp.com`) {
    throw Error("Firebase auth domain must belong to tennis-club-system");
  }
  for (const key of ["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_APP_ID"]) {
    if (!env[key] || /placeholder|replace|\.\.\./i.test(env[key])) throw Error(`${key} must be set from the Firebase Web app settings`);
  }
  if (!/^1:\d+:web:[a-f0-9]+$/i.test(env.NEXT_PUBLIC_FIREBASE_APP_ID)) throw Error("Invalid Firebase Web app ID");
  if (env.NEXT_PUBLIC_E2E_MODE === "true") throw Error("E2E mode cannot be deployed");
  if (env.GOOGLE_APPLICATION_CREDENTIALS) throw Error("App Hosting must use runtime ADC, not a credential file");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkConfig(process.env);
  console.log("Firebase configuration targets tennis-club-system (no network checks performed).");
}
