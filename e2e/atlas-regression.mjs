import {spawn} from 'node:child_process';
/** Reuse the already-running test server, with a separate browser/profile/output. */
export async function verifyAtlasJourney({baseUrl,chromePath,outputDir}){
 await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test','--grep','Atlas software','--workers=1'],{stdio:'inherit',env:{...process.env,E2E_BASE_URL:baseUrl,CHROME_PATH:chromePath,LAYOUT_OUTPUT_DIR:outputDir}});
  child.once('error',reject);child.once('close',(code,signal)=>code===0?resolve():reject(new Error(`Atlas lifecycle failed: exit ${code}, signal ${signal}`)));
 });
}
