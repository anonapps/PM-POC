export interface UiManual {version:string;pdf:string;source:string;status:"candidate"|"published"}
export const UI_MANUALS:readonly UiManual[]=[{
  version:"1.5.0",pdf:"/manuals/1.5/ARGOS_PM_UI_REFERENCE.pdf",
  source:"https://github.com/anonapps/PM-POC/blob/main/docs/V1.5_UI_REFERENCE.md",status:"published",
}];
const versionParts=(version:string)=>/^(\d+)\.(\d+)\.(\d+)(?:-[\w.-]+)?$/.exec(version);
/** Never present a different minor series as compatible, or a missing asset as published. */
export function resolveUiManual(version:string,manuals:readonly UiManual[]=UI_MANUALS):{manual:UiManual;exact:boolean;label:string}|undefined {
  const requested=versionParts(version);if(!requested)return;
  const exact=manuals.find(manual=>manual.version===version);
  const compatible=exact??manuals.filter(manual=>{
    const parts=versionParts(manual.version);
    return parts&&parts[1]===requested[1]&&parts[2]===requested[2]&&Number(parts[3])<=Number(requested[3]);
  }).sort((a,b)=>Number(versionParts(b.version)![3])-Number(versionParts(a.version)![3]))[0];
  if(!compatible)return;
  return {manual:compatible,exact:Boolean(exact),label:`${exact?"Version-matched":"Compatible same-minor fallback"} UI Reference Manual v${compatible.version}${compatible.status==="candidate"?" (bundled release candidate; not published)":""}`};
}
