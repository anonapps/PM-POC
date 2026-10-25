import { describe, expect, it } from "vitest";
import { createProjectStore, duplicate, restore, softDelete } from "../../application";
import type { Decision, Risk } from "../../domain";
import { makeProjectState, streamFixture, taskFixture } from "../../domain/test-fixtures";
import { createDecision, editDecision, editDecisionContext, filterDecisions, validateDecision, type DecisionDraft } from "./commands";
const context = { createId: (() => { let id = 0; return () => `id-${++id}`; })(), now: () => "2026-09-15T10:00:00Z" };
const draft: DecisionDraft = { title: "Choose approach", decisionDate: "2026-09-01", ownerId: null, projectWide: true, relatedStreamIds: [], relatedTaskIds: [], relatedMilestoneIds: [], relatedRiskIds: [] };
describe("decision management", () => {
  it("does not change state for an unchanged title",()=>{const store=createProjectStore(makeProjectState(),context);store.execute(createDecision(draft));const before=store.getState();expect(editDecision(before.decisions[0].id,{title:"choose approach"}).apply(before,context)).toBe(before);});
  it("capitalises decision titles and undoes one committed rename", () => { const store=createProjectStore(makeProjectState(),context);store.execute(createDecision({...draft,title:"choose direction"}));const id=store.getState().decisions[0].id;expect(store.getState().decisions[0].title).toBe("Choose direction");store.execute(editDecision(id,{title:"approve scope"}));expect(store.getState().decisions[0].title).toBe("Approve scope");store.undo();expect(store.getState().decisions[0].title).toBe("Choose direction"); });

  it("creates, edits, filters and sorts using global history", () => { const store = createProjectStore(makeProjectState(), context); store.execute(createDecision(draft)); const id = store.getState().decisions[0].id; store.execute(editDecision(id, { title: "Choose option A" })); expect(filterDecisions(store.getState(), "option")[0].title).toBe("Choose option A"); expect(store.isDirty()).toBe(true); store.undo(); expect(store.getState().decisions[0].title).toBe(draft.title); store.redo(); });
  it("searches dates, owners and related stream names case-insensitively", () => { const store=createProjectStore(makeProjectState({streams:[streamFixture()]}),context);store.execute(createDecision({...draft,relatedStreamIds:["stream-1"],decisionDate:"2026-09-21"}));const id=store.getState().decisions[0].id;expect(filterDecisions(store.getState(),"2026-09-21").map(item=>item.id)).toEqual([id]);const name=store.getState().streams[0].name;expect(filterDecisions(store.getState(),name.toUpperCase()).map(item=>item.id)).toEqual([id]);expect(filterDecisions(store.getState(),"missing phrase")).toHaveLength(0); });
  it("matches decision ID, title, date and related stream in any term order", () => { const store=createProjectStore(makeProjectState({streams:[streamFixture()]}),context);store.execute(createDecision({...draft,relatedStreamIds:["stream-1"],decisionDate:"2026-09-21"}));const decision=store.getState().decisions[0];const stream=store.getState().streams[0];expect(filterDecisions(store.getState(),`${decision.humanId} ${stream.name}`)).toHaveLength(1);expect(filterDecisions(store.getState(),`2026-09-21 approach`)).toHaveLength(1);expect(filterDecisions(store.getState(),`unrelated ${decision.humanId}`)).toHaveLength(0); });
  it("validates active relationships", () => { expect(validateDecision(makeProjectState(), { ...draft, relatedStreamIds: ["missing"] })).toContain("Relationships must target active entities."); expect(validateDecision(makeProjectState({ streams: [streamFixture()] }), { ...draft, relatedStreamIds: ["stream-1"] })).toHaveLength(0); });
  it("duplicates with fresh sequential identity, current injected date, active relationships and no inactive owner", () => { const decision: Decision = { ...draft, id: "d", projectId: "project-1", humanId: "DECISION-001", ownerId: "p", relatedStreamIds: ["stream-1"] , deletion: { isDeleted: false } }; const store = createProjectStore(makeProjectState({ streams: [streamFixture()], people: [{ id: "p", projectId: "project-1", humanId: "PERSON-001", name: "Former", deletion: { isDeleted: true } }], decisions: [decision] }), context); store.execute(duplicate("decision", "d")); expect(store.getState().decisions[1]).toMatchObject({ humanId: "DECISION-002", decisionDate: "2026-09-15", ownerId: null, relatedStreamIds: ["stream-1"] }); expect(store.getState().decisions[1].id).not.toBe("d"); });
  it("soft deletes, includes deleted on demand, and restores", () => { const store = createProjectStore(makeProjectState(), context); store.execute(createDecision(draft)); const id = store.getState().decisions[0].id; store.execute(softDelete("decision", id)); expect(filterDecisions(store.getState(), "")).toHaveLength(0); expect(filterDecisions(store.getState(), "", true)).toHaveLength(1); store.execute(restore("decision", id)); expect(filterDecisions(store.getState(), "")).toHaveLength(1); });
});

it("context editing preserves hidden task and risk links through Undo/Redo", () => {
  const risk: Risk = { id: "risk-1", projectId: "project-1", humanId: "RISK-001", title: "Delivery", status: "Open", probability: "Low", impact: "Low", riskLevel: "Low", ownerId: null, projectWide: true, relatedStreamIds: [], relatedTaskIds: [], relatedMilestoneIds: [], actions: [], deletion: { isDeleted: false } };
  const store = createProjectStore(makeProjectState({ streams: [streamFixture()], tasks: [taskFixture()], risks: [risk] }), context);
  store.execute(createDecision({ ...draft, relatedTaskIds: ["task-1"], relatedRiskIds: ["risk-1"], description: "Original notes" }));
  const original = store.getState().decisions[0];
  store.execute(editDecisionContext(original.id, { projectWide: false, relatedStreamIds: ["stream-1"], relatedMilestoneIds: [], description: "Updated notes" }));
  expect(store.getState().decisions[0]).toMatchObject({ relatedTaskIds: ["task-1"], relatedRiskIds: ["risk-1"], relatedStreamIds: ["stream-1"], description: "Updated notes" });
  store.undo();
  expect(store.getState().decisions[0]).toEqual(original);
  store.redo();
  expect(store.getState().decisions[0]).toMatchObject({ relatedTaskIds: ["task-1"], relatedRiskIds: ["risk-1"], description: "Updated notes" });
});

it("context editing changes explicit task/risk selections while retaining unedited fields",()=>{
  const state=makeProjectState({tasks:[taskFixture()],decisions:[{...draft,id:"decision-1",projectId:"project-1",humanId:"DECISION-001",relatedTaskIds:["task-1"],description:"Before",deletion:{isDeleted:false}}]});
  const store=createProjectStore(state,context);
  store.execute(editDecisionContext("decision-1",{projectWide:false,relatedStreamIds:[],relatedMilestoneIds:[],relatedTaskIds:[],relatedRiskIds:[],description:"After"}));
  expect(store.getState().decisions[0]).toMatchObject({title:draft.title,relatedTaskIds:[],description:"After"});
  store.undo();expect(store.getState().decisions[0]).toEqual(state.decisions[0]);
});
