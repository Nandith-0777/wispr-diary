# Natural voice for Wispr Diary

The website now has a real AI interpretation endpoint. Wispr/browser speech supplies the transcript, the server asks OpenAI to classify its meaning, and the browser validates the proposed commands before calling the existing book actions. This is not a larger list of phrase-matching rules presented as AI.

## Add the key locally

1. Open the project’s `.env` file, next to this document.
2. Set `OPENAI_API_KEY=your-key` locally. Do not paste the key into chat or put it under `dist/`.
3. Leave `OPENAI_MODEL=gpt-4.1-mini`, or set a compatible Responses API model you have access to.
4. Open **Start Diary.cmd** if the backend is not already running.
5. Refresh the website. Choose **Natural voice · setup**, then **Check connection**. The settings are read on every API request, so adding the key does not require a server restart.

The project `.env` file is ignored by Git. Only the backend reads it. Its contents are not served to the browser. API credits/model access are separate from the desktop chat account.

## Use it

Start a browser or Wispr Flow voice session as before. Natural voice is enabled by default when a server key is configured, and can be disabled in its settings. The UI describes what is sent to the provider.

Try:

- “Put a little peach reminder here that says call Mum.”
- “Move that brown note onto page four.”
- “Get rid of the writing on these two pages, but keep my pictures.”
- “Rename this book to My small adventures.”
- “I deleted my shopping list today and caught up with a friend.” This should remain diary narration.

For an ambiguous request, a small question strip appears at the book’s edge. Reply by voice or typing, or cancel the request. Exact **Diary…** commands still execute locally and bypass the API. The manual remains an optional reference.

## Boundaries and recovery

- Only existing book operations can run. The model cannot execute code, access files, read the API key, choose a private upload, or invent new app features.
- Proposed commands are all parsed before any action is applied. If any command is unknown, no part of that plan runs.
- The API receives the utterance, book titles/page counts, current selection, and short visible item labels. It does not receive whole journal pages or media files. Ordinary narration in natural mode is sent for classification; when classified as writing, the original transcript is inserted unchanged.
- If the book changes while interpretation is pending, the plan is discarded. If the API fails, the original words are kept in the Type bar and a Retry option appears. Stopping the session cancels pending interpretation and keeps its utterance available.
- Explicit whole-book scope is required for AI-generated whole-book clearing; vague “clear it all” requests ask a scope question. Existing session Undo remains available.
- Natural language interpretation is probabilistic. This implementation validates syntax and scope but cannot guarantee that every natural expression is interpreted correctly. Evaluate with real phrases before a public challenge demo.
- An empty/missing key leaves the existing local command mode available. The UI will not label a phrase-matching fallback as working AI.
- The server binds to `127.0.0.1`, accepts same-origin local POSTs, caps request size/concurrency/rate, does not log transcript bodies, and uses `store: false` on Responses API calls. Public deployment needs proper hosting, authentication, and per-user limits; this server is a local prototype.

## Validation

- `python tests/test_ai_server.py`: structured request format, context minimization, missing-key behavior, invalid plans, and clarification context using a mocked provider transport.
- `node tests/natural-voice.cjs`: real book execution with mocked interpretation responses, including clarification, narrative preservation, custom colors, invalid plans, stale context, and local-command fallback.
- Existing manual/action/voice/pagination/deletion suites remain regression checks.

These tests do not establish live model interpretation quality. Live API checks require a configured key; hardware microphone/Flow capture and visual browser checks are separate.

The backend uses the official [Responses structured-output format](https://developers.openai.com/api/docs/guides/structured-outputs). The default model’s documented capabilities include [structured outputs](https://developers.openai.com/api/docs/models/gpt-4.1-mini).
