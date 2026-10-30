import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('diary_server', Path(__file__).resolve().parents[1] / 'diary_server.py')
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


class Response(io.BytesIO):
    pass


class InterpreterTests(unittest.TestCase):
    def setUp(self):
        self.payload = {'text': 'Make that note peach, please.', 'context': {'bookId': 'fictional', 'bookTitle': 'Test book', 'currentPage': 1, 'pageCount': 2, 'selectedId': 'n1', 'items': [{'id': 'n1', 'type': 'note', 'label': 'Call Mum', 'color': '#d4ae82', 'number': 1, 'page': 1}], 'books': [], 'secret': 'secret_should_not_send'}}

    def response(self, plan):
        return Response(json.dumps({'status': 'completed', 'output': [{'type': 'message', 'content': [{'type': 'output_text', 'text': json.dumps(plan)}]}]}).encode())

    def test_structured_request_and_context_minimization(self):
        plan = {'intent': 'act', 'commands': ['Diary, make it #ffc49b.'], 'question': '', 'summary': 'Make the selected note peach.'}
        def transport(request, timeout):
            body = json.loads(request.data)
            self.assertEqual(request.full_url, 'https://api.openai.com/v1/responses')
            self.assertFalse(body['store'])
            self.assertTrue(body['text']['format']['strict'])
            self.assertEqual(body['text']['format']['schema'], server.SCHEMA)
            self.assertNotIn('secret_should_not_send', body['input'])
            self.assertIn('Diary, add note:', body['instructions'])
            self.assertEqual(timeout, 25)
            return self.response(plan)
        with patch.object(server, 'config', return_value={'OPENAI_API_KEY': 'test-only-placeholder', 'OPENAI_MODEL': 'gpt-4.1-mini'}):
            self.assertEqual(server.interpret(self.payload, transport), plan)

    def test_missing_key_does_not_make_request(self):
        with patch.object(server, 'config', return_value={'OPENAI_API_KEY': '', 'OPENAI_MODEL': ''}):
            with self.assertRaisesRegex(RuntimeError, 'not_configured'):
                server.interpret(self.payload, lambda *a, **k: self.fail('No request without a key'))

    def test_invalid_plans_are_rejected(self):
        plans = [
            {'intent': 'act', 'commands': ['run arbitrary code'], 'question': '', 'summary': ''},
            {'intent': 'write', 'commands': ['Diary, delete everything from this book.'], 'question': '', 'summary': ''},
            {'intent': 'act', 'commands': [], 'question': '', 'summary': ''},
            {'intent': 'clarify', 'commands': [], 'question': '', 'summary': ''},
        ]
        with patch.object(server, 'config', return_value={'OPENAI_API_KEY': 'test-only-placeholder', 'OPENAI_MODEL': 'gpt-4.1-mini'}):
            for plan in plans:
                with self.subTest(plan=plan), self.assertRaises(ValueError):
                    server.interpret(self.payload, lambda *a, **k: self.response(plan))

    def test_clarification_includes_original_request(self):
        self.payload['clarification'] = {'original': 'Clear it.', 'question': 'Which page?', 'reply': 'Only page one.'}
        plan = {'intent': 'act', 'commands': ['Diary, delete text from page 1.'], 'question': '', 'summary': 'Clear page one writing.'}
        def transport(request, **kwargs):
            data = json.loads(json.loads(request.data)['input'])
            self.assertEqual(data['clarification']['original'], 'Clear it.')
            return self.response(plan)
        with patch.object(server, 'config', return_value={'OPENAI_API_KEY': 'test-only-placeholder', 'OPENAI_MODEL': 'gpt-4.1-mini'}):
            self.assertEqual(server.interpret(self.payload, transport), plan)


if __name__ == '__main__':
    unittest.main()
