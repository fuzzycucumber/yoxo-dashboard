# CHANGES

Chronological changelog, newest at top.

## 2026-07-11
- Added `yoxo-userscript.user.js` (Tampermonkey): reads Go/minutes/reset-date from the logged-in Yoxo page and PUTs `data.json` via the GitHub API (GM_xmlhttpRequest). Handles both lines by number→slot mapping; numbers never written to data.json.
- Dashboard redesign to match real Yoxo data: two rings per line (blue Internet in Go, green Appels as Xh Ymin), graceful "remaining-only" (full ring when no total), per-line "relevé" timestamp, reset-date countdown. Added cache-buster to data.json fetch.
- Rewrote FETCHER.md for the Firefox + Tampermonkey method; added userscript test (guards against committing a real token). Recorded D-0006.

## 2026-07-03
- Deployed to GitHub Pages: `fuzzycucumber/yoxo-dashboard` (public) → https://fuzzycucumber.github.io/yoxo-dashboard/ . Pushed via REST Git Data API (git CLI blocked in sandbox); bootstrapped initial commit via Contents API (empty-repo 409 workaround).
- Privacy: removed hard-coded line numbers from the committed build (public repo). Numbers are now entered on-device via a new editor "Numéro" field (localStorage only); `data.json` is gitignored. Added `.nojekyll`.
- Recorded D-0005 (public repo + number scrubbing).
- Initial project scaffold for **Ma Conso** (Yoxo 2-line usage dashboard).
- `index.html`: self-contained mobile-first dashboard — password gate (SHA-256), two line cards with data ring + voice/SMS bars, unlimited handling, relative "updated" time, validity countdown.
- Data sources: URL `?data=` (base64), remote `data.json`, `localStorage`, demo; plus inline manual editor per line.
- Settings sheet to configure a remote `data.json` URL; silent auto-refresh on load ("live on load") + manual refresh button.
- Installable to home screen (embedded manifest/icon, apple-mobile-web-app meta).
- `data.sample.json` (data contract), `README.md`, `FETCHER.md` (on-device recipes), `Dockerfile` (nginx static), `tests/test_schema.py`.
- Recorded D-0001…D-0004 in DECISIONS.md (cloud login blocked; split architecture).
