import { describe, expect, it } from "vitest";
import { matchesOption } from "./searchable-option-list";

describe("matchesOption", () => {
  it("matches names case-insensitively across separate words", () => {
    expect(matchesOption({name:"Release Planning",id:"TASK-014"},"planning release")).toBe(true);
  });
  it("matches an ID even when a name is present", () => {
    expect(matchesOption({name:"Design Review",id:"TASK-014"},"task-014")).toBe(true);
  });
  it("supports mixed ID and name terms", () => {
    expect(matchesOption({name:"Design Review",id:"TASK-014"},"design 014")).toBe(true);
  });
  it("matches label-only options", () => {
    expect(matchesOption({label:"Project-wide"},"PROJECT")).toBe(true);
  });
  it("matches string options", () => {
    expect(matchesOption("In Progress","progress")).toBe(true);
  });
  it("does not match unrelated terms", () => {
    expect(matchesOption({name:"Design Review",id:"TASK-014"},"design risk")).toBe(false);
  });
  it("matches person names and IDs using the same matcher", () => {
    expect(matchesOption({id:"PERSON-028",name:"Alex Morgan"},"alex 028")).toBe(true);
    expect(matchesOption({id:"PERSON-028",name:"Alex Morgan"},"alex missing")).toBe(false);
  });
  it("supports repeated spaces and tabs between search terms", () => {
    expect(matchesOption({name:"Release Planning",id:"TASK-014"},"release   \t 014")).toBe(true);
  });
  it("matches a milestone using its ID when the label is different", () => {
    expect(matchesOption({label:"Go-live",id:"MILESTONE-031"},"milestone 031")).toBe(true);
  });
  it("supports name-only objects", () => {
    expect(matchesOption({name:"Platform Delivery"},"delivery")).toBe(true);
  });
  it("does not match an unrelated identifier", () => {
    expect(matchesOption({name:"Design Review",id:"TASK-014"},"TASK-015")).toBe(false);
  });
  it("matches across upper- and lowercase queries", () => {
    expect(matchesOption({name:"Quality Assurance",id:"TASK-018"},"QUALITY assurance")).toBe(true);
  });
  it("matches multi-term queries regardless of term order", () => {
    const option={label:"Go Live",name:"Delivery Milestone",id:"MS-042"};
    expect(matchesOption(option,"042 go delivery")).toBe(true);
    expect(matchesOption(option,"delivery 042 go")).toBe(true);
  });
  it("supports risk searches combining status, owner and risk ID", () => {
    const fields=["RISK-021","Deployment delay","Open","High","Alex Morgan"].join(" ");
    expect(matchesOption({label:fields},"alex high risk-021")).toBe(true);
    expect(matchesOption({label:fields},"closed high")).toBe(false);
  });
  it("supports warning searches combining entity and description", () => {
    const fields=["Missing dependency","Task","TASK-017","API migration","Predecessor has no dates"].join(" ");
    expect(matchesOption({label:fields},"task-017 predecessor dates")).toBe(true);
  });
  it("matches accent-insensitive casing without discarding accents", () => {
    expect(matchesOption({name:"Équipe Réseau",id:"STREAM-009"},"équipe 009")).toBe(true);
  });
  it("finds accented names with unaccented queries", () => {
    expect(matchesOption({name:"Équipe Réseau",id:"STREAM-009"},"equipe reseau")).toBe(true);
    expect(matchesOption({name:"José García"},"jose garcia")).toBe(true);
    expect(matchesOption({name:"Malaga"},"MÁLAGA")).toBe(true);
    expect(matchesOption({name:"Équipe Réseau"},"equipe finance")).toBe(false);
  });
  it("matches displayed human-readable IDs as well as internal IDs", () => {
    const option={id:"a9b8c7d6",humanId:"TASK-029",name:"Launch Readiness"};
    expect(matchesOption(option,"task-029 readiness")).toBe(true);
    expect(matchesOption(option,"a9b8 launch")).toBe(true);
    expect(matchesOption(option,"task-030")).toBe(false);
  });
  it("finds owner options by human ID even when the internal UUID differs", () => {
    const owner={id:"internal-person-42",humanId:"PERSON-042",name:"Sofía López",deleted:false};
    expect(matchesOption(owner,"person-042")).toBe(true);
    expect(matchesOption(owner,"sofia 042")).toBe(true);
    expect(matchesOption(owner,"person-043")).toBe(false);
  });
  it("treats blank search as all options", () => {
    expect(matchesOption({name:"Any option"},"   ")).toBe(true);
  });
});
