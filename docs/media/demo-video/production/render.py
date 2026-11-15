#!/usr/bin/env python3
"""Compose authentic Chromium frames with an editorial header; no UI reconstruction."""
import json,subprocess,os
from pathlib import Path
root=Path(__file__).resolve().parent
cap=root/'capture'
out=Path(os.environ.get('ARGOS_OUTPUT','/workspace/output/demo-video'));out.mkdir(parents=True,exist_ok=True)
r=json.loads((cap/'recording.json').read_text());source_duration=r['duration'];factor=60/source_duration;frames=sorted([{**f,'at':f['at']*factor} for f in r['frames']],key=lambda x:x['at'])
# Timestamp-preserving variable-rate capture, resampled to a 30 FPS delivery timeline.
lines=[]
for i,f in enumerate(frames):
 end=frames[i+1]['at'] if i+1<len(frames) else 60000
 if f['at']>=60000 or end<=f['at']:continue
 lines += ["file '"+f['file']+"'",f"duration {(min(end,60000)-f['at'])/1000:.6f}"]
lines += ["file '"+frames[-1]['file']+"'"]
(cap/'frames.txt').write_text('\n'.join(lines)+'\n')
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
chapter_times={c['key']:c['at']/1000*factor for c in r['chapters']}
copy={
 'overview':('Complex projects. One clear view.','Manage every workstream from one place.'),
 'milestones':('Every milestone. Fully visible.','Track delivery across teams and workstreams.'),
 'baselines':('Plans change. Stay in control.','Compare baselines and spot schedule deviations.'),
 'critical':('Know what drives your deadline.','Identify critical tasks and focus on delivery.'),
 'risks':('See risk. Act early.','Connect risks, mitigation actions and delivery.'),
 'closing':('ARGOS PM','Clarity. Control. Delivery.')}
keys=list(copy)
chapter_times['overview']=0
chapter_times['milestones']=max(3,chapter_times['milestones'])
scenes=[(chapter_times[k],chapter_times[keys[i+1]] if i+1<len(keys) else 60,*copy[k]) for i,k in enumerate(keys)]
vf=['fps=30',"zoompan=z='1+0.004*sin(PI*on/1800)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1840x900:fps=30",'pad=1920:1080:40:150:color=0x101e32']
for i,(a,b,title,sub) in enumerate(scenes):
 for j,txt in enumerate([title,sub]):
  end=b
  path=cap/f'overlay-{i}-{j}.txt';path.write_text(txt)
  # Restrained fade-in/out, two lines, in a dedicated editorial margin.
  alpha=f"if(lt(t,{a+.18}),(t-{a})/0.18,if(gt(t,{end-.18}),({end}-t)/0.18,1))"
  vf.append(f"drawtext=fontfile={bold if j==0 else font}:textfile={path}:fontsize={34 if j==0 else 21}:fontcolor={'white' if j==0 else '0xb9c9df'}:x=48:y={35 if j==0 else 88}:alpha='{alpha}':enable='between(t,{a},{end})'")
cmd=['ffmpeg','-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(cap/'frames.txt'),'-vf',','.join(vf),'-t','60','-r','30','-c:v','libx264','-threads','4','-preset','fast','-crf','18','-pix_fmt','yuv420p','-an','-movflags','+faststart',str(out/'argos-pm-product-demo.mp4')]
subprocess.run(cmd,check=True)
p=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(out/'argos-pm-product-demo.mp4')]))
s=p['streams'][0]
assert len(p['streams'])==1 and s['codec_name']=='h264'
assert (s['width'],s['height'],s['r_frame_rate'],int(s['nb_read_frames']))==(1920,1080,'30/1',1800)
assert abs(float(p['format']['duration'])-60)<.04
subprocess.run(['ffmpeg','-v','error','-i',str(out/'argos-pm-product-demo.mp4'),'-f','null','-'],check=True)
(out/'technical-validation.json').write_text(json.dumps({'media':p,'browserErrors':r['errors'],'pointer':r['cues'],'clickEvents':[{**e,'at':e['at']*factor} for e in r['events']],'chapters':chapter_times,'sourceDuration':source_duration,'timelineFactor':factor,'progressVisible':False,'risks':6,'intentionalHolds':0},indent=2))
print('Validated: 60 seconds, 1920x1080, 30 FPS, H.264, 1800 frames, no audio.')
