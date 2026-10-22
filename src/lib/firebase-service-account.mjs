import {createPrivateKey} from 'node:crypto';

/** @param {Record<string, string | undefined>} env */
export function readServiceAccount(env) {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (projectId !== 'tennis-club-system') throw Error('FIREBASE_PROJECT_ID must be tennis-club-system');
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const rawKey = env.FIREBASE_PRIVATE_KEY;
  if (!clientEmail && !rawKey && env.VERCEL !== '1') return null; // Local ADC only.
  if (!clientEmail || !rawKey) throw Error('Firebase server credentials are incomplete');
  if (!/^[a-z0-9-]+@tennis-club-system\.iam\.gserviceaccount\.com$/.test(clientEmail)) {
    throw Error('Firebase service account must belong to tennis-club-system');
  }
  const privateKey = rawKey.replace(/\\n/g, '\n');
  try {
    const key = createPrivateKey(privateKey);
    if (key.asymmetricKeyType !== 'rsa') throw Error('RSA required');
  } catch {
    throw Error('FIREBASE_PRIVATE_KEY must be a valid RSA private key');
  }
  return {projectId, clientEmail, privateKey};
}
