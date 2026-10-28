'use client';
import { useState } from 'react';
import uiTokens from '../../../src/ui/tokens.json';
import { ActionButton } from '../../../src/features/shared/action-button';
import { ChoiceRow } from '../../../src/features/shared/choice-row';
import { ReferenceExamples } from './reference-examples';
import { TimelineExamples } from './timeline-examples';
import { RecordExamples } from './record-examples';
import { CreationExamples } from './creation-examples';
import { buildGanttModel, type GanttZoom } from '../../../src/features/gantt/model';
import { buildTubeMap } from '../../../src/features/tube-map/model';
import { createProjectStore } from '../../../src/application';
import { makeProjectState, streamFixture, taskFixture } from '../../../src/domain/test-fixtures';
import { EntityCreationPanel } from '../../../src/features/shared/entity-creation-panel';
import { Dialog } from '../../../src/features/shell/shell';
import { FitTable } from '../../../src/features/shared/fit-table';
import { HumanTextInput, HumanTextArea } from '../../../src/features/shared/human-text';
import { SearchableOwnerSelect } from '../../../src/features/shared/searchable-owner-select';
import { RelationshipPicker } from '../../../src/features/shared/relationship-picker';
import { ModuleSearch } from '../../../src/features/shared/module-search';
import { PageToolbar } from '../../../src/features/shared/page-toolbar';
import { ScopePill } from '../../../src/features/shared/scope-pill';
import { TimelineNavigation } from '../../../src/features/shared/timeline-navigation';
import { TimelineStatusLegend, TASK_STATUS_COLOURS, MILESTONE_STATUS_COLOURS } from '../../../src/features/shared/timeline-status';
import { DependencyConnectors } from '../../../src/features/shared/dependency-connectors';
import { useDependencyFocus } from '../../../src/features/shared/use-dependency-focus';

const people=[{id:'one',name:'Marta',humanId:'PERSON-001'},{id:'two',name:'Long owner name for overflow review',humanId:'PERSON-002'},{id:'deleted',name:'Previous owner',deleted:true}];
const related=[{id:'task-one',humanId:'TASK-001',name:'First task',deletion:{isDeleted:false}},{id:'task-two',humanId:'TASK-002',name:'A long task name for full-value access',deletion:{isDeleted:false}},{id:'removed',humanId:'TASK-003',name:'Previous task',deletion:{isDeleted:true}}];
const paths=[{key:'a-b',fromX:10,fromY:30,toX:70,toY:85,label:'First task → Second task · Finish-to-Start'},{key:'b-c',fromX:70,fromY:85,toX:35,toY:135,label:'Second task → Third task · Finish-to-Start'}];
const sections=['Actions','Fields','Selections','Search','Indicators','Relationships','Containers','Creation','Records','Timelines','Footers','References','Tokens'];
export default function Catalogue() {
  const [store]=useState(()=>{let sequence=0;return createProjectStore(makeProjectState({streams:[streamFixture()],tasks:[taskFixture()],identifierSequences:{stream:1,task:1,milestone:0,person:0,risk:0,decision:0}}),{createId:()=>`catalogue-${++sequence}`,now:()=> '2026-10-27T12:00:00Z'});});
  const [panel,setPanel]=useState<'standalone'|'extended'|null>(null);
  const [dialog,setDialog]=useState(false);
  const [notice,setNotice]=useState('No records created');
  const [owner,setOwner]=useState('');
  const [selected,setSelected]=useState<string[]>(['removed']);
  const [text,setText]=useState('Example record');
  const [query,setQuery]=useState('');
  const [hide,setHide]=useState(false);
  const [offsets,setOffsets]=useState({task:0,milestone:0});
  const [zoom,setZoom]=useState<GanttZoom>('Week');
  const gantt=buildGanttModel(store.getState(),zoom,'2026-10-27',offsets.task);
  const tube=buildTubeMap(store.getState(),new Date(Date.parse('2026-10-26T00:00:00Z')+offsets.milestone*28*86400000).toISOString().slice(0,10));
  const focus=useDependencyFocus();
  return <main className="app-main catalogue">
    <header className="catalogue-intro"><h1>ARGOS PM UI catalogue</h1><p>Compatibility reference · local examples only · no project files or project persistence</p><nav aria-label="Catalogue sections">{sections.map(name=><a key={name} href={`#${name.toLowerCase()}`}>{name}</a>)}</nav></header>
    <div className="workspace"><div className="panel">
      <section id="actions" className="catalogue-section"><h2>Actions</h2><p className="catalogue-note">Generic action classes (36–38px context); compact page actions appear in Search and Footers. Tab to inspect focus; hover and press to inspect states.</p><div className="catalogue-row"><ActionButton type="button">Primary</ActionButton><ActionButton type="button" variant="secondary">Secondary</ActionButton><ActionButton type="button" variant="danger">Delete</ActionButton><ActionButton type="button" disabled>Disabled</ActionButton><ActionButton type="button" variant="secondary" aria-label="More actions">⋯</ActionButton></div></section>
      <section id="fields" className="catalogue-section"><h2>Fields and density</h2><p className="catalogue-note">Actual context classes retain responsive styles. Human text capitalizes on blur; search, date and number values stay native.</p><div className="catalogue-grid">
        <div className="catalogue-sample"><h3>Regular table · 36px</h3><FitTable><thead><tr><th>Name</th></tr></thead><tbody><tr><td><HumanTextInput aria-label="Regular name" value={text} onChange={e=>setText(e.target.value)}/></td></tr></tbody></FitTable></div>
        <div className="catalogue-sample"><h3>Creation · 34px</h3><div className="creation-fields"><label>Name *<HumanTextInput aria-label="Creation name" defaultValue="Creation example"/></label><label>Date<input aria-label="Creation date" type="date" defaultValue="2026-10-27"/></label><label>Invalid example<input aria-label="Invalid example" aria-invalid="true" aria-describedby="catalogue-error" defaultValue=""/><small className="field-error" id="catalogue-error">Name is required</small></label></div></div>
        <div className="catalogue-sample gantt-extended"><h3>Embedded · 30px</h3><div className="gantt-tasks-pane"><FitTable><thead><tr><th>Name</th></tr></thead><tbody><tr><td><input aria-label="Embedded name" defaultValue="Compact example"/></td></tr></tbody></FitTable></div></div>
        <div className="catalogue-sample"><h3>Native and multiline</h3><div className="form-grid"><label>Status<select aria-label="Native status" defaultValue="Not Started"><option>Not Started</option><option>In Progress</option></select></label><label>Progress<input aria-label="Progress" type="number" min="0" max="100" defaultValue="25"/></label><label>Description<HumanTextArea aria-label="Description" defaultValue={'A multiline description\nwith a second line'}/></label><label>Unavailable<input aria-label="Disabled field" disabled value="Read only example" readOnly/></label></div></div>
      </div></section>
      <section id="selections" className="catalogue-section"><h2>Selections and popovers</h2><div className="catalogue-grid"><div className="catalogue-sample"><h3>Owner / single choice</h3><SearchableOwnerSelect label="Catalogue owner" value={owner} people={people} onChange={setOwner}/></div><div className="catalogue-sample"><h3>Multiple relationships / deleted selection</h3><RelationshipPicker label="Catalogue tasks" items={related} selected={selected} onChange={setSelected}/></div><div className="catalogue-sample"><h3>Unavailable owner</h3><SearchableOwnerSelect label="Unavailable owner" value="missing" people={people} onChange={()=>{}} disabled/></div><div className="catalogue-sample"><h3>Native choices</h3><ChoiceRow input={{type:"checkbox",defaultChecked:true}}> Project-wide</ChoiceRow><ChoiceRow input={{type:"checkbox",disabled:true}}> Disabled choice</ChoiceRow><ChoiceRow input={{type:"radio",name:"catalogue-radio",defaultChecked:true}}> First</ChoiceRow><ChoiceRow input={{type:"radio",name:"catalogue-radio"}}> Second</ChoiceRow></div></div></section>
      <section id="search" className="catalogue-section panel"><h2>Search and filter surface</h2><PageToolbar><h2>Example page</h2><ModuleSearch title="catalogue" value={query} onChange={setQuery} placeholder="Search example records" activeFilters={hide} onClearFilters={()=>{setHide(false);focus.clear();}}><label><input type="checkbox" checked={hide} onChange={e=>{setHide(e.target.checked);focus.clear();}}/> Hide dependencies</label></ModuleSearch><div className="toolbar-actions"><button type="button">Add record</button></div></PageToolbar><p role="status">{query?`Local query: ${query}`:'No search query'}</p></section>
      <section id="indicators" className="catalogue-section"><h2>Indicators and semantic palettes</h2><div className="catalogue-row">{['Project-wide','Hardware','Software','Procurement'].map(name=><ScopePill key={name} name={name}/>)}</div><TimelineStatusLegend kind="task"/><TimelineStatusLegend kind="milestone"/></section>
      <section id="relationships" className="catalogue-section"><h2>Relationships</h2><p className="catalogue-note">Synthetic endpoint nodes with real shared connectors. Hover/focus previews; click/Enter/Space pins one relationship; Escape clears. Hide dependencies in Search removes connectors.</p><div className="catalogue-chart">{['a','b','c'].map((name,index)=>{const active=focus.activeKey?.split('-');return <span key={name} className="catalogue-node" data-muted={Boolean(active&&!active.includes(name))} style={{left:`${[10,70,35][index]}%`,top:[20,75,125][index],backgroundColor:TASK_STATUS_COLOURS['In Progress']}}>{['First','Second','Third'][index]}</span>;})}{!hide&&<DependencyConnectors className="catalogue-connectors" height={160} paths={paths} label="Example dependencies" activeKey={focus.activeKey} selectedKey={focus.selectedKey} onPreview={focus.preview} onSelect={focus.select} onClear={focus.clear}/>}</div></section>
      <section id="containers" className="catalogue-section"><h2>Dialogs and creation panels</h2><p className="catalogue-note">Both Task entry points use the same real panel and disposable memory store. Refresh resets all examples. Other page migrations remain pending.</p><div className="catalogue-row"><button type="button" className="secondary" onClick={()=>setDialog(true)}>Open dialog</button><button type="button" onClick={()=>setPanel('standalone')}>Standalone Add Task</button><button type="button" onClick={()=>setPanel('extended')}>Extended Add Task</button></div><p role="status">{notice}</p>{dialog&&<Dialog title="Example dialog" onClose={()=>setDialog(false)}><p>Existing focus trap, Escape dismissal and focus restoration.</p><button type="button" className="secondary" onClick={()=>setDialog(false)}>Close example</button></Dialog>}{panel&&<div className={panel==='extended'?'gantt-extended':''}><EntityCreationPanel kind="task" store={store} onClose={()=>setPanel(null)} onCreated={()=>setNotice(`${store.getState().tasks.length-1} example task(s) created in memory`)}/></div>}</section>
      <section id="footers" className="catalogue-section"><h2>Timeline footers</h2><p className="catalogue-note">Shared existing footer; desktop 56px. Labels and navigation are local demo state.</p>{(['task','milestone'] as const).map(kind=><div key={kind} className="catalogue-sample"><h3>{kind==='task'?'Gantt':'Tube Map'}</h3><TimelineNavigation label={`${kind} example navigation`} start={(kind==='task'?gantt:tube).start} end={(kind==='task'?gantt:tube).end} onPrevious={()=>setOffsets(value=>({...value,[kind]:value[kind]-1}))} onNext={()=>setOffsets(value=>({...value,[kind]:value[kind]+1}))} onToday={()=>setOffsets(value=>({...value,[kind]:0}))} todayDisabled={offsets[kind]===0} legend={<TimelineStatusLegend kind={kind}/>} controls={kind==='task'?<label className="gantt-zoom-control">Zoom <select aria-label="Example zoom" value={zoom} onChange={event=>{setZoom(event.target.value as GanttZoom);setOffsets(value=>({...value,task:0}));}}><option>Week</option><option>Month</option><option>Quarter</option></select></label>:undefined}/></div>)}</section>
      <CreationExamples/>
      <RecordExamples/>
      <TimelineExamples/>
      <ReferenceExamples/>
      <section id="tokens" className="catalogue-section"><h2>Token reference</h2><p className="catalogue-note">Core colors and field/footer metrics use the production token source. Task and milestone status palettes retain their separate domain meanings.</p><div className="catalogue-tokens" data-testid="typography-tokens">{Object.entries(uiTokens.typography).flatMap(([family,scale])=>Object.entries(scale).map(([name,value])=><div key={`${family}-${name}`}><span data-token-font={`${family}-${name}`} style={{fontSize:`var(--ui-${family==='app'?'type':'text'}-${name})`}}>{family} {name} · {value}</span></div>))}</div><div className="catalogue-tokens"><div>Spacing · {Object.values(uiTokens.spacing).join(' / ')}px</div><div>Radius · {Object.entries(uiTokens.radius).map(([name,value])=>`${name} ${value}px`).join(' / ')}</div><div>Actions · {uiTokens.action.height}px high · {uiTokens.action.insetBlock}/{uiTokens.action.insetInline}px inset</div></div><div className="catalogue-tokens" data-testid="core-color-tokens">{Object.entries(uiTokens.coreColor).map(([name,color])=><div key={name}><i className="catalogue-swatch" style={{background:`var(--ui-color-${name.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`)})`}} aria-hidden="true"/><span>{name} · {color}</span></div>)}</div><div className="catalogue-tokens">{Object.entries({...TASK_STATUS_COLOURS,...Object.fromEntries(Object.entries(MILESTONE_STATUS_COLOURS).map(([key,value])=>[`Milestone ${key}`,value]))}).map(([name,color])=><div key={name}><i className="catalogue-swatch" style={{background:color}} aria-hidden="true"/><span>{name} · {color}</span></div>)}</div></section>
    </div></div>
  </main>;
}
