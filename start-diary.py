"""Start the local diary server if needed, then open the diary in a browser."""
from pathlib import Path
import subprocess
import sys
import time
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parent
URL = "http://127.0.0.1:4173/"


def ready():
    try:
        with urllib.request.urlopen(URL + "api/ai/status", timeout=1) as response:
            return b'"provider": "OpenAI"' in response.read()
    except OSError:
        return False


def main():
    if not ready():
        with (ROOT / "server.log").open("ab") as log:
            subprocess.Popen(
                [sys.executable, str(ROOT / "diary_server.py")],
                cwd=ROOT,
                stdin=subprocess.DEVNULL,
                stdout=log,
                stderr=log,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0,
            )
        for _ in range(30):
            if ready():
                break
            time.sleep(0.2)
        else:
            raise SystemExit("Could not start Wispr Diary. Check server.log; port 4173 may be in use.")
    webbrowser.open(URL)


if __name__ == "__main__":
    main()
