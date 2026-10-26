import {it,expect} from 'vitest';
import {MAX_ENTRY,pmpEncodedSizeError} from './limits';
it('allows the reader entry boundary when the complete archive fits',()=>{
 expect(pmpEncodedSizeError({'manifest.json':500,'project.json':MAX_ENTRY,'config.json':1000})).toBeUndefined();
 expect(pmpEncodedSizeError({'manifest.json':500,'project.json':MAX_ENTRY+1,'config.json':1000})).toContain('16 MiB');
});
it('rejects an archive whose raw entries fit but ZIP/DEFLATE overhead exceeds the reader limit',()=>{
 expect(pmpEncodedSizeError({'manifest.json':10,'project.json':MAX_ENTRY-400,'config.json':MAX_ENTRY-400})).toContain('32 MiB');
});
