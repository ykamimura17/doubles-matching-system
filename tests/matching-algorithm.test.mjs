import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/lib/matching.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { chooseMatch } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

const player = (id, changes = {}) => ({ id, name: 'P' + id, level: 2, status: 'waiting', point: 0, matchCount: 0, win: 0, lose: 0, draw: 0, ...changes });
const players = (n, changes = {}) => Array.from({ length: n }, (_, i) => player(i + 1, changes[i + 1]));
const state = (ps, pairHistory = []) => ({ players: ps, pairHistory, courts: [], matchHistory: [], courtCount: 1 });
const ids = result => [...result.teamA, ...result.teamB].map(p => p.id).sort((a,b) => a-b);
const teams = result => [result.teamA, result.teamB].map(t => t.map(p => p.id).sort((a,b) => a-b).join(',')).sort().join('|');
const chosen = (ps, history = []) => chooseMatch(state(ps, history));
const pair = (p1,p2) => ({p1,p2});

test('A01: exactly four waiting players are selected', () => assert.deepEqual(ids(chosen(players(4))), [1,2,3,4]));
test('A02: lowest match counts win selection', () => {
  const ps = players(8, {1:{matchCount:5},2:{matchCount:4},3:{matchCount:3},4:{matchCount:2},5:{matchCount:1},6:{matchCount:0},7:{matchCount:0},8:{matchCount:0}});
  assert.deepEqual(ids(chosen(ps)), [5,6,7,8]);
});
test('A03: equal-match-count ties choose top two and bottom two by points', () => {
  const ps = players(6, {1:{point:6},2:{point:5},3:{point:4},4:{point:3},5:{point:2},6:{point:1}});
  assert.deepEqual(ids(chosen(ps)), [1,2,5,6]);
});
test('A04: match count takes precedence over rating', () => {
  const ps = players(5, {1:{level:3,matchCount:1},2:{level:1},3:{level:1},4:{level:1},5:{level:1}});
  assert.deepEqual(ids(chosen(ps)), [2,3,4,5]);
});
test('A05: resting and playing players are excluded', () => {
  const ps = players(6, {1:{status:'rest'},2:{status:'playing'}});
  assert.deepEqual(ids(chosen(ps)), [3,4,5,6]);
});
test('A06: fewer than four waiting players throws', () => assert.throws(() => chosen(players(3)), /待機中の選手が4名必要/));
test('A07: five tied waiting players choose top two and bottom two (stable ties)', () => assert.deepEqual(ids(chosen(players(5))), [1,2,4,5]));
test('A08: one remaining slot selects the highest-point player from tied match counts', () => {
  const ps = players(6, {1:{matchCount:0},2:{matchCount:0},3:{matchCount:0},4:{matchCount:1,point:1},5:{matchCount:1,point:9},6:{matchCount:1,point:-2}});
  assert.deepEqual(ids(chosen(ps)), [1,2,3,5]);
});
test('A09: points rather than level decide equal-match-count selection', () => {
  const ps = players(5, {1:{level:3,point:3},2:{level:3,point:2},3:{level:3,point:1},4:{level:1,point:0},5:{level:1,point:-1}});
  assert.deepEqual(ids(chosen(ps)), [1,2,4,5]);
});
test('A10: two remaining slots choose highest and lowest point players', () => {
  const ps = players(6, {1:{matchCount:0},2:{matchCount:0},3:{matchCount:1,point:8},4:{matchCount:1,point:5},5:{matchCount:1,point:0},6:{matchCount:1,point:-2}});
  assert.deepEqual(ids(chosen(ps)), [1,2,3,6]);
});

test('B06: level coefficient is 50 rather than 100', () => {
  const ps = players(4, {1:{level:3,point:0},2:{level:2,point:10},3:{level:1,point:0},4:{level:2,point:0}});
  assert.equal(teams(chosen(ps)), '1,4|2,3');
});

test('B01: equal ratings and no history use first generated pattern', () => assert.equal(teams(chosen(players(4))), '1,2|3,4'));
test('B02: two advanced and two beginner players are balanced', () => {
  const ps = players(4, {1:{level:3},2:{level:3},3:{level:1},4:{level:1}});
  assert.equal(teams(chosen(ps)), '1,3|2,4');
});
test('B03: uneven ratings choose the minimum team gap', () => {
  const ps = players(4, {1:{point:4},2:{point:3},3:{point:1},4:{point:0}});
  assert.equal(teams(chosen(ps)), '1,4|2,3');
});
test('B04: negative points participate in rating calculation', () => {
  const ps = players(4, {1:{point:3},2:{point:1},3:{point:-1},4:{point:-3}});
  assert.equal(teams(chosen(ps)), '1,4|2,3');
});
test('B05: tied minimum gaps use the earlier generated pattern', () => {
  const ps = players(4, {1:{point:2},2:{point:1},3:{point:1},4:{point:0}});
  assert.equal(teams(chosen(ps)), '1,4|2,3');
});

test('C01: no history means rating-only decision', () => assert.equal(teams(chosen(players(4))), '1,2|3,4'));
test('C02: repeated pair incurs a penalty', () => assert.equal(teams(chosen(players(4), [pair(1,2)])), '1,3|2,4'));
test('C03: reversed pair IDs count as the same pair', () => assert.equal(teams(chosen(players(4), [pair(2,1)])), '1,3|2,4'));
test('C04: a pair older than the last ten history entries still counts', () => {
  const history = [pair(1,2), ...Array.from({length:10}, () => pair(90,91))];
  assert.equal(teams(chosen(players(4), history)), '1,3|2,4');
});
test('C05: all patterns repeated; least-repeated pairing wins', () => {
  const history = [pair(1,2),pair(1,2),pair(1,3),pair(1,4),pair(1,4),pair(1,4)];
  assert.equal(teams(chosen(players(4), history)), '1,3|2,4');
});
test('C06: pair penalty of 1000 outweighs a modest rating difference', () => {
  const ps = players(4, {1:{point:4},2:{point:3},3:{point:1},4:{point:0}});
  assert.equal(teams(chosen(ps, [pair(1,4)])), '1,3|2,4');
});
test('C07: opponent-pair repetition is not independently penalized', () => {
  assert.equal(teams(chosen(players(4), [pair(1,2)])), '1,3|2,4');
});
test('D01: entire large history affects the penalty', () => {
  const history = [...Array.from({length:200}, () => pair(1,2)), ...Array.from({length:150}, () => pair(1,3))];
  assert.equal(teams(chosen(players(4), history)), '1,4|2,3');
});
test('D02: identical inputs produce identical results', () => {
  const s = state(players(6), [pair(1,2)]);
  assert.equal(teams(chooseMatch(s)), teams(chooseMatch(s)));
});
test('D03: equal-point ties preserve candidate priority at the extremes', () => {
  assert.deepEqual(ids(chosen(players(5))), [1,2,4,5]);
  assert.deepEqual(ids(chosen(players(5).reverse())), [1,2,4,5]);
});
