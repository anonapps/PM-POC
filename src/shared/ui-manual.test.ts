import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveUiManual, type UiManual } from "./ui-manual";
const entry=(version:string):UiManual=>({version,pdf:`/${version}.pdf`,source:"/source",status:"published"});
describe("version-matched UI manuals",()=>{
  it("links the version-matched stable manual and main-branch source",()=>{
    const result=resolveUiManual("1.5.0")!;
    expect(result.exact).toBe(true);expect(result.manual.pdf).toBe("/manuals/1.5/ARGOS_PM_UI_REFERENCE.pdf");expect(result.manual.status).toBe("published");expect(result.manual.source).toContain("/blob/main/");expect(result.label).not.toContain("not published");
  });
  it("labels a compatible same-minor fallback explicitly",()=>{
    const result=resolveUiManual("1.5.3",[entry("1.5.1"),entry("1.5.2"),entry("1.4.9"),entry("1.5.4")])!;
    expect(result.exact).toBe(false);expect(result.manual.version).toBe("1.5.2");expect(result.label).toContain("Compatible same-minor fallback");
  });
  it("does not cross minor/major series or choose a future patch",()=>{
    expect(resolveUiManual("1.6.0",[entry("1.5.0")])).toBeUndefined();
    expect(resolveUiManual("2.5.0",[entry("1.5.0")])).toBeUndefined();
    expect(resolveUiManual("1.5.0",[entry("1.5.1")])).toBeUndefined();
    expect(resolveUiManual("invalid")).toBeUndefined();
  });
});

it("ships the linked stable PDF rather than a missing release asset",()=>{
 const manual=resolveUiManual("1.5.0")!;
 const bytes=readFileSync(new URL("../../public"+manual.manual.pdf,import.meta.url));
 expect(bytes.subarray(0,5).toString()).toBe("%PDF-");
});

it("labels the bundled v1.6 manual as a candidate and ships its PDF",()=>{
 const result=resolveUiManual('1.6.0')!;
 expect(result.manual.status).toBe('candidate');expect(result.label).toContain('not published');
 expect(readFileSync(new URL('../../public'+result.manual.pdf,import.meta.url)).subarray(0,5).toString()).toBe('%PDF-');
});
