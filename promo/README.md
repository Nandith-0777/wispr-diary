# Wispr Diary promo

Output: `artifacts/wispr-diary-promo/wispr-diary-promo.mp4` (landscape 1920×1080, H.264/AAC).

This is an illustrated, narrated product walkthrough assembled from actual website screenshots. The diary, author, account, and library are fictional. Writing reveals and transitions are editorial animation. The note example runs through the app's real request handler in the isolated fixture. It does not demonstrate live microphone recognition, live Wispr API access, or a live cloud save. Wispr API activation remains pending.

Narration in the original cut is computer-generated with the installed **Microsoft Zira Desktop** text-to-speech voice. The free local replacement below uses **Kokoro**. No human microphone recording, impersonation, or private account is used. Captions are burned into the video and also supplied as `captions.srt`. The full narration, timing, WAV clips, poster, and screenshot sources are beside the MP4 so the cut can be revised.

## Rebuild

1. Run `python promo/prepare_demo.py`, then `python promo/serve_demo.py`. This copies the site into `.qa/promo-site`, disables real authentication, and serves fictional scenes at `http://localhost:4174/launcher.html`, a different origin from the user's diary.
2. Capture the launcher scenes in a 1920×1080 browser viewport to the screenshot paths used by `render_promo.py`. Also capture Add's memory menu and the four tutorial steps. Never capture personal diary content.
3. Run `powershell -File promo/narrate.ps1` to regenerate original narration from `scenes.json` using Windows speech synthesis.
4. Run `python promo/render_promo.py`. Requires Pillow, numpy, and imageio-ffmpeg; the latter is installed locally in `.qa/python-media` for this workspace.

## Free local narration replacement

The `local` variant uses **Kokoro-82M v1.0**, its `af_heart` English voice, and ONNX Runtime on the CPU. There are no API charges, API keys, or cloud narration requests. The one-time setup downloads approximately 142 MB of model/voice assets plus Python packages. Both model assets are verified against the SHA-256 digests from the maintainer's official release. These files stay under `.qa/`, outside the website and version control.

```powershell
python -m pip install --target .qa/python-voice kokoro-onnx soundfile
python promo/setup_local_voice.py
python promo/narrate_local.py --preview
python promo/narrate_local.py
python promo/render_promo.py --variant local
python promo/verify_promo.py --variant local
```

The audition and finished video are saved under `artifacts/wispr-diary-promo/local/`. Generation after setup runs locally. `Wispr` is pronounced as `Whisper` in the speech input while captions keep the product's original spelling. The new narration gets its own scene durations, caption timing, and AI-voice disclosure. The original cut is retained.

Model and Apache-2.0 license: https://huggingface.co/hexgrad/Kokoro-82M. Runtime wrapper and MIT license: https://github.com/thewh1teagle/kokoro-onnx. The voice is synthesized, and subjective naturalness should be judged by listening to the audition.

## Optional paid narration replacement

The original cut stays in place. The natural-voice version uses OpenAI's `gpt-audio-1.5` audio Chat Completions workflow and the `marin` voice, directed to sound like a relaxed conversation. This is an API service and requires an OpenAI API key with API credits. No replacement voice has been generated until that key is configured and the generation command succeeds.

Add `OPENAI_API_KEY` to the project's local `.env`, never to a file under `dist/` and never to chat. Then run:

```powershell
python promo/narrate_openai.py --check
python promo/narrate_openai.py --preview
python promo/narrate_openai.py
python promo/render_promo.py --variant natural
python promo/verify_promo.py --variant natural
```

The audition is saved as `artifacts/wispr-diary-promo/natural/voice-preview.wav`. The replacement video, captions, narration, and proofs are saved under `artifacts/wispr-diary-promo/natural/`. Completed matching clips are cached so resuming does not regenerate them. Generation checks the returned transcript against each scene before accepting a clip. Only original promo narration is sent to the service; no diary entries or screenshots are sent. The video discloses AI-generated narration.

For a one-time run without writing an environment file, run `python promo/narrate_openai.py --key-stdin --preview` in an interactive terminal. It prompts for the key with hidden input, uses it in memory for the request, and does not save it. Use the same option without `--preview` for the full narration. Never hardcode a secret in website files.

Official workflow: https://developers.openai.com/api/docs/guides/audio-chat-completions and model: https://developers.openai.com/api/docs/models/gpt-audio-1.5.

## Media credits

The movie-night example contains a still from **Big Buck Bunny**, © 2008 Blender Foundation, licensed CC BY 3.0: https://www.bigbuckbunny.org/ and https://creativecommons.org/licenses/by/3.0/. The excerpt is supplied by W3Schools: https://www.w3schools.com/html/html5_video.asp. It is shown inside the fictional diary player, resized as part of the walkthrough. No affiliation or endorsement is implied.

The sample desk photograph is an existing illustrative Unsplash asset in the project. See `dist/assets/credits.html`. All written diary passages and promo narration are original fictional demonstration text.
