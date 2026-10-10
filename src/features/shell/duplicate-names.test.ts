import { describe, expect, it } from "vitest";
import { makeProjectState, streamFixture, taskFixture } from "../../domain/test-fixtures";
import { hasNewDuplicateName } from "./duplicate-names";
describe("v1.2 duplicate names", () => {
 const state = makeProjectState({streams:[streamFixture({id:"s1",name:"Delivery"})],tasks:[taskFixture({id:"t1",name:"Delivery"})]});
 it("warns only for the same entity type, case-insensitively",()=>{
  expect(hasNewDuplicateName(state,"stream"," delivery ")).toBe(true);
  expect(hasNewDuplicateName(state,"task","DELIVERY")).toBe(true);
  expect(hasNewDuplicateName(state,"milestone","Delivery")).toBe(false);
 });
 it("does not warn when an existing name remains unchanged",()=>{
  expect(hasNewDuplicateName(state,"stream","delivery","Delivery","s1")).toBe(false);
 });
 it("does not block creation or report empty names as duplicates",()=>{
  expect(hasNewDuplicateName(state,"stream","   ")).toBe(false);
 });
});
