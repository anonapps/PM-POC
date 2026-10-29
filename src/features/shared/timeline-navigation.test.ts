import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {TimelineNavigation} from './timeline-navigation';
import {timelineColumns,todayPosition,type GanttZoom} from '../gantt/model';
import {makeProjectState} from '../../domain/test-fixtures';
import {buildGanttModel} from '../gantt/model';
const handlers={onPrevious(){},onNext(){},onToday(){}};
describe('shared calendar footer',()=>{
 it('orders navigation and inclusive calendar dates without timezone conversion',()=>{
  const html=renderToStaticMarkup(createElement(TimelineNavigation,{...handlers,label:'Gantt date navigation',start:'2026-12-31',end:'2027-01-11',todayDisabled:true}));
  expect(html).toContain('31/12/2026 – 11/01/2027');
  expect(html.indexOf('← Previous')).toBeLessThan(html.indexOf('31/12/2026'));
  expect(html.indexOf('11/01/2027')).toBeLessThan(html.indexOf('Next →'));
  expect(html.indexOf('Next →')).toBeLessThan(html.indexOf('Jump to today'));
  expect(html).toContain('disabled=""');
 });
 it('retains Tube Map labels and context while allowing today away from origin',()=>{
  const html=renderToStaticMarkup(createElement(TimelineNavigation,{...handlers,label:'Tube Map date navigation',start:'2026-12-07',end:'2027-02-28',todayDisabled:false,previousLabel:'← Previous 4 weeks (2 before)',context:'3 connections'}));
  expect(html).toContain('Previous 4 weeks (2 before)');expect(html).toContain('07/12/2026 – 28/02/2027');expect(html).toContain('<small class="timeline-navigation-context">3 connections</small>');expect(html.indexOf('3 connections')).toBeLessThan(html.indexOf('timeline-navigation-controls'));expect(html).not.toContain('disabled=');
 });
});
describe('Gantt footer preserves each existing navigation increment',()=>{
 for(const [zoom,days] of [['Week',1],['Month',7],['Quarter',14]] as const)it(`${zoom} moves ${days} days and returns to today across year/leap boundaries`,()=>{
  for(const today of ['2026-12-31','2028-02-29']){
   const initial=timelineColumns(zoom,today),next=timelineColumns(zoom,today,1),previous=timelineColumns(zoom,today,-1);
   expect((Date.parse(next[0].start)-Date.parse(initial[0].start))/86400000).toBe(days);
   expect((Date.parse(initial[0].start)-Date.parse(previous[0].start))/86400000).toBe(days);
   const state=makeProjectState();const model=buildGanttModel(state,zoom as GanttZoom,today,0);
   expect(model.start).toBe(initial[0].start);expect(model.end).toBe(initial.at(-1)!.end);
   expect(todayPosition(today,model.start,model.end)).not.toBeNull();
  }
 });
});
