"""Free, local neural narration. No account, API key, or network requests.

Install kokoro-onnx and soundfile into .qa/python-voice and run
promo/setup_local_voice.py once to download the pinned model files.
"""
from pathlib import Path
import argparse
import hashlib
import json
import os
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.qa' / 'python-voice'))
OUT = ROOT / 'artifacts' / 'wispr-diary-promo' / 'local'
MODEL = ROOT / '.qa' / 'kokoro-model'
VOICE = 'af_heart'
SPEED = 0.98


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--preview', action='store_true')
    args = parser.parse_args()
    model = MODEL / 'kokoro-v1.0.int8.onnx'
    voices = MODEL / 'voices-v1.0.bin'
    if not model.exists() or not voices.exists():
        raise SystemExit('Download the pinned assets first: python promo/setup_local_voice.py')
    import numpy as np
    import soundfile as sf
    import onnxruntime as ort
    from kokoro_onnx import Kokoro
    options = ort.SessionOptions()
    options.intra_op_num_threads = min(4, os.cpu_count() or 1)
    options.inter_op_num_threads = 1
    print('Loading the local speech model...', flush=True)
    session = ort.InferenceSession(str(model), sess_options=options, providers=['CPUExecutionProvider'])
    narrator = Kokoro.from_session(session, str(voices))
    scenes = json.loads((ROOT / 'promo' / 'scenes.json').read_text(encoding='utf-8'))
    jobs = [('voice-preview', 'Your day deserves more than a forgotten note. Meet Wispr Diary. A little place for your life.')] if args.preview else [(f'{i:02}-{s["id"]}', s['voice']) for i, s in enumerate(scenes)]
    target = OUT if args.preview else OUT / 'voice'
    target.mkdir(parents=True, exist_ok=True)
    for name, text in jobs:
        signature = hashlib.sha256(json.dumps([VOICE, SPEED, text, 'kokoro-v1.0.int8']).encode()).hexdigest()
        output = target / (name+'.wav')
        metadata = output.with_suffix('.json')
        if output.exists() and metadata.exists() and json.loads(metadata.read_text(encoding='utf-8')).get('signature') == signature:
            print('Reusing: '+name, flush=True)
            continue
        spoken = text.replace('Wispr', 'Whisper')
        samples, rate = narrator.create(spoken, voice=VOICE, speed=SPEED, lang='en-us')
        if samples.ndim != 1 or not np.isfinite(samples).all() or len(samples) < rate/2 or np.max(np.abs(samples)) < 0.001:
            raise ValueError('Local voice generation returned invalid audio: '+name)
        peak = float(np.max(np.abs(samples)))
        if peak > 0.95:
            samples = samples * (0.95/peak)
        sf.write(str(output), samples, rate, subtype='PCM_16')
        info = {'signature': signature, 'text': text, 'phonetic_text': spoken, 'voice': VOICE,
                'speed': SPEED, 'sample_rate': rate, 'seconds': round(len(samples)/rate, 3), 'generated_locally': True}
        metadata.write_text(json.dumps(info, indent=2), encoding='utf-8')
        print(f'Generated locally: {name} ({info["seconds"]:.1f}s)', flush=True)
    if not args.preview:
        (OUT / 'voice-info.json').write_text(json.dumps({'provider': 'Local Kokoro', 'model': 'Kokoro-82M v1.0 INT8',
            'voice': VOICE, 'label': 'AI-generated Kokoro af_heart narration, generated locally',
            'source': 'https://huggingface.co/hexgrad/Kokoro-82M', 'license': 'Apache-2.0',
            'api_key_required': False, 'network_used_for_generation': False}, indent=2), encoding='utf-8')
    print('Saved to: '+str(target))


if __name__ == '__main__':
    main()
