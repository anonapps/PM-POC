import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests', workers:1, timeout:30000, reporter:'list',
  outputDir:'../../work/ui-catalogue-results',
  use:{baseURL:'http://127.0.0.1:3100',launchOptions:{executablePath:process.env.CHROME_PATH,args:['--no-sandbox']},screenshot:'only-on-failure'},
  webServer:{command:'npm run ui:catalogue',url:'http://127.0.0.1:3100',reuseExistingServer:!process.env.CI},
});
