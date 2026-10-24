import test from 'node:test';
import assert from 'node:assert/strict';
import {rulesSchema} from '../src/lib/rules.mjs';
test('rules accept multiline text and allow clearing',()=>{
 for(const rulesDescription of ['4ゲーム固定\n勝利3pt','', '<script>alert(1)</script>', 'あ'.repeat(5000)])assert.equal(rulesSchema.parse({rulesDescription}).rulesDescription,rulesDescription);
});
test('rules reject oversized text, invalid types and unrelated state writes',()=>{
 for(const body of [{rulesDescription:'あ'.repeat(5001)},{rulesDescription:1},{},{rulesDescription:'説明',players:[]}])assert.equal(rulesSchema.safeParse(body).success,false);
});
