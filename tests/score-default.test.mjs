import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page=fs.readFileSync(new URL("../src/app/page.tsx",import.meta.url),"utf8");

test("score fields start at 0-0 and reset to 0-0 when a court opens",()=>{
 assert.match(page,/\[scores,setScores\]=useState\(\["0","0"\]\)/);
 assert.match(page,/function openCourt\(id:number\)\{[^}]*setScores\(\["0","0"\]\)/);
});
test("4-game validation remains required before result submission",()=>{
 assert.match(page,/Number\(scores\[0\]\)\+Number\(scores\[1\]\)!==4/);
});
