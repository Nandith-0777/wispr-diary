import base64
import io
import json
import unittest
import wave

from wispr_voice import ENDPOINT, transcribe


def wav(rate=16000, channels=1, frames=3200):
    output = io.BytesIO()
    with wave.open(output, 'wb') as recording:
        recording.setnchannels(channels)
        recording.setsampwidth(2)
        recording.setframerate(rate)
        recording.writeframes(b'\x00\x00' * frames * channels)
    return base64.b64encode(output.getvalue()).decode()


class WisprTests(unittest.TestCase):
    def test_official_api_request(self):
        def transport(request, timeout):
            self.assertEqual(request.full_url, ENDPOINT)
            self.assertEqual(request.get_header('Authorization'), 'Bearer fixture-key')
            body = json.loads(request.data)
            self.assertEqual(body['language'], ['en'])
            self.assertEqual(body['context'], {'app': {'name': 'Wispr Diary', 'type': 'ai'}})
            self.assertNotIn('private diary', request.data.decode())
            self.assertEqual(timeout, 35)
            return io.BytesIO(b'{"text":" Today was lovely. ","detected_language":"en"}')
        result = transcribe({'audio': wav(), 'language': 'en', 'context': 'private diary', 'endpoint': 'https://untrusted.example'}, 'fixture-key', transport)
        self.assertEqual(result, {'text': 'Today was lovely.', 'provider': 'Wispr Flow'})

    def test_missing_key_never_sends_audio(self):
        with self.assertRaises(RuntimeError):
            transcribe({'audio': wav()}, '', lambda *a, **k: self.fail('No key: no request'))

    def test_invalid_audio_never_reaches_provider(self):
        for payload in [{'audio': 'bad!'}, {'audio': wav(rate=48000)}, {'audio': wav(channels=2)},
                        {'audio': wav(frames=256001)}, {'audio': wav(frames=0)}, {'audio': wav(), 'language': 'invalid'}]:
            with self.subTest(payload=str(payload)[:30]), self.assertRaises(ValueError):
                transcribe(payload, 'fixture-key', lambda *a, **k: self.fail('Invalid recording forwarded'))

    def test_invalid_provider_text_is_rejected(self):
        for response in [b'{}', b'{"text":null}', json.dumps({'text': 'x' * 16001}).encode()]:
            with self.assertRaises(ValueError):
                transcribe({'audio': wav()}, 'fixture-key', lambda *a, **k: io.BytesIO(response))


if __name__ == '__main__':
    unittest.main()
