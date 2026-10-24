import { readFileSync, writeFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { deserializeProject, inspectProjectCompatibility } from "../persistence/pmp";
import { BrowserProjectFileService, type BrowserFileHandle } from "../persistence/project-file-service/browser";
import { createProjectStore, type ProjectState } from "../application";
import { editPerson } from "../features/resources/commands";
import { savedTimeZoneLabel } from "../shared/saved-timezone";
import { APP_VERSION } from "../shared/app-info";
const original=new Uint8Array(readFileSync(new URL("./fixtures/v1.4-rich-project.pmp",import.meta.url)));
const expected=JSON.parse(readFileSync(new URL("./fixtures/v1.4-rich-project.json",import.meta.url),"utf8")) as ProjectState;
class LegacyHandle implements BrowserFileHandle {
  name="v1.4-rich-project.pmp";bytes=original.slice();modified=1;fail=false;
  async getFile(){const copy=this.bytes.slice();return {name:this.name,size:copy.length,lastModified:this.modified,arrayBuffer:async()=>copy.buffer};}
  async createWritable(){let pending=this.bytes;return {write:async(value:Uint8Array)=>{pending=value.slice();},close:async()=>{if(this.fail)throw new Error("Simulated permission/write failure");this.bytes=pending;this.modified++;}};}
}
describe("frozen v1.4 PMP compatibility",()=>{
  it("opens all legacy fields without silent migration or text normalisation",()=>{
    const result=deserializeProject(original);expect(result.ok).toBe(true);if(!result.ok)return;
    expect(result.value.manifest.compatibility.createdByRuntimeVersion).toBe("1.4.0");
    expect(result.value.manifest.savedTimeZone).toBeUndefined();expect(inspectProjectCompatibility(result.value.manifest).requiresMigration).toBe(false);
    expect(result.value.projectState).toEqual(expected);
    expect(result.value.projectState.people[0].notes).toBe("  legacy notes\nsecond LINE  ");
    expect(savedTimeZoneLabel(result.value.manifest.savedTimeZone)).toContain("Timezone unavailable");
  });
  it("edits, fails safely, retries and reopens without relationship/deletion/audit loss",async()=>{
    const native=new LegacyHandle();const service=new BrowserProjectFileService({supported:()=>true,openPmp:async()=>native,savePmp:async()=>native});
    const opened=await service.open();expect(opened.ok).toBe(true);if(!opened.ok)return;
    const store=createProjectStore(opened.value.state,{createId:()=>"test-id",now:()=>"2026-10-24T12:00:00.000Z"});
    const before=store.getState(),auditCount=before.auditHistory!.events.length;
    expect(store.execute(editPerson(before.people[0].id,"équipe QA"))).toBe(true);
    const edited=store.getState();expect(edited.people[0].name).toBe("Équipe QA");expect(edited.people[0].notes).toBe(before.people[0].notes);
    expect(edited.auditHistory!.events).toHaveLength(auditCount+1);
    expect(store.execute(editPerson(before.people[0].id,"Équipe QA"))).toBe(false);
    store.undo();expect(store.getState().people[0].name).toBe(before.people[0].name);store.redo();expect(store.getState().people[0].name).toBe("Équipe QA");
    const toSave=store.getState();
    const options={runtimeVersion:APP_VERSION,minimumRuntimeVersion:before.project.metadata.minimumAppVersion,createdAt:opened.value.createdAt,configuration:opened.value.configuration};
    native.fail=true;expect((await service.save(opened.value.handle,toSave,options)).ok).toBe(false);expect(native.bytes).toEqual(original);expect(store.isDirty()).toBe(true);
    native.fail=false;expect((await service.save(opened.value.handle,toSave,options)).ok).toBe(true);
    const reopened=await service.reload(opened.value.handle);expect(reopened.ok).toBe(true);if(!reopened.ok)return;
    expect(reopened.value.state).toEqual(toSave);
    for(const key of ["streams","tasks","milestones","risks","decisions","dependencies","relationships","identifierSequences"] as const)expect(reopened.value.state[key]).toEqual(before[key]);
    expect(reopened.value.state.people[29].deletion.isDeleted).toBe(true);
    expect(reopened.value.configuration).toEqual(opened.value.configuration);expect(reopened.value.createdAt).toBe(opened.value.createdAt);
    expect(reopened.value.savedTimeZone?.name).toBeTruthy();
    if(process.env.V14_ROUNDTRIP_PATH)writeFileSync(process.env.V14_ROUNDTRIP_PATH,native.bytes);
    const decoded=deserializeProject(native.bytes);expect(decoded.ok&&decoded.value.manifest.compatibility.createdByRuntimeVersion).toBe(APP_VERSION);
    expect(expected.people[0].name).toBe(before.people[0].name); // Frozen oracle remains untouched.
  });
});
