import {describe,expect,it} from 'vitest';
import {revealFilteredRecord} from './navigation-reveal';
import {createNavigationSession} from './navigation-session';

describe('transient record navigation',()=>{
 it('reveals a hidden or deleted target in collection order without changing filter inputs',()=>{
  const records=[{id:'a',deleted:false},{id:'b',deleted:true},{id:'c',deleted:false}],visible=[records[2]];
  const before=JSON.stringify({records,visible});
  expect(revealFilteredRecord(records,visible,'b')).toEqual([records[1],records[2]]);
  expect(JSON.stringify({records,visible})).toBe(before);
  expect(revealFilteredRecord(records,visible)).toBe(visible);
 });
 it('does not create missing records or duplicate visible records',()=>{
  const records=[{id:'a'},{id:'b'}],visible=[records[1]];
  expect(revealFilteredRecord(records,visible,'missing')).toBe(visible);
  expect(revealFilteredRecord(records,visible,'b')).toBe(visible);
 });
 it('preserves Search and destination preferences for return journeys, resetting ordinary navigation',()=>{
  const session=createNavigationSession();
  session.values.set('search.query','handover');session.values.set('search.types',['Task']);session.values.set('Tasks.tasks.filters',{Status:['Completed']});
  session.prepareNavigation('Tasks','Search');session.prepareNavigation('Search','Tasks');
  expect(session.values.get('Tasks.tasks.filters')).toEqual({Status:['Completed']});
  session.prepareNavigation('Tasks','People');
  expect(session.values.has('Tasks.tasks.filters')).toBe(false);
  expect(session.values.get('search.query')).toBe('handover');expect(session.values.get('search.types')).toEqual(['Task']);
  expect(createNavigationSession().values.size).toBe(0);
 });
});
