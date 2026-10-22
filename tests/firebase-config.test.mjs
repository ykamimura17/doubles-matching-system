import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkConfig} from '../scripts/check-firebase-config.mjs';

const valid = {
  FIREBASE_PROJECT_ID: 'tennis-club-system',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'tennis-club-system',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'tennis-club-system.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'test-public-key',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:abcdef'
};
test('new project configuration is accepted', () => assert.doesNotThrow(() => checkConfig(valid)));
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
