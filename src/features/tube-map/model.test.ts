import{describe,expect,it}from"vitest";import{makeProjectState,streamFixture}from"../../domain/test-fixtures";import{buildTubeMap,countTubeMilestones,isoWeek,mondayOf}from"./model";const milestone=(id:string,date:string,streamIds:string[]=[])=>({id,projectId:"project-1",humanId:`MILESTONE-00${id}`as const,name:`Gate ${id}`,plannedDate:date,status:"Planned"as const,ownerId:null,scope:streamIds.length?{kind:"streams"as const,streamIds}:{kind:"project"as const},relatedTaskIds:[],deletion:{isDeleted:false}});describe("Tube Map v1.1",()=>{it("has twelve Monday columns",()=>{expect(mondayOf("2026-09-17")).toBe("2026-09-14");expect(isoWeek("2026-09-14")).toBe(38);expect(buildTubeMap(makeProjectState(),"2026-09-17").weeks).toHaveLength(12)});it("calculates ISO week numbers correctly across year boundaries",()=>{expect(isoWeek("2026-01-01")).toBe(1);expect(isoWeek("2027-01-01")).toBe(53);expect(isoWeek("2027-01-04")).toBe(1)});it("always includes Project-wide above ordered streams",()=>{const model=buildTubeMap(makeProjectState({streams:[streamFixture()]}),"2026-09-17");expect(model.streams.map(s=>s.id)).toEqual(["project","stream-1"])});it("creates every multi-stream occurrence at the same x",()=>{const state=makeProjectState({streams:[streamFixture(),streamFixture({id:"s2",humanId:"STREAM-002"})],milestones:[milestone("1","2026-10-01",["stream-1","s2"])]});const stations=buildTubeMap(state,"2026-09-17").stations;expect(stations).toHaveLength(2);expect(new Set(stations.map(s=>s.x)).size).toBe(1)});it("keeps outside milestones outside",()=>{const state=makeProjectState({milestones:[milestone("1","2026-01-01")]});expect(buildTubeMap(state,"2026-09-17").stations[0].boundary).toBe("before")})});

describe("Tube Map layout",()=>{it("renders one entity-level connection between selected occurrences",()=>{const first=milestone("1","2026-09-21",["stream-1"]),second=milestone("2","2026-10-01",["stream-1"]);const state=makeProjectState({streams:[streamFixture()],milestones:[first,second],dependencies:[{id:"d",projectId:"project-1",predecessor:{kind:"milestone",id:"1"},successor:{kind:"milestone",id:"2"},type:"Finish-to-Start"}]});expect(buildTubeMap(state,"2026-09-17").connections).toHaveLength(1)});it("stacks colliding labels without changing the lane height or date",()=>{const state=makeProjectState({milestones:[milestone("1","2026-09-21"),milestone("2","2026-09-21")]});const model=buildTubeMap(state,"2026-09-17");expect(model.stations.map(s=>s.x)).toEqual([model.stations[0].x,model.stations[0].x]);expect(model.stations[1].level).toBeGreaterThan(0);expect(model.streams[0].height).toBe(88)})});


describe("Tube Map off-window lane sizing", () => {
  it("does not expand the project lane for milestones outside the displayed twelve weeks", () => {
    const state = makeProjectState({ milestones: [milestone("1", "2026-01-01"), milestone("2", "2026-01-01"), milestone("3", "2027-01-01")] });
    const model = buildTubeMap(state, "2026-09-17");
    expect(model.streams[0].height).toBe(88);
    expect(model.stations.filter(station => station.boundary !== "inside")).toHaveLength(3);
  });

  it("stacks visible milestones independently of overlapping off-window milestones", () => {
    const state = makeProjectState({ milestones: [milestone("1", "2026-01-01"), milestone("2", "2026-09-21"), milestone("3", "2026-09-21")] });
    const model = buildTubeMap(state, "2026-09-17");
    expect(model.streams[0].height).toBe(88);
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


describe("Tube Map multi-stream dependency selection", () => {
  it("connects the closest pair of milestone occurrences across shared streams", () => {
    const streams = [streamFixture(), streamFixture({ id: "s2", humanId: "STREAM-002" })];
    const state = makeProjectState({ streams, milestones: [milestone("1", "2026-09-21", ["stream-1", "s2"]), milestone("2", "2026-10-01", ["stream-1", "s2"])], dependencies: [{ id: "d", projectId: "project-1", predecessor: { kind: "milestone", id: "1" }, successor: { kind: "milestone", id: "2" }, type: "Finish-to-Start" }] });
    const model = buildTubeMap(state, "2026-09-17");
    expect(model.connections).toHaveLength(1);
    expect(model.connections[0].fromY).toBe(model.connections[0].toY);
    expect(model.connections[0].from).toBe("1");
    expect(model.connections[0].to).toBe("2");
  });
});


describe("Tube Map deleted stream visibility", () => {
  it("does not display milestone occurrences assigned only to deleted streams", () => {
    const deletedStream = { ...streamFixture(), deletion: { isDeleted: true } };
    const state = makeProjectState({ streams: [deletedStream], milestones: [milestone("1", "2026-09-21", ["stream-1"])] });
    const model = buildTubeMap(state, "2026-09-17");
    expect(model.streams.map(stream => stream.id)).toEqual(["project"]);
    expect(model.stations).toHaveLength(0);
  });
});


describe("Tube Map stream sorting", () => {
  it("reorders lanes and milestone positions without changing dependency endpoints", () => {
    const streams = [streamFixture({ name: "Zulu" }), streamFixture({ id: "s2", humanId: "STREAM-002", name: "Alpha" })];
    const state = makeProjectState({ streams, milestones: [milestone("1", "2026-09-21", ["stream-1"]), milestone("2", "2026-10-01", ["s2"])], dependencies: [{ id: "d", projectId: "project-1", predecessor: { kind: "milestone", id: "1" }, successor: { kind: "milestone", id: "2" }, type: "Finish-to-Start" }] });
    const ascending = buildTubeMap(state, "2026-09-17", "asc");
    const descending = buildTubeMap(state, "2026-09-17", "desc");
    expect(ascending.streams.map(stream => stream.label)).toEqual(["Project-wide", "Alpha", "Zulu"]);
    expect(descending.streams.map(stream => stream.label)).toEqual(["Project-wide", "Zulu", "Alpha"]);
    expect(ascending.stations.find(station => station.entityId === "1")?.y).not.toBe(descending.stations.find(station => station.entityId === "1")?.y);
    expect(ascending.connections.map(connection => [connection.from, connection.to])).toEqual([["1", "2"]]);
    expect(descending.connections.map(connection => [connection.from, connection.to])).toEqual([["1", "2"]]);
  });
});


describe("Tube Map label collision boundaries", () => {
  it("stacks adjacent labels near the right edge without changing their dates or positions", () => {
    const state = makeProjectState({ milestones: [milestone("1", "2026-12-05"), milestone("2", "2026-12-06")] });
    const model = buildTubeMap(state, "2026-09-17");
    expect(model.stations.map(station => station.boundary)).toEqual(["inside", "inside"]);
    expect(model.stations[0].x).toBeLessThan(model.stations[1].x);
    expect(model.stations.map(station => station.level)).toEqual([0, 1]);
    expect(model.streams[0].height).toBe(88);
  });

  it("does not stack milestones that have sufficient separation", () => {
    const state = makeProjectState({ milestones: [milestone("1", "2026-09-14"), milestone("2", "2026-12-06")] });
    const model = buildTubeMap(state, "2026-09-17");
    expect(model.stations.map(station => station.level)).toEqual([0, 0]);
    expect(model.streams[0].height).toBe(88);
  });
});


describe("Tube Map dense milestone lanes", () => {
  it("assigns every overlapping visible milestone a distinct level", () => {
    const milestones = Array.from({ length: 120 }, (_, index) => milestone(String(index + 1), "2026-09-21"));
    const state = makeProjectState({ milestones });
    const model = buildTubeMap(state, "2026-09-17");
    expect(model.stations).toHaveLength(120);
    expect(new Set(model.stations.map(station => station.level)).size).toBe(120);
    expect(model.streams[0].height).toBe(88);
    expect(model.height).toBe(model.streams[0].height);
  });
});


describe("Tube Map multi-stream out-of-window counts", () => {
  it("represents a shared milestone as multiple stations with one entity ID", () => {
    const streams = [streamFixture(), streamFixture({ id: "s2", humanId: "STREAM-002" })];
    const state = makeProjectState({ streams, milestones: [milestone("1", "2026-01-01", ["stream-1", "s2"]), milestone("2", "2027-01-01", ["stream-1", "s2"])] });
    const model = buildTubeMap(state, "2026-09-17");
    expect(model.stations.filter(station => station.boundary === "before")).toHaveLength(2);
    expect(new Set(model.stations.filter(station => station.boundary === "before").map(station => station.entityId)).size).toBe(1);
    expect(model.stations.filter(station => station.boundary === "after")).toHaveLength(2);
    expect(new Set(model.stations.filter(station => station.boundary === "after").map(station => station.entityId)).size).toBe(1);
  });
});


describe("Tube Map unique milestone counts", () => {
  it("counts each shared milestone once for either navigation direction", () => {
    const streams = [streamFixture(), streamFixture({ id: "s2", humanId: "STREAM-002" })];
    const state = makeProjectState({ streams, milestones: [milestone("1", "2026-01-01", ["stream-1", "s2"]), milestone("2", "2027-01-01", ["stream-1", "s2"]), milestone("3", "2026-09-21")] });
    const model = buildTubeMap(state, "2026-09-17");
    expect(countTubeMilestones(model.stations, "before")).toBe(1);
    expect(countTubeMilestones(model.stations, "after")).toBe(1);
    expect(countTubeMilestones(model.stations, "inside")).toBe(1);
  });
});


describe("Tube Map fixed-height marker alignment", () => {
  it("keeps all lanes equal and alternates collisions symmetrically", () => {
    const state = makeProjectState({ streams:[streamFixture()], milestones:[milestone("1","2026-09-21"),milestone("2","2026-09-21"),milestone("3","2026-09-21")] });
    const model = buildTubeMap(state,"2026-09-17");
    expect(model.streams.map(stream=>stream.height)).toEqual([88,88]);
    const centre = model.streams[0].top + 44;
    expect(model.stations.map(station=>station.y)).toEqual([centre,centre-17,centre+17]);
  });
});

describe("v1.5 Tube Map empty stream filtering",()=>{it("keeps milestone-bearing streams even when milestones are outside the window",()=>{const state=makeProjectState({streams:[streamFixture(),streamFixture({id:"empty",humanId:"STREAM-002"})],milestones:[milestone("1","2025-01-01",["stream-1"])]});const model=buildTubeMap(state,"2026-09-17","original",true);expect(model.streams.map(stream=>stream.id)).toEqual(["project","stream-1"]);});});

describe("v1.5 Tube Map filtering edge cases",()=>{
 it("ignores deleted milestones",()=>{const state=makeProjectState({streams:[streamFixture()],milestones:[{...milestone("1","2026-09-17",["stream-1"]),deletion:{isDeleted:true}}]});expect(buildTubeMap(state,"2026-09-17","original",true).streams.map(stream=>stream.id)).toEqual(["project"]);});
 it("keeps empty streams when toggle is off",()=>{const state=makeProjectState({streams:[streamFixture()]});expect(buildTubeMap(state,"2026-09-17","original",false).streams.map(stream=>stream.id)).toEqual(["project","stream-1"]);});
});

describe("v1.5 Tube Map shared milestone filtering",()=>{it("retains all streams referenced by a shared milestone",()=>{const state=makeProjectState({streams:[streamFixture(),streamFixture({id:"s2",humanId:"STREAM-002"}),streamFixture({id:"empty",humanId:"STREAM-003"})],milestones:[milestone("1","2027-01-01",["stream-1","s2"])]});const model=buildTubeMap(state,"2026-09-17","original",true);expect(model.streams.map(stream=>stream.id)).toEqual(["project","stream-1","s2"]);expect(model.stations.filter(station=>station.entityId==="1")).toHaveLength(2);});});

describe("v1.5 Tube Map dependency integrity",()=>{
  it("ignores self-referential milestone dependencies",()=>{
    const state=makeProjectState({milestones:[milestone("self","2026-10-01")],dependencies:[{id:"dependency-self",projectId:"project-1",predecessor:{kind:"milestone",id:"self"},successor:{kind:"milestone",id:"self"},type:"Finish-to-Start"}]});
    expect(buildTubeMap(state,"2026-09-17").connections).toHaveLength(0);
  });
  it("preserves valid milestone connections when another dependency references itself",()=>{
    const state=makeProjectState({milestones:[milestone("1","2026-10-01"),milestone("2","2026-10-08")],dependencies:[
      {id:"self",projectId:"project-1",predecessor:{kind:"milestone",id:"1"},successor:{kind:"milestone",id:"1"},type:"Finish-to-Start"},
      {id:"valid",projectId:"project-1",predecessor:{kind:"milestone",id:"1"},successor:{kind:"milestone",id:"2"},type:"Finish-to-Start"},
    ]});
    expect(buildTubeMap(state,"2026-09-17").connections).toEqual([expect.objectContaining({from:"1",to:"2"})]);
  });
});

describe("v1.5 project-wide milestones",()=>{it("preserves the project lane and project-wide stations when all streams are hidden",()=>{const state=makeProjectState({streams:[streamFixture()],milestones:[milestone("1","2026-10-01")]});const model=buildTubeMap(state,"2026-09-17","original",true);expect(model.streams.map(stream=>stream.id)).toEqual(["project"]);expect(model.stations.map(station=>station.entityId)).toEqual(["1"]);});});

describe("v1.5 Tube Map stream sorting with filtering",()=>{it("sorts only populated streams while retaining the project lane first",()=>{const state=makeProjectState({streams:[streamFixture({id:"z",humanId:"STREAM-001",name:"Zeta"}),streamFixture({id:"empty",humanId:"STREAM-002",name:"Empty"}),streamFixture({id:"a",humanId:"STREAM-003",name:"Alpha"})],milestones:[milestone("1","2026-10-01",["z","a"])]});const model=buildTubeMap(state,"2026-09-17","asc",true);expect(model.streams.map(stream=>stream.id)).toEqual(["project","a","z"]);expect(model.stations.filter(station=>station.entityId==="1")).toHaveLength(2);});});

describe("v1.5 Tube Map empty stream sorting",()=>{it("keeps the original stream order when filtering is enabled",()=>{const state=makeProjectState({streams:[streamFixture({id:"z",humanId:"STREAM-001",name:"Zeta"}),streamFixture({id:"empty",humanId:"STREAM-002",name:"Empty"}),streamFixture({id:"a",humanId:"STREAM-003",name:"Alpha"})],milestones:[milestone("1","2026-10-01",["z","a"])]});expect(buildTubeMap(state,"2026-09-17","original",true).streams.map(stream=>stream.id)).toEqual(["project","z","a"]);});});

describe("v1.5 undated Tube Map milestones",()=>{it("keeps the populated stream but does not render invalid stations",()=>{const state=makeProjectState({streams:[streamFixture()],milestones:[milestone("1","",["stream-1"])]});const model=buildTubeMap(state,"2026-09-17","original",true);expect(model.streams.map(stream=>stream.id)).toEqual(["project","stream-1"]);expect(model.stations).toHaveLength(0);});});

describe("v1.5 invalid milestone dates",()=>{it("retains the stream but omits impossible calendar dates",()=>{const state=makeProjectState({streams:[streamFixture()],milestones:[milestone("invalid","2026-02-30",["stream-1"])]});const model=buildTubeMap(state,"2026-02-16","original",true);expect(model.streams.map(stream=>stream.id)).toEqual(["project","stream-1"]);expect(model.stations).toHaveLength(0);});});

describe("v1.5 Tube Map leap dates",()=>{it("accepts a real leap-day milestone",()=>{const state=makeProjectState({streams:[streamFixture()],milestones:[milestone("leap","2028-02-29",["stream-1"])]});const model=buildTubeMap(state,"2028-02-28","original",true);expect(model.stations.some(station=>station.entityId==="leap")).toBe(true);});});

describe("v1.5 strict milestone date parsing",()=>{it("ignores timestamp-formatted milestone dates without losing stream lanes",()=>{const state=makeProjectState({streams:[streamFixture()],milestones:[milestone("timestamp","2026-09-17T12:00:00Z",["stream-1"])]});const model=buildTubeMap(state,"2026-09-17","original",true);expect(model.streams.map(stream=>stream.id)).toEqual(["project","stream-1"]);expect(model.stations).toHaveLength(0);});});


describe("v1.5 stale milestone scopes",()=>{
  it("omits stations for deleted streams while preserving valid project stations",()=>{
    const state=makeProjectState({streams:[streamFixture({id:"removed",deletion:{isDeleted:true}})],milestones:[milestone("stale","2026-10-01",["removed"]),milestone("valid","2026-10-01")]});
    const model=buildTubeMap(state,"2026-09-17");
    expect(model.streams.map(stream=>stream.id)).toEqual(["project"]);
    expect(model.stations.map(station=>station.entityId)).toEqual(["valid"]);
  });
  it("omits stations for missing stream references",()=>{
    const state=makeProjectState({milestones:[milestone("orphan","2026-10-01",["unknown-stream"])]});
    expect(buildTubeMap(state,"2026-09-17").stations).toHaveLength(0);
  });
});


describe("v1.5 valid lane retention",()=>{
  it("retains stations for active streams while dropping stale stream references",()=>{
    const state=makeProjectState({streams:[streamFixture({id:"live",name:"Live"}),streamFixture({id:"removed",humanId:"STREAM-002",deletion:{isDeleted:true}})],milestones:[milestone("gate","2026-10-01",["live","removed"])]});
    const model=buildTubeMap(state,"2026-09-17");
    expect(model.stations.map(station=>station.id)).toEqual(["gate:live"]);
  });
});


describe("v1.5 Tube Map live stream search",()=>{
  it("filters stream lanes case-insensitively while keeping Project-wide",()=>{
    const state=makeProjectState({streams:[streamFixture({id:"one",name:"Platform Delivery"}),streamFixture({id:"two",humanId:"STREAM-002",name:"Security"})],milestones:[milestone("one","2026-10-01",["one"]),milestone("two","2026-10-01",["two"])]});
    const model=buildTubeMap(state,"2026-09-17","original",false,"  PLATform  ");
    expect(model.streams.map(stream=>stream.id)).toEqual(["project","one"]);
    expect(model.stations.map(station=>station.entityId)).toEqual(["one"]);
  });
  it("combines Hide Empty Streams with a live stream query",()=>{
    const state=makeProjectState({streams:[streamFixture({id:"one",name:"Platform Delivery"}),streamFixture({id:"two",humanId:"STREAM-002",name:"Platform Empty"})],milestones:[milestone("one","2026-10-01",["one"])]});
    expect(buildTubeMap(state,"2026-09-17","original",true,"platform").streams.map(stream=>stream.id)).toEqual(["project","one"]);
  });
});
