"""Decode the deliverable, inspect narration, and extract final-frame proofs."""
from pathlib import Path
import json
import re
import subprocess
import sys
import wave
import argparse

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.qa' / 'python-media'))
import imageio_ffmpeg

parser = argparse.ArgumentParser()
parser.add_argument('--variant', choices=['natural', 'local'])
args = parser.parse_args()
BASE = ROOT / 'artifacts' / 'wispr-diary-promo'
OUT = BASE / args.variant if args.variant else BASE
VIDEO = OUT / 'wispr-diary-promo.mp4'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
info = subprocess.run([FFMPEG, '-hide_banner', '-i', str(VIDEO)], capture_output=True, text=True).stderr
assert '1920x1080' in info and '24 fps' in info
assert 'h264' in info and 'aac' in info and '48000 Hz' in info
subprocess.run([FFMPEG, '-v', 'error', '-xerror', '-i', str(VIDEO), '-f', 'null', '-'], check=True)
timeline = json.loads((OUT / 'timeline.json').read_text(encoding='utf-8'))


def extract(at, name):
    path = OUT / name
    subprocess.run([FFMPEG, '-v', 'error', '-y', '-ss', str(at), '-i', str(VIDEO), '-frames:v', '1', '-update', '1', str(path)], check=True)
    image = Image.open(path).convert('RGB')
    assert image.size == (1920, 1080)
    return image


contact = Image.new('RGB', (1440, 810), '#fcfaf5')
for i, scene in enumerate(timeline):
    image = extract(scene['start']+min(4.6, scene['duration']-1), f'final-{scene["id"]}.jpg')
    contact.paste(image.resize((480, 270)), ((i%3)*480, (i//3)*270))
contact.save(OUT / 'final-contact-sheet.jpg', quality=95)

early = extract(timeline[3]['start']+0.8, 'final-writing-before.jpg')
late = extract(timeline[3]['start']+timeline[3]['duration']-0.7, 'final-writing-after.jpg')
dark = lambda image: int((np.asarray(image.crop((320, 225, 920, 405))).mean(axis=2) < 130).sum())
assert dark(late) > dark(early)+400, 'The editorial writing reveal must be visible.'

with wave.open(str(OUT / 'narration.wav'), 'rb') as wav:
    narration = np.frombuffer(wav.readframes(wav.getnframes()), dtype='<i2').astype(np.float32)/32768
    seconds = len(narration)/wav.getframerate()
expected = sum(scene['duration'] for scene in timeline)
assert abs(seconds-expected) < 0.02 and seconds > 15
assert 0.8 < np.abs(narration).max() < 0.95
assert np.sqrt(np.mean(narration**2)) > 0.02
volume = subprocess.run([FFMPEG, '-hide_banner', '-i', str(VIDEO), '-vn', '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True).stderr
levels = re.findall(r'(?:mean|max)_volume: [^\n]+', volume)
result = {'duration_seconds': round(seconds, 3), 'resolution': '1920x1080', 'fps': 24, 'bytes': VIDEO.stat().st_size, 'decode': 'passed', 'writing_reveal': 'passed', 'audio_levels': levels}
(OUT / 'verification.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps(result, indent=2))
