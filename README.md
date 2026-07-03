# Ma Conso — tableau de bord Yoxo (2 lignes)

A single-page, mobile-first dashboard that shows **remaining data (Go), voice minutes and SMS** for two Yoxo (Orange Maroc) lines, protected by one shared password. Works on any phone or desktop browser and installs to the home screen.

> **Why this architecture?** The Yoxo self-care portal (`espace-client.yoxo.ma`) is protected by **F5 "Shape" / BIG-IP bot defense + OpenID Connect**. Automated logins from datacenter/cloud IPs are rejected by design (verified: a real headless browser *and* a scripted request both failed with generic errors from a US cloud IP). A free cloud host therefore **cannot** log in for you. The reliable place to read the data is **your own phone**, on your real Moroccan connection. So this project splits the problem:
>
> - **Fetch on the phone** (real IP, real device) → push a small `data.json`.
> - **Display in the cloud** (this page, free static hosting) → read that `data.json`.
>
> This page never logs into Yoxo and never stores your Yoxo credentials.

## Data sources (priority order, on load / refresh)
1. `?data=<base64 JSON>` in the URL — a phone automation can open a pre-filled link.
2. Remote `data.json` (set its URL in ⚙︎ Réglages, or drop `data.json` next to this page).
3. Local cache (`localStorage`) — last values you entered/fetched.
4. Manual entry (✎ Modifier on each line) — always available, saved locally. **Usable day one, no backend.**

## Data contract
See [`data.sample.json`](./data.sample.json). Each bucket (`data` / `voice` / `sms`) is either
`{ "remaining": <number>, "total": <number>, "unit": "Go|min|SMS" }` or `{ "unlimited": true, "unit": "…" }`,
or omitted/`null` when unknown. `validUntil` is `YYYY-MM-DD`.

## Set your password
The gate compares a SHA-256 hash (no plaintext in source). Replace `CONFIG.PASSWORD_SHA256` in `index.html`:

```bash
printf '%s' 'YOUR_PASSWORD' | shasum -a 256   # or: sha256sum
```
Demo password shipped in this build is `yoxo2026` — **change it before real use.**

> Security note: a static page's password is a *light* client-side lock, fine because only usage numbers live here (never credentials). For strong auth you'd need a backend, which isn't free/simple.

## Run locally (Docker-first)
```bash
docker build -t maconso .
docker run --rm -p 8080:80 maconso   # http://localhost:8080
```

## Tests
```bash
python3 tests/test_schema.py          # validates data.sample.json + index.html invariants
```

## Deploy free (accessible anywhere)
- **GitHub Pages:** push this folder to a repo → Settings → Pages → deploy from branch. Put `data.json` beside `index.html`; leave the URL blank and refresh reads `./data.json`.
- **Cloudflare Pages / Netlify:** drag-and-drop the folder.

## Feeding it from the phone
See [`FETCHER.md`](./FETCHER.md) for the on-device recipes (USSD, official app, or WebView scrape) that produce `data.json`.
