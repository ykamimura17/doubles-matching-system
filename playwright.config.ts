import {defineConfig,devices} from "@playwright/test";

export default defineConfig({
 testDir:"./e2e/features",
 testMatch:"**/*.spec.ts",
 fullyParallel:true,
 forbidOnly:!!process.env.CI,
 retries:process.env.CI?1:0,
 workers:process.env.CI?2:undefined,
 reporter:process.env.CI?[["github"],["html",{open:"never"}]]:[["list"],["html",{open:"never"}]],
 use:{baseURL:"http://127.0.0.1:3100",trace:"retain-on-failure",screenshot:"only-on-failure"},
 projects:[{name:"desktop-chromium",use:{...devices["Desktop Chrome"]}},{name:"mobile-chromium",use:{...devices["Pixel 7"]}}],
 webServer:{command:"npm run dev -- -p 3100",url:"http://127.0.0.1:3100",reuseExistingServer:!process.env.CI,timeout:120000,env:{NEXT_PUBLIC_E2E_MODE:"true",NEXT_TELEMETRY_DISABLED:"1"}}
});
