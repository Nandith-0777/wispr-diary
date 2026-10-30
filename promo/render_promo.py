"""Render a 1080p narrated, illustrated walkthrough from real UI captures.

Fictional UI fixtures and editorial reveals are intentional: this is not a
recording of live speech recognition. No private diary or account is used.
"""
from pathlib import Path
import json
import math
import subprocess
import sys
import wave
import argparse

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.qa' / 'python-media'))
import imageio_ffmpeg

parser = argparse.ArgumentParser()
parser.add_argument('--variant', choices=['natural', 'local'])
parser.add_argument('--preview', action='store_true')
args = parser.parse_args()
BASE = ROOT / 'artifacts' / 'wispr-diary-promo'
OUT = BASE / args.variant if args.variant else BASE
SHOTS = BASE / 'shots'
OUT.mkdir(parents=True, exist_ok=True)
voice_info = json.loads((OUT / 'voice-info.json').read_text(encoding='utf-8')) if (OUT / 'voice-info.json').exists() else {}
if args.variant and not voice_info:
    raise SystemExit('Generate the voice clips and voice-info.json for this variant first. The original cut is unchanged.')
narrator = voice_info.get('label', 'synthesized Microsoft Zira narration')
W, H, FPS = 1920, 1080, 24
INK = '#302335'
PURPLE = '#7953a5'
PAPER = '#fcfaf5'
FONT_DIR = Path('C:/Windows/Fonts')


def font(size, serif=False, bold=False):
    name = ('georgiab.ttf' if bold else 'georgia.ttf') if serif else ('segoeuib.ttf' if bold else 'segoeui.ttf')
    return ImageFont.truetype(str(FONT_DIR / name), size)


def wrap(text, face, max_width):
    lines, line = [], ''
    for word in text.split():
        candidate = (line + ' ' + word).strip()
        if face.getlength(candidate) > max_width and line:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line:
        lines.append(line)
    return lines


def center(draw, y, value, face, fill=INK):
    draw.text(((W - face.getlength(value)) / 2, y), value, font=face, fill=fill)


def asterisk(draw, x, y, radius=18, color=PURPLE):
    for angle in range(0, 180, 30):
        r = math.radians(angle)
        dx, dy = radius * math.cos(r), radius * math.sin(r)
        draw.line((x-dx, y-dy, x+dx, y+dy), fill=color, width=3)


def background():
    image = Image.new('RGB', (W, H), PAPER)
    draw = ImageDraw.Draw(image)
    for x in range(0, W, 48):
        draw.line((x, 0, x, H), fill='#f1ede5')
    for y in range(0, H, 48):
        draw.line((0, y, W, y), fill='#f1ede5')
    draw.text((64, 22), 'wispr diary', font=font(36, True, True), fill=INK)
    asterisk(draw, 306, 47, 15)
    return image


BG = background()
scenes = json.loads((ROOT / 'promo' / 'scenes.json').read_text(encoding='utf-8'))
images = {path.stem: Image.open(path).convert('RGB') for path in SHOTS.glob('*.jpg')}
for i, scene in enumerate(scenes):
    with wave.open(str(OUT / 'voice' / f'{i:02}-{scene["id"]}.wav'), 'rb') as wav:
        assert wav.getnchannels() == 1 and wav.getsampwidth() == 2
        scene['rate'] = wav.getframerate()
        scene['samples'] = np.frombuffer(wav.readframes(wav.getnframes()), dtype='<i2').copy()
        scene['voice_seconds'] = len(scene['samples']) / scene['rate']
    scene['frames'] = math.ceil((scene['voice_seconds'] + 1.1) * FPS)
    if scene['id'] == 'outro':
        scene['frames'] += 2 * FPS
    scene['seconds'] = scene['frames'] / FPS

assert len({s['rate'] for s in scenes}) == 1
RATE = scenes[0]['rate']
audio = []
timeline = []
elapsed = 0
subtitle_items = []
for scene in scenes:
    scene['start'] = elapsed
    lead = int(0.35 * RATE)
    total = round(scene['seconds'] * RATE)
    segment = np.zeros(total, dtype=np.float32)
    speech = scene['samples'].astype(np.float32) / 32768
    segment[lead:lead+len(speech)] = speech
    audio.append(segment)
    # Short, readable captions, with timing proportional to spoken word count.
    groups, current = [], ''
    for word in scene['voice'].split():
        if len(current + ' ' + word) > 86 and current:
            groups.append(current)
            current = word
        else:
            current = (current + ' ' + word).strip()
    if current:
        groups.append(current)
    total_words = sum(len(g.split()) for g in groups)
    cursor = 0
    scene['captions'] = []
    for text in groups:
        duration = scene['voice_seconds'] * len(text.split()) / total_words
        item = {'start': elapsed+0.35+cursor, 'end': elapsed+0.35+cursor+duration, 'text': text}
        subtitle_items.append(item)
        scene['captions'].append(item)
        cursor += duration
    timeline.append({'id': scene['id'], 'start': round(elapsed, 3), 'duration': scene['seconds'], 'narration': scene['voice']})
    elapsed += scene['seconds']

combined = np.concatenate(audio)
peak = float(np.max(np.abs(combined)))
combined *= 0.89 / peak
with wave.open(str(OUT / 'narration.wav'), 'wb') as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(RATE)
    wav.writeframes((combined*32767).astype('<i2').tobytes())


def timestamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'


(OUT / 'captions.srt').write_text('\n\n'.join(f'{i+1}\n{timestamp(s["start"])} --> {timestamp(s["end"])}\n{s["text"]}' for i, s in enumerate(subtitle_items))+'\n', encoding='utf-8')
(OUT / 'timeline.json').write_text(json.dumps(timeline, indent=2), encoding='utf-8')
(OUT / 'transcript.md').write_text('# Wispr Diary — promo narration\n\n'+ '\n\n'.join(s['voice'] for s in scenes)+'\n\nIllustrated walkthrough with fictional diary content and '+narrator+'. The writing reveal is editorial animation; live Wispr transcription is not being demonstrated.\n', encoding='utf-8')


def pill(image, text, y=890, color='#d0f775'):
    face = font(19, bold=True)
    width = int(face.getlength(text)) + 42
    x = (W-width)//2
    d = ImageDraw.Draw(image)
    d.rounded_rectangle((x, y, x+width, y+42), radius=21, fill=color, outline='#bea8cc')
    d.text((x+21, y+8), text, font=face, fill=INK)


def outro():
    frame = BG.copy()
    d = ImageDraw.Draw(frame)
    d.text((130, 245), 'A LITTLE PLACE FOR YOUR LIFE', font=font(19, bold=True), fill=PURPLE)
    d.text((125, 330), 'Less typing.', font=font(105, True), fill=INK)
    d.text((125, 465), 'More living.', font=font(105, True), fill=PURPLE)
    d.text((132, 635), 'Your stories. Your memories. Your book.', font=font(28), fill='#75637d')
    d.rounded_rectangle((130, 725, 585, 799), radius=4, fill='#d0f775', outline=INK, width=2)
    d.text((164, 746), 'MAKE YOUR OWN BOOK', font=font(24, bold=True), fill=INK)
    d.line((536, 767, 553, 750), fill=INK, width=2)
    d.line((541, 750, 553, 750, 553, 762), fill=INK, width=2)
    cover = images['08-outro'].crop((704, 222, 1257, 929)).resize((553, 707), Image.Resampling.LANCZOS)
    frame.paste(cover, (1210, 185))
    asterisk(d, 1095, 300, 54)
    d.text((132, 880), 'WISPR DIARY', font=font(17, bold=True), fill=PURPLE)
    return frame


OUTRO = outro()
OUTRO.save(OUT / 'poster.jpg', quality=95)


def source_for(scene, seconds):
    key = f'{scenes.index(scene):02}-{scene["id"]}'
    if scene['id'] == 'tour':
        keys = ['02-tour', '02-tour-voice', '02-tour-memories', '02-tour-library']
        return images[keys[min(3, int(seconds/scene['seconds']*4))]]
    if scene['id'] == 'journal':
        image = images[key].copy()
        d = ImageDraw.Draw(image)
        d.rectangle((193, 155, 930, 400), fill='white')
        d.rectangle((992, 155, 1730, 430), fill='white')
        progress = max(0, min(1, (seconds-0.7)/(scene['seconds']-1.6)))
        left = int(245*min(1, progress/0.58))
        right = int(275*max(0, (progress-0.58)/0.42))
        image.paste(images[key].crop((193, 155, 930, 155+left)), (193, 155))
        image.paste(images[key].crop((992, 155, 1730, 155+right)), (992, 155))
        return image
    note_delay = scene['voice_seconds']*0.32+0.35 if args.variant else 3.1
    if scene['id'] == 'note' and seconds < note_delay:
        return images['03-journal']
    if scene['id'] == 'media' and seconds < (scene['voice_seconds']*0.3+0.35 if args.variant else 2.5):
        return images['05-add-menu']
    if scene['id'] == 'contents' and seconds < (scene['voice_seconds']*0.56+0.35 if args.variant else 4.2):
        return images['06-paper']
    if scene['id'] == 'library' and seconds > (scene['voice_seconds']*0.34+0.35 if args.variant else 3.8):
        return images['07-ideas']
    return images[key]


def frame_for(scene, seconds):
    if scene['id'] == 'outro':
        frame = OUTRO.copy()
    else:
        frame = BG.copy()
        draw = ImageDraw.Draw(frame)
        title = scene['title'].replace('\n', ' ')
        center(draw, 25, title, font(34, True))
        draw.text((1740, 33), f'{scenes.index(scene)+1:02} / 09', font=font(19), fill=PURPLE)
        source = source_for(scene, seconds)
        # A small editorial pull-in; UI captures remain fully visible.
        progress = min(1, seconds / scene['seconds'])
        size = 0.985 + 0.015*progress
        sw, sh = round(1600*size), round(900*size)
        shot = source.resize((sw, sh), Image.Resampling.BICUBIC)
        x, y = (W-sw)//2, 91+(900-sh)//2
        draw.rounded_rectangle((x-3, y-3, x+sw+6, y+sh+8), radius=7, fill='#e2d7e7')
        frame.paste(shot, (x, y))
        if scene['id'] == 'journal':
            pill(frame, 'SCRIPTED WRITING PREVIEW · Wispr API activation pending', 915, '#eee5f6')
        if scene['id'] == 'note':
            delay = scene['voice_seconds']*0.32+0.35 if args.variant else 3.1
            pill(frame, '“Diary, add note: remember the little things.”' if seconds < delay else 'A little thought, kept on the page.', 916)
    d = ImageDraw.Draw(frame)
    now = scene['start'] + seconds
    caption = next((c['text'] for c in scene['captions'] if c['start'] <= now < c['end']), '')
    for i, line in enumerate(wrap(caption, font(25), 1660)):
        center(d, 1008 + i*29, line, font(25))
    small_print = 'Illustrated walkthrough · fictional diary · '+('AI-generated narration' if args.variant else 'synthesized narration')
    if scene['id'] == 'media':
        small_print = 'Movie-night example: Big Buck Bunny © 2008 Blender Foundation · CC BY 3.0 · bigbuckbunny.org'
    center(d, 1063, small_print, font(12), '#97839d')
    # A thin page-progress line adds movement without hiding controls.
    d.rectangle((0, H-3, int(W*(now/elapsed)), H), fill=PURPLE)
    return frame


if args.preview:
    contact = Image.new('RGB', (1440, 810), PAPER)
    for i, scene in enumerate(scenes):
        seconds = min(4.6, scene['seconds']-1)
        frame = frame_for(scene, seconds)
        frame.save(OUT / f'preview-{scene["id"]}.jpg', quality=93)
        contact.paste(frame.resize((480, 270)), ((i%3)*480, (i//3)*270))
    contact.save(OUT / 'contact-sheet.jpg', quality=95)
    print('Preview frames and contact sheet created.')
    sys.exit(0)

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
output = OUT / 'wispr-diary-promo.mp4'
command = [ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', str(OUT/'narration.wav'), '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', '-shortest', str(output)]
process = subprocess.Popen(command, stdin=subprocess.PIPE)
previous = None
try:
    for i, scene in enumerate(scenes):
        print(f'Rendering {i+1}/9: {scene["id"]} ({scene["seconds"]:.1f}s)', flush=True)
        for n in range(scene['frames']):
            frame = frame_for(scene, n/FPS)
            if previous is not None and n < 10:
                frame = Image.blend(previous, frame, (n+1)/10)
            if n == scene['frames']-1:
                last = frame.copy()
            process.stdin.write(frame.tobytes())
        previous = last
    process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError('FFmpeg failed')
finally:
    if process.poll() is None:
        process.terminate()

print(f'Created {output} — {elapsed:.2f}s, 1920×1080, 24 fps; voice peak {peak:.3f} before normalization.', flush=True)

