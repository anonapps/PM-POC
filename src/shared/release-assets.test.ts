import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
/** Read the actual MP4 independently of the renderer/ffprobe; no external test tool required. */
interface Box {type:string;start:number;end:number;data:number}
function boxes(bytes:Buffer,start=0,end=bytes.length):Box[]{
 const result:Box[]=[];
 while(start<end){if(end-start<8)throw new Error('Truncated MP4 box');let size=bytes.readUInt32BE(start),header=8;const type=bytes.toString('ascii',start+4,start+8);if(size===1){size=Number(bytes.readBigUInt64BE(start+8));header=16;}if(size===0)size=end-start;if(size<header||start+size>end)throw new Error('Invalid MP4 box size');result.push({type,start,end:start+size,data:start+header});start+=size;}
 return result;
}
const child=(bytes:Buffer,parent:Box,type:string)=>{const box=boxes(bytes,parent.data,parent.end).find(b=>b.type===type);if(!box)throw new Error(`Missing MP4 ${type}`);return box;};
describe('published v1.5 demonstration contract',()=>{
 it('ships a complete 75–80-second full-HD silent H.264 video, not old footage or a truncated export',()=>{
  const bytes=readFileSync(new URL('../../docs/media/argos-pm-demo-v1.5.0.mp4',import.meta.url));const roots=boxes(bytes);expect(roots.some(b=>b.type==='mdat'&&b.end-b.data>100_000)).toBe(true);const moov=roots.find(b=>b.type==='moov')!;expect(moov).toBeDefined();const mvhd=child(bytes,moov,'mvhd'),version=bytes[mvhd.data];const timescale=bytes.readUInt32BE(mvhd.data+(version===1?20:12)),duration=version===1?Number(bytes.readBigUInt64BE(mvhd.data+24)):bytes.readUInt32BE(mvhd.data+16);expect(duration/timescale).toBeGreaterThanOrEqual(75);expect(duration/timescale).toBeLessThanOrEqual(80);
  const tracks=boxes(bytes,moov.data,moov.end).filter(b=>b.type==='trak');expect(tracks).toHaveLength(1);const track=tracks[0],tkhd=child(bytes,track,'tkhd');expect(bytes.readUInt32BE(tkhd.end-8)/65536).toBe(1920);expect(bytes.readUInt32BE(tkhd.end-4)/65536).toBe(1080);
  const mdia=child(bytes,track,'mdia'),hdlr=child(bytes,mdia,'hdlr');expect(bytes.toString('ascii',hdlr.data+8,hdlr.data+12)).toBe('vide');const stsd=child(bytes,child(bytes,child(bytes,mdia,'minf'),'stbl'),'stsd');expect(bytes.toString('ascii',stsd.data+12,stsd.data+16)).toBe('avc1');const stts=child(bytes,child(bytes,child(bytes,mdia,'minf'),'stbl'),'stts');let count=0,ticks=0;for(let i=0;i<bytes.readUInt32BE(stts.data+4);i++){const n=bytes.readUInt32BE(stts.data+8+i*8),delta=bytes.readUInt32BE(stts.data+12+i*8);count+=n;ticks+=n*delta;}const mdhd=child(bytes,mdia,'mdhd'),scale=bytes.readUInt32BE(mdhd.data+12);expect(count/(ticks/scale)).toBe(30);expect(count).toBe(duration/timescale*30);
 });
 it('ties the verified lifecycle/cursor evidence to the actual movie and saved project',()=>{
  const evidence=JSON.parse(readFileSync(new URL('../../docs/media/argos-pm-demo-v1.5.0-verification.json',import.meta.url),'utf8'));
  const hash=(file:string)=>createHash('sha256').update(readFileSync(new URL('../../docs/media/'+file,import.meta.url))).digest('hex');expect(hash(evidence.video)).toBe(evidence.sha256);expect(hash('Atlas-Software-Delivery.pmp')).toBe(evidence.pmpSha256);expect(evidence.duration).toBe(78);expect(evidence.chapters.reduce((sum:number,c:{duration:number})=>sum+c.duration,0)).toBe(78);expect(evidence.counts).toEqual({streams:4,people:5,tasks:8,milestones:9,risks:2,decisions:2});expect(evidence.milestoneDistribution).toEqual([2,2,5,0]);expect(evidence.closed).toBe(true);expect(evidence.warningsAfter).toEqual([]);expect(evidence.cues.clicks).toBeGreaterThan(50);expect(evidence.cues.moves).toBeGreaterThan(50);expect(evidence.cues.focuses).toBeGreaterThan(50);expect(evidence.chapters.every((c:{cues:{moves:number}})=>c.cues.moves>0)).toBe(true);const readme=readFileSync(new URL('../../README.md',import.meta.url),'utf8');expect(readme).toContain('[Watch Video](https://anonapps.github.io/PM-POC/videos/latest/)');expect(readme).not.toMatch(/\[[^\]]*download[^\]]*\]\(/i);expect(readme).not.toMatch(/\]\([^)]*(?:raw\/|releases\/download)[^)]*\.mp4\)/i);
 });
});
