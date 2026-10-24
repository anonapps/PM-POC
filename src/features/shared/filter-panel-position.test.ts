import {describe,it,expect} from 'vitest';
import {filterPanelPosition} from './filter-panel-position';
describe('shared filter panel placement',()=>{
 it('opens below when space allows',()=>{expect(filterPanelPosition({left:300,top:100,bottom:134},1440,900)).toEqual({left:300,top:140,width:400,maxHeight:480});});
 it('flips above and stays inside the viewport at the right edge',()=>{const p=filterPanelPosition({left:1300,top:800,bottom:834},1440,900);expect(p.left+p.width).toBe(1432);expect(p.top+p.maxHeight).toBe(794);});
 it('constrains width and height in a small viewport',()=>{const p=filterPanelPosition({left:260,top:100,bottom:134},320,240);expect(p.width).toBe(304);expect(p.left).toBe(8);expect(p.top+p.maxHeight).toBeLessThanOrEqual(232);});
 it('keeps a scrolled offscreen anchor panel on screen',()=>{expect(filterPanelPosition({left:10,top:-100,bottom:-66},1280,900).top).toBe(8);});
});
