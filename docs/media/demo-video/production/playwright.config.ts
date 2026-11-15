import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:'produce.spec.ts',timeout:240000,workers:1,reporter:'list',outputDir:'./test-results',use:{baseURL:process.env.ARGOS_URL||'http://127.0.0.1:3000',viewport:{width:1840,height:900},launchOptions:{executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']}}});
