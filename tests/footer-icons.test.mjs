import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const icon=fs.readFileSync(new URL("../src/components/FooterIcon.tsx",import.meta.url),"utf8");
const page=fs.readFileSync(new URL("../src/app/page.tsx",import.meta.url),"utf8");

test("tennis court center service line ends at service lines, not baselines",()=>{
 assert.match(icon,/M36 26H84M36 64H84M60 26V64/);
 assert.doesNotMatch(icon,/M60 8V82/);
});
test("mobile footer uses SVG home, court, person, trophy and history icons",()=>{
 assert.match(page,/\["\/","home","ホーム"\]/);
 assert.match(page,/\["\/courts","court","コート"\]/);
 assert.match(page,/\["\/players","player","選手"\]/);
 assert.match(page,/\["\/ranking","ranking","順位"\]/);
 assert.match(page,/<FooterIcon name=\{icon as FooterIconName\}\/>/);
 assert.doesNotMatch(page,/icon==="home"\?"⌂"/);
 assert.match(icon,/name==="home"/);
 assert.match(icon,/M3 10\.5 12 4l9 6\.5/);
 assert.match(icon,/M9\.5 20v-7h5v7/);
 assert.match(icon,/name==="court"/);
 assert.match(icon,/name==="player"/);
});
