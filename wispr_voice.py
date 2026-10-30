"""Official Wispr REST API adapter. Audio is forwarded in memory, never logged."""
import base64
import binascii
import io
import json
import re
import urllib.request
import wave

ENDPOINT = 'https://platform-api.wisprflow.ai/api/v1/dash/api'


def transcribe(payload, key, transport=urllib.request.urlopen):
    if not key:
        raise RuntimeError('wispr_not_configured')
    if not isinstance(payload, dict) or not isinstance(payload.get('audio'), str):
        raise ValueError('Missing audio')
    try:
        audio = base64.b64decode(payload['audio'], validate=True)
        if len(audio) > 512044:
            raise ValueError('Audio too large')
        with wave.open(io.BytesIO(audio), 'rb') as recording:
            frames = recording.getnframes()
            if (recording.getnchannels(), recording.getsampwidth(), recording.getframerate(), recording.getcomptype()) != (1, 2, 16000, 'NONE'):
                raise ValueError('Expected mono 16kHz PCM16 WAV')
            if not 1 <= frames <= 256000 or len(recording.readframes(frames)) != frames * 2:
                raise ValueError('Invalid audio duration')
    except (binascii.Error, wave.Error, EOFError) as error:
        raise ValueError('Invalid WAV recording') from error
    language = payload.get('language', 'en')
    if not isinstance(language, str) or not re.fullmatch(r'[a-z]{2}', language):
        raise ValueError('Invalid language')
    # Never forward client-provided endpoint, identity, page text or arbitrary context.
    body = {'audio': payload['audio'], 'language': [language],
            'context': {'app': {'name': 'Wispr Diary', 'type': 'ai'}}}
    request = urllib.request.Request(ENDPOINT, data=json.dumps(body).encode(), method='POST',
                                    headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    with transport(request, timeout=35) as response:
        result = json.load(response)
    text = result.get('text') if isinstance(result, dict) else None
    if not isinstance(text, str) or len(text) > 16000:
        raise ValueError('Invalid transcript')
    return {'text': text.strip(), 'provider': 'Wispr Flow'}
