"""Download the free local narrator's pinned model assets from its maintainer.

Hashes are the SHA-256 digests published in the official GitHub release.
No account, API key, diary text, or paid service is involved.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / '.qa' / 'kokoro-model'
ASSETS = {
    'kokoro-v1.0.int8.onnx': 'ae315a79b623f244700e4afb9246c46a26066782e049ba174bf3ba433970ee9c',
    'voices-v1.0.bin': 'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d',
}


def digest(path):
    sha = hashlib.sha256()
    with path.open('rb') as file:
        for chunk in iter(lambda: file.read(1024*1024), b''):
            sha.update(chunk)
    return sha.hexdigest()


def fetch(asset):
    name, expected = asset
    path = TARGET / name
    if path.exists() and digest(path) == expected:
        print('Already verified: ' + name, flush=True)
        return
    url = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/' + name
    request = urllib.request.Request(url+'?download=1&t='+str(int(time.time())), headers={'User-Agent': 'WisprDiary-local-narrator'})
    partial = path.with_suffix(path.suffix+'.download')
    print('Downloading: '+name, flush=True)
    with urllib.request.urlopen(request, timeout=90) as response, partial.open('wb') as file:
        for chunk in iter(lambda: response.read(1024*1024), b''):
            file.write(chunk)
    if digest(partial) != expected:
        raise ValueError('Model checksum mismatch: '+name)
    partial.replace(path)
    print('Verified: '+name, flush=True)


if __name__ == '__main__':
    TARGET.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(fetch, ASSETS.items()))
    print('Local narration model ready.')
