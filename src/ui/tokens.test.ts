import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import tokens from './tokens.json';
import { TASK_STATUSES, MILESTONE_STATUSES } from '../domain';
import { TASK_STATUS_COLOURS, MILESTONE_STATUS_COLOURS } from '../features/shared/timeline-status';

describe('approved UI compatibility tokens',()=>{
  it('preserves core semantic colors through the existing compatibility aliases',()=>{
    const expected = {
      canvas:'#f4f6f8',surface:'#ffffff',surfaceSubtle:'#edf1f5',text:'#0f172a',textMuted:'#526174',
      border:'#dce2e9',controlBorder:'#8293a8',primary:'#164a91',primaryHover:'#123e7a',
      primaryActive:'#0e3263',sidebar:'#17243a',focus:'#1b65c9',
    };
    expect(tokens.coreColor).toEqual(expected);
    const generated=readFileSync('src/app/ui-tokens.generated.css','utf8');
    const compatibility=readFileSync('src/app/design-system.css','utf8').match(/:root\s*\{([^}]+)\}/)?.[1];
    expect(compatibility).toBeDefined();
    for(const [name,color] of Object.entries(expected)){
      const alias=name.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`);
      expect(generated).toContain(`--ui-color-${alias}: ${color};`);
      expect(compatibility).toContain(`--${alias}: var(--ui-color-${alias});`);
    }
  });
  it('keeps approved density metrics and distinct domain palettes',()=>{
    expect(tokens.field).toEqual({regular:36,creation:34,embedded:30,textLine:20,textInset:8});
    expect(tokens.timelineFooterMinHeight).toBe(56);
    expect(Object.keys(tokens.taskStatus)).toEqual([...TASK_STATUSES]);
    expect(Object.keys(tokens.milestoneStatus)).toEqual([...MILESTONE_STATUSES]);
    expect(TASK_STATUS_COLOURS).toEqual({Tentative:'#9d8ab8','Not Started':'#a0adbd','In Progress':'#6b97c4','On Hold':'#c4a36c',Completed:'#7ca58a',Cancelled:'#bb8585'});
    expect(MILESTONE_STATUS_COLOURS).toEqual({Tentative:'#93c5fd',Planned:'#7c3aed',Delayed:'#fca5a5',Complete:'#16a34a'});
  });
  it('retains both exact typography scales and their separate compatibility interfaces',()=>{
    const app={display:'2rem',kpi:'1.65rem',section:'1rem',body:'.9rem',control:'.8rem',caption:'.72rem'};
    const baseline={xs:'.75rem',sm:'.8125rem',base:'.875rem',section:'1rem',page:'1.25rem',display:'1.75rem'};
    expect(tokens.typography).toEqual({app,baseline});
    const generated=readFileSync('src/app/ui-tokens.generated.css','utf8');
    const globals=readFileSync('src/app/globals.css','utf8');
    const design=readFileSync('src/app/design-system.css','utf8');
    for(const [scale,prefix,source] of [[app,'type',globals],[baseline,'text',design]] as const){
      for(const [name,value] of Object.entries(scale)){
        expect(generated).toContain(`--ui-${prefix}-${name}: ${value};`);
        expect(source).toMatch(new RegExp(`--${prefix}-${name}:\\s*var\\(--ui-${prefix}-${name}\\);`));
      }
    }
    expect(globals).toContain('--type-page-title:var(--type-caption);');
  });
  it('preserves named spacing, radii and ordinary action metrics without normalizing contexts',()=>{
    const spacing={'1':4,'2':8,'3':12,'4':16,'6':24,'8':32,'12':48,'16':64};
    const radius={control:6,card:8,dialog:12};
    const action={height:30,radius:6,font:'var(--type-control)',insetBlock:2,insetInline:10,weight:600,lineHeight:1.1};
    expect(tokens.spacing).toEqual(spacing);
    expect(tokens.radius).toEqual(radius);
    expect(tokens.action).toEqual(action);
    const generated=readFileSync('src/app/ui-tokens.generated.css','utf8');
    const design=readFileSync('src/app/design-system.css','utf8');
    const globals=readFileSync('src/app/globals.css','utf8');
    for(const [prefix,values] of [['space',spacing],['radius',radius]] as const){
      for(const [name,value] of Object.entries(values)){
        expect(generated).toContain(`--ui-${prefix}-${name}: ${value}px;`);
        expect(design).toContain(`--${prefix}-${name}: var(--ui-${prefix}-${name});`);
      }
    }
    for(const [name,value] of Object.entries(action)){
      const kebab=name.replace(/[A-Z]/g,letter=>`-${letter.toLowerCase()}`);
      const unit=['height','radius','insetBlock','insetInline'].includes(name)?'px':'';
      expect(generated).toContain(`--ui-action-${kebab}: ${value}${unit};`);
    }
    for(const name of ['height','radius','font']){
      expect(globals).toContain(`--action-${name}:var(--ui-action-${name});`);
    }
    expect(globals).toContain('padding:var(--ui-action-inset-block) var(--ui-action-inset-inline);');
    expect(globals).toContain('font-weight:var(--ui-action-weight);');
    expect(globals).toContain('line-height:var(--ui-action-line-height);');
  });
  it('ships fresh generated CSS and loads it before compatibility rules',()=>{
    expect(execFileSync(process.execPath,['scripts/generate-ui-tokens.mjs','--check'],{encoding:'utf8'})).toContain('match');
    for(const file of ['src/app/layout.tsx','tools/ui-catalogue/app/layout.tsx']){
      const source=readFileSync(file,'utf8');
      expect(source.indexOf('ui-tokens.generated.css')).toBeGreaterThan(-1);
      expect(source.indexOf('ui-tokens.generated.css')).toBeLessThan(source.indexOf('globals.css'));
    }
  });
});
