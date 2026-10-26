import {PMP_ENTRY_NAMES} from './types';
export const MAX_ARCHIVE=32*1024*1024;
export const MAX_ENTRY=16*1024*1024;

/** Exact size preflight for the stored-DEFLATE ZIP format used by the writer. */
export function pmpEncodedSizeError(sizes:Readonly<Record<(typeof PMP_ENTRY_NAMES)[number],number>>):string|undefined {
  let archiveSize=22; // ZIP end-of-central-directory record.
  for(const name of PMP_ENTRY_NAMES){
    const size=sizes[name];
    if(size>MAX_ENTRY)return `${name} exceeds the 16 MiB PMP entry limit. Saving was stopped before writing; reduce project content or retained baselines.`;
    const storedSize=size+5*Math.max(1,Math.ceil(size/65535));
    archiveSize+=30+name.length+storedSize+46+name.length;
  }
  if(archiveSize>MAX_ARCHIVE)return 'Project exceeds the 32 MiB PMP archive limit, including container overhead. Saving was stopped before writing; reduce project content or retained baselines.';
}
