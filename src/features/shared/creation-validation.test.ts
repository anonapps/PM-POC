import { describe, expect, it } from "vitest";
import { isCalendarDate, validateCreationFields } from "./creation-validation";
import { createProjectStore } from "../../application";
import { makeProjectState } from "../../domain/test-fixtures";
import { createMilestone } from "../milestones/commands";
import { createDecision } from "../decisions/commands";
describe("mandatory inline creation",()=>{
  it("returns errors for each blank field, leaving valid fields clear",()=>{
    expect(validateCreationFields({title:{value:" ",label:"Title"},date:{value:"",label:"Decision date",date:true},name:{value:"Launch",label:"Name"}})).toEqual({title:"Title is required.",date:"Decision date is required."});
  });
  it("accepts real leap dates and rejects rolled-over or malformed dates",()=>{
    expect(isCalendarDate("2028-02-29")).toBe(true);
    for(const value of ["2026-02-29","2026-02-30","2026-13-01","2026-2-01",""])expect(isCalendarDate(value)).toBe(false);
    expect(validateCreationFields({date:{value:"2026-02-30",label:"Date",date:true}})).toEqual({date:"Enter a valid date."});
  });
  it("rejects impossible dates at the command boundary without dirty state or history",()=>{
    const store=createProjectStore(makeProjectState(),{createId:()=>"id",now:()=>"2026-10-24T00:00:00Z"});
    expect(store.execute(createMilestone({name:"Gate",plannedDate:"2026-02-30",status:"Tentative",ownerId:null,scope:{kind:"project"},relatedTaskIds:[]}))).toBe(false);
    expect(store.execute(createDecision({title:"Gate",decisionDate:"2026-02-30",ownerId:null,projectWide:false,relatedStreamIds:[],relatedTaskIds:[],relatedMilestoneIds:[],relatedRiskIds:[]}))).toBe(false);
    expect(store.isDirty()).toBe(false);expect(store.canUndo()).toBe(false);
  });
});
