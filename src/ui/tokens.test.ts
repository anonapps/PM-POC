import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import tokens from './tokens.json';
import { TASK_STATUSES, MILESTONE_STATUSES } from '../domain';
import { TASK_STATUS_COLOURS, MILESTONE_STATUS_COLOURS } from '../features/shared/timeline-status';

describe('approved UI compatibility tokens',()=>{
  it('keeps approved density metrics and distinct domain palettes',()=>{
    expect(tokens.field).toEqual({regular:36,creation:34,embedded:30,textLine:20,textInset:8});
    expect(tokens.timelineFooterMinHeight).toBe(56);
    expect(Object.keys(tokens.taskStatus)).toEqual([...TASK_STATUSES]);
    expect(Object.keys(tokens.milestoneStatus)).toEqual([...MILESTONE_STATUSES]);
    expect(TASK_STATUS_COLOURS).toEqual({Tentative:'#9d8ab8','Not Started':'#a0adbd','In Progress':'#6b97c4','On Hold':'#c4a36c',Completed:'#7ca58a',Cancelled:'#bb8585'});
    expect(MILESTONE_STATUS_COLOURS).toEqual({Tentative:'#93c5fd',Planned:'#7c3aed',Delayed:'#fca5a5',Complete:'#16a34a'});
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
