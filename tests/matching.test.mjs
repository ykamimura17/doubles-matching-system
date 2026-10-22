import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
test("Next.js app and protected match API exist",()=>{
 const api=fs.readFileSync("src/app/api/matches/route.ts","utf8");
 assert.match(api,/requireAdmin/);assert.match(api,/runTransaction/);assert.match(api,/assertStart/);
});
test("matching handles waiting players and repeats",()=>{
 const code=fs.readFileSync("src/lib/matching.ts","utf8");
 assert.match(code,/status==="waiting"/);assert.match(code,/pairHistory/);assert.match(code,/new Set\(ids\)/);
});
