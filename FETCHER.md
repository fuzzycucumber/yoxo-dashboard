# Feeding the dashboard from your phone

The dashboard reads a small `data.json`. The chosen method produces it automatically with a **userscript** that runs inside the Yoxo page in **Firefox for Android**.

## Why this method
The Yoxo login is protected by bot defense, so it only works from your real device. A userscript runs *inside* the logged-in page, so it can read the balance straight from the page's text (no fragile screen-scraping) and push it to `data.json` via the GitHub API. It handles **both lines**: whichever account you open updates its own card.

## Setup (one time)
1. Install **Firefox** for Android + the **Tampermonkey** add-on (Firefox ⋮ → Add-ons).
2. Install the script: open the raw file and Tampermonkey offers to install it —
   `https://raw.githubusercontent.com/fuzzycucumber/yoxo-dashboard/main/yoxo-userscript.user.js`
3. Edit the installed script (Tampermonkey dashboard → the script) and paste your GitHub token into `GITHUB_TOKEN` (fine-grained PAT, Contents: Read/Write on this repo only). The token stays on your phone.
4. The number→line mapping is in the `LINES` object (kept on-device; numbers are never written to `data.json`).

## Daily use
- Open `espace-client.yoxo.ma` in Firefox and log into a line. The script reads the balance and pushes it; a toast confirms "Ligne X ✓ …".
- Repeat for the other line (log in with the other number). Each updates its own card.
- Options in the script: `AUTO_CLOSE` (close tab after update) and `REFRESH_MIN` (auto-reload every N minutes if you keep a tab open) for a hands-off refresh.
- Optional unattended trigger: use Automate to open the Yoxo URL in Firefox on a schedule (launching a URL needs no accessibility permission); the script does the rest.

## What it extracts (from the summary page)
- Internet: `NN.N GO` → `data.remaining` (Go)
- Appels: `Xh Ymin Zs` → `voice.remaining` (minutes) — or unlimited
- "réinitialisé le DD/MM/YYYY" → `validUntil`
- "Au DD/MM/YYYY à HH:MM" → per-line `asOf`

## data.json shape
See `data.sample.json`. Only usage figures are stored (keys `line1`/`line2`); **phone numbers are never written** to the file.

## Fallbacks
- **Manual:** tap ✎ Modifier on any line in the dashboard and type the values (always works).
- **Private variant:** if you don't want usage figures on a public URL, host on Cloudflare Pages with a private repo (see DECISIONS D-0005).
