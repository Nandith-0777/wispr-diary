# Activate built-in Wispr voice

## Get approved API access

1. Open https://platform.wisprflow.ai and sign in.
2. Wispr currently requires organization approval for Voice Interface API access. If you cannot access the dashboard, contact enterprise@wisprflow.ai. The official access instructions are at https://api-docs.wisprflow.ai/quickstart.
3. Suggested request: “I’m building Wispr Diary for the no-hands challenge. I would like Voice Interface API access so visitors can dictate inside the website without installing Flow. Could you approve my organization and share API pricing and any challenge credits available?”
4. After approval, open API Keys > Create new key. Keep the key private; the docs say it is shown only once. A Flow app subscription or a Supabase key does not replace this API key.

## Connect it locally

Open the project's root .env file and fill the prepared blank line:

    WISPR_API_KEY=YOUR_APPROVED_WISPR_API_KEY

Do not put the key in dist/auth-config.json, browser JavaScript, or chat. The .env file is ignored by Git and is outside the served folder. The server reads it per request, so adding the key does not require a restart.

Refresh the site and click the mic. It checks the server connection, requests microphone permission, then listens. Pause briefly between thoughts to see the words appear. Click the mic again to finish and stop. With no key, the site explains that activation is pending; it does not pretend another speech service is Wispr.

## What to test after approval

- Dictate a sentence into your own book, and check the text and punctuation.
- Add and remove a sticky note through voice; verify the command is acted on rather than inserted as prose.
- Pause while speaking, deny/re-enable microphone permission, and disconnect/reconnect the network.
- Check Retry and Save recording after a failed request.
- Check the sample remains read-only, and late results never land in another book or account.
- Confirm Wispr usage/billing in its developer dashboard.

This first integration uses the official REST endpoint https://platform-api.wisprflow.ai/api/v1/dash/api with bounded phrase recordings. It updates after pauses rather than streaming every partial word. A WebSocket transport can be added after live access confirms the provider behavior. No real Wispr request has been tested without the key. Natural meaning-based editing still needs its separate configured AI provider.
