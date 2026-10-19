import{describe,expect,it}from"vitest";import{makeProjectState,streamFixture}from"../../domain/test-fixtures";import{buildTubeMap,isoWeek,mondayOf}from"./model";const milestone=(id:string,date:string,streamIds:string[]=[])=>({id,projectId:"project-1",humanId:`MILESTONE-00${id}`as const,name:`Gate ${id}`,plannedDate:date,status:"Planned"as const,ownerId:null,scope:streamIds.length?{kind:"streams"as const,streamIds}:{kind:"project"as const},relatedTaskIds:[],deletion:{isDeleted:false}});describe("Tube Map v1.1",()=>{it("has twelve Monday columns",()=>{expect(mondayOf("2026-09-17")).toBe("2026-09-14");expect(isoWeek("2026-09-14")).toBe(38);expect(buildTubeMap(makeProjectState(),"2026-09-17").weeks).toHaveLength(12)});it("calculates ISO week numbers correctly across year boundaries",()=>{expect(isoWeek("2026-01-01")).toBe(1);expect(isoWeek("2027-01-01")).toBe(53);expect(isoWeek("2027-01-04")).toBe(1)});it("always includes Project-wide above ordered streams",()=>{const model=buildTubeMap(makeProjectState({streams:[streamFixture()]}),"2026-09-17");expect(model.streams.map(s=>s.id)).toEqual(["project","stream-1"])});it("creates every multi-stream occurrence at the same x",()=>{const state=makeProjectState({streams:[streamFixture(),streamFixture({id:"s2",humanId:"STREAM-002"})],milestones:[milestone("1","2026-10-01",["stream-1","s2"])]});const stations=buildTubeMap(state,"2026-09-17").stations;expect(stations).toHaveLength(2);expect(new Set(stations.map(s=>s.x)).size).toBe(1)});it("keeps outside milestones outside",()=>{const state=makeProjectState({milestones:[milestone("1","2026-01-01")]});expect(buildTubeMap(state,"2026-09-17").stations[0].boundary).toBe("before")})});

describe("Tube Map layout",()=>{it("renders one entity-level connection between selected occurrences",()=>{const first=milestone("1","2026-09-21",["stream-1"]),second=milestone("2","2026-10-01",["stream-1"]);const state=makeProjectState({streams:[streamFixture()],milestones:[first,second],dependencies:[{id:"d",projectId:"project-1",predecessor:{kind:"milestone",id:"1"},successor:{kind:"milestone",id:"2"},type:"Finish-to-Start"}]});expect(buildTubeMap(state,"2026-09-17").connections).toHaveLength(1)});it("stacks colliding labels and increases their row height without changing x",()=>{const state=makeProjectState({milestones:[milestone("1","2026-09-21"),milestone("2","2026-09-21")]});const model=buildTubeMap(state,"2026-09-17");expect(model.stations.map(s=>s.x)).toEqual([model.stations[0].x,model.stations[0].x]);expect(model.stations[1].level).toBeGreaterThan(0);expect(model.streams[0].height).toBeGreaterThan(76)})});


describe("Tube Map off-window lane sizing", () => {
  it("does not expand the project lane for milestones outside the displayed twelve weeks", () => {
    const state = makeProjectState({ milestones: [milestone("1", "2026-01-01"), milestone("2", "2026-01-01"), milestone("3", "2027-01-01")] });
    const model = buildTubeMap(state, "2026-09-17");
    expect(model.streams[0].height).toBe(76);
    expect(model.stations.filter(station => station.boundary !== "inside")).toHaveLength(3);
  });

  it("stacks visible milestones independently of overlapping off-window milestones", () => {
    const state = makeProjectState({ milestones: [milestone("1", "2026-01-01"), milestone("2", "2026-09-21"), milestone("3", "2026-09-21")] });
    const model = buildTubeMap(state, "2026-09-17");
    expect(model.streams[0].height).toBe(106);
    expect(model.stations.filter(station => station.boundary === "inside").map(station => station.level)).toEqual([0, 1]);
  });
});


describe("Tube Map twelve-week boundaries", () => {
  it("includes the first Monday and excludes the Monday after week twelve", () => {
    const state = makeProjectState({ milestones: [milestone("1", "2026-09-14"), milestone("2", "2026-12-06"), milestone("3", "2026-12-07")] });
    const model = buildTubeMap(state, "2026-09-17");
    expect(model.start).toBe("2026-09-14");
    expect(model.end).toBe("2026-12-07");
    expect(model.stations.map(station => station.boundary)).toEqual(["inside", "inside", "after"]);
    expect(model.stations[0].x).toBe(0);
    expect(model.stations[2].x).toBe(100);
  });
});


describe("Tube Map dependency visibility", () => {
  it("does not render a connector when its predecessor milestone is deleted", () => {
    const deleted = { ...milestone("1", "2026-09-21"), deletion: { isDeleted: true } };
    const active = milestone("2", "2026-10-01");
    const state = makeProjectState({ milestones: [deleted, active], dependencies: [{ id: "d", projectId: "project-1", predecessor: { kind: "milestone", id: "1" }, successor: { kind: "milestone", id: "2" }, type: "Finish-to-Start" }] });
    const model = buildTubeMap(state, "2026-09-17");
    expect(model.stations.map(station => station.entityId)).toEqual(["2"]);
    expect(model.connections).toHaveLength(0);
  });
});
