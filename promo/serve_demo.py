from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json

DIRECTORY = Path(__file__).resolve().parents[1] / '.qa' / 'promo-site'


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def do_GET(self):
        if self.path.split('?')[0] in ('/api/ai/status', '/api/voice/status'):
            body=json.dumps({'configured': False}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


ThreadingHTTPServer(('127.0.0.1',4174), Handler).serve_forever()
