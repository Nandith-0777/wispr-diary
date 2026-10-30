"""Offline contract checks: no paid service request and no real credentials."""
import base64
import importlib.util
import io
import json
from pathlib import Path
import unittest
import urllib.error
import wave

module_path = Path(__file__).resolve().parents[1] / 'promo' / 'narrate_openai.py'
spec = importlib.util.spec_from_file_location('promo_narration', module_path)
narration = importlib.util.module_from_spec(spec)
spec.loader.exec_module(narration)


def wav_bytes():
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(24000)
        wav.writeframes(b'\x00\x00' * 24000)
    return buffer.getvalue()


class NarrationContract(unittest.TestCase):
    def transport(self, text, finish='stop'):
        def respond(request, timeout):
            self.assertEqual(request.full_url, 'https://api.openai.com/v1/chat/completions')
            self.assertEqual(timeout, 90)
            body = json.loads(request.data)
            self.assertFalse(body['store'])
            self.assertEqual(body['audio'], {'voice': 'marin', 'format': 'wav'})
            self.assertEqual(body['messages'][-1]['content'], 'Meet Wispr Diary.')
            return io.BytesIO(json.dumps({'choices': [{'finish_reason': finish, 'message': {'audio': {'transcript': text, 'data': base64.b64encode(wav_bytes()).decode()}}}]}).encode())
        return respond

    def test_exact_script_and_pronunciation(self):
        data, info = narration.synthesize('Meet Wispr Diary.', 'test-only', transport=self.transport('Meet Whisper Diary.'))
        self.assertEqual(info['sample_rate'], 24000)
        self.assertEqual(info['seconds'], 1)
        self.assertTrue(data.startswith(b'RIFF'))

    def test_added_or_missing_words_rejected(self):
        with self.assertRaisesRegex(ValueError, 'changed the script'):
            narration.synthesize('Meet Wispr Diary.', 'test-only', transport=self.transport('Sure, meet Wispr Diary.'))

    def test_truncated_response_rejected(self):
        with self.assertRaisesRegex(ValueError, 'incomplete'):
            narration.synthesize('Meet Wispr Diary.', 'test-only', transport=self.transport('Meet Wispr Diary.', 'length'))

    def test_key_is_not_in_service_error(self):
        def unauthorized(request, timeout):
            raise urllib.error.HTTPError(request.full_url, 401, 'secret-sentinel', {}, None)
        with self.assertRaisesRegex(RuntimeError, 'HTTP 401') as error:
            narration.synthesize('Meet Wispr Diary.', 'secret-sentinel', transport=unauthorized)
        self.assertNotIn('secret-sentinel', str(error.exception))

    def test_exhausted_credits_are_not_treated_as_a_rate_limit(self):
        def exhausted(request, timeout):
            body = io.BytesIO(json.dumps({'error': {'code': 'credit_balance_exhausted'}}).encode())
            raise urllib.error.HTTPError(request.full_url, 429, 'secret-sentinel', {}, body)
        with self.assertRaisesRegex(RuntimeError, 'credit balance is exhausted') as error:
            narration.synthesize('Meet Wispr Diary.', 'secret-sentinel', transport=exhausted)
        self.assertNotIn('secret-sentinel', str(error.exception))


if __name__ == '__main__':
    unittest.main()
