# Housing Scribe (prototype)

An AI-assisted intake tool for housing and homelessness caseworkers in Edmonton.
It logs consent, transcribes the interview live, shows a 12-section checklist of
what has and hasn't been covered, and drafts the assessment for the caseworker
to edit and approve.

**Testing only: use role-played or made-up interviews. Never real client data.**

## Files
- `index.html` – the web app (consent, interview, checklist, draft, approval)
- `netlify/functions/draft.mjs` – sends the transcript to Claude; keeps your API key private
- `netlify.toml` – tells Netlify where things are

## Setup
1. Upload all files to the `housing-scribe` GitHub repo, keeping the folder structure
   (`netlify/functions/draft.mjs` must sit inside those two folders).
2. In Netlify: Add new site → Import from GitHub → choose `housing-scribe` → Deploy.
3. Site configuration → Environment variables → add `ANTHROPIC_API_KEY` with your key.
4. Deploys → Trigger deploy → Deploy site (so the key is picked up).
5. Open the site in Chrome or Edge, allow the microphone, and test.

Optional: add `CLAUDE_MODEL` to change the model (default `claude-haiku-5-5`, chosen for speed).

## Privacy design
- Consent logged with caseworker initials and time
- Typed-notes mode when the client declines recording
- Pause/stop at any time
- Nothing is stored on a server; the transcript is deleted from the session once approved
- Known limitation: browser speech recognition sends audio to Google/Apple. A production
  version would use a Canadian-hosted speech-to-text service instead.
