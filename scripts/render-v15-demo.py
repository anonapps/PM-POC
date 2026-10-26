#!/usr/bin/env python3
"""Render real timestamped Chromium frames; editorial text stays outside product pixels."""
import argparse
import json
from pathlib import Path
import subprocess
import shutil

parser = argparse.ArgumentParser()
parser.add_argument('capture', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
scenes = json.loads((args.capture / 'scenes.json').read_text())
duration = sum(s['duration'] for s in scenes)
assert 75 <= duration <= 80, duration
font = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
segments = []
for index, scene in enumerate(scenes):
    frames = sorted((f for f in scene['frames'] if f['at'] < scene['duration'] * 1000), key=lambda f: f['at'])
    assert frames and frames[0]['at'] == 0
    lines = []
    for i, frame in enumerate(frames):
        end = frames[i + 1]['at'] if i + 1 < len(frames) else scene['duration'] * 1000
        if end <= frame['at']:
            continue
        lines += [f"file '{frame['file']}'", f"duration {(end - frame['at']) / 1000:.6f}"]
    lines += [f"file '{frames[-1]['file']}'"]
    concat = args.capture / f'scene-{index}.txt'
    concat.write_text('\n'.join(lines) + '\n')
    title = args.capture / f'title-{index}.txt'
    title.write_text(scene['title'])
    segment = args.capture / f'scene-{index}.mp4'
    vf = (f"scale=1840:864,pad=1920:1080:40:144:color=0xf4f1ec,fps=30,"
          f"drawtext=fontfile={font}:textfile={title}:fontcolor=0x17243a:fontsize=30:x=40:y=42,"
          f"drawtext=fontfile={font}:text='ARGOS PM 1.5.0 | Local-first project workspace':fontcolor=0x596477:fontsize=18:x=40:y=100,"
          f"drawtext=fontfile={font}:text='Real application | Fictional data | File-picker adapter | Pointer and focus cues':fontcolor=0x596477:fontsize=16:x=40:y=1034")
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(concat), '-vf', vf, '-r', '30', '-t', str(scene['duration']), '-c:v', 'libx264', '-threads', '2', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-an', str(segment)], check=True)
    segments.append(segment)
playlist = args.capture / 'segments.txt'
playlist.write_text(''.join(f"file '{s}'\n" for s in segments))
args.output.parent.mkdir(parents=True, exist_ok=True)
rendered = args.capture / 'rendered.mp4'
subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(playlist), '-c', 'copy', '-movflags', '+faststart', str(rendered)], check=True)
metadata = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', str(rendered)], text=True))
assert abs(float(metadata['format']['duration']) - duration) < .001, metadata['format']['duration']
assert len(metadata['streams']) == 1
stream = metadata['streams'][0]
assert (stream['codec_name'], stream['width'], stream['height'], stream['r_frame_rate'], int(stream['nb_read_frames'])) == ('h264', 1920, 1080, '30/1', round(duration * 30))
subprocess.run(['ffmpeg', '-v', 'error', '-i', str(rendered), '-f', 'null', '-'], check=True)
shutil.move(str(rendered), args.output)

