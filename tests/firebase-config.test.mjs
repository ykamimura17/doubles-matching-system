import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkConfig} from '../scripts/check-firebase-config.mjs';
import {generateKeyPairSync} from 'node:crypto';
import {readServiceAccount} from '../src/lib/firebase-service-account.mjs';
import {initializeApp,cert,deleteApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';

const {privateKey} = generateKeyPairSync('rsa', {modulusLength:2048,
  privateKeyEncoding:{type:'pkcs8',format:'pem'}, publicKeyEncoding:{type:'spki',format:'pem'}});

const valid = {
  FIREBASE_PROJECT_ID: 'tennis-club-system',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'tennis-club-system',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'tennis-club-system.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'test-public-key',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:abcdef',
  FIREBASE_CLIENT_EMAIL: 'vercel-runtime@tennis-club-system.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: privateKey
};
test('owned tennis-club-system project configuration is accepted', () => assert.doesNotThrow(() => checkConfig(valid)));
test('deployment rejects another project, missing Web config, mock mode and key files', () => {
  for (const override of [
    {FIREBASE_PROJECT_ID:'old-project'},
    {NEXT_PUBLIC_FIREBASE_PROJECT_ID:'old-project'},
    {NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:'old-project.firebaseapp.com'},
    {NEXT_PUBLIC_FIREBASE_API_KEY:''},
    {NEXT_PUBLIC_FIREBASE_APP_ID:'replace-me'},
    {NEXT_PUBLIC_E2E_MODE:'true'},
    {GOOGLE_APPLICATION_CREDENTIALS:'key.json'}
  ]) assert.throws(() => checkConfig({...valid,...override}));
});
test('Vercel fails closed without credentials; local ADC remains available', () => {
  assert.throws(() => readServiceAccount({FIREBASE_PROJECT_ID:'tennis-club-system',VERCEL:'1'}));
  assert.equal(readServiceAccount({FIREBASE_PROJECT_ID:'tennis-club-system'}),null);
  assert.throws(() => readServiceAccount({...valid,FIREBASE_PRIVATE_KEY:''}));
  assert.throws(() => readServiceAccount({...valid,FIREBASE_PRIVATE_KEY:'invalid secret'}), /valid RSA private key/);
  assert.throws(() => readServiceAccount({...valid,FIREBASE_CLIENT_EMAIL:'runtime@old-project.iam.gserviceaccount.com'}));
});
test('both multiline and escaped PEM values are supported', () => {
  assert.equal(readServiceAccount({...valid,FIREBASE_PRIVATE_KEY:privateKey.replaceAll('\n','\\n')}).privateKey,privateKey);
  assert.equal(readServiceAccount(valid).privateKey,privateKey);
});
test('server environment credentials initialize Firestore without local ADC', async () => {
  const app = initializeApp({projectId:valid.FIREBASE_PROJECT_ID,credential:cert(readServiceAccount(valid))},'vercel-credential-test');
  try {
    assert.equal(getFirestore(app).projectId,'tennis-club-system');
  } finally {
    await deleteApp(app);
  }
});
