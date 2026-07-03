# Feeding the dashboard from your phone

The dashboard reads a small `data.json`. Anything that can produce that JSON on your **real phone connection** works. Recipes below, easiest first.

The JSON shape (see `data.sample.json`):
```json
{ "updatedAt": "<ISO8601>", "lines": [ { "id": "line1", "label": "Ligne 1",
  "plan": "Yoxo 100 Go", "data": {"remaining":63.4,"total":100,"unit":"Go"},
  "voice": {"unlimited":true,"unit":"min"}, "sms": {"unlimited":true,"unit":"SMS"},
  "validUntil": "2026-07-21" }, { "id":"line2", "...": "..." } ] }
```

---

## Method 0 — Manual (works today, zero setup) ✅ recommended to start
Open the official **Max it / Orange et moi** app (it shows both lines' data/minutes/SMS in real time), then on the dashboard tap **✎ Modifier** on each line and type the numbers. Saved locally; the two-line "one glance, anywhere" view works immediately.

## Method 1 — On-device automation of the app/portal (full auto, advanced)
Use **Tasker + AutoInput** (or **Automate** by LlamaLab). A scheduled task:
1. Opens the Max it app (or `espace-client.yoxo.ma` in a WebView) — this runs on your **real Moroccan IP in a real browser/app, so F5 Shape treats it as a legitimate device** (unlike a cloud server).
2. Reads the on-screen data/minutes via AutoInput (accessibility) or WebView JS.
3. Builds `data.json` and publishes it (see "Publishing" below).

Effort: high (UI scraping is brittle if the app UI changes). Most robust *auto* option because it uses the real device.

## Method 2 — USSD capture (medium)
Orange Maroc balance codes (from the device): main balance `#554#` (send *oui/ok*); internet/data `#555#` → *mon compte* → *mon solde* (or call `555` → 4 → 1). Tasker can place the USSD call; **AutoInput** reads the response dialog text; a regex extracts the Go/minutes; then publish. Effort: medium; depends on the current USSD menu wording (may not break out data vs minutes cleanly for every Yoxo plan).

## Publishing `data.json` from the phone (pick one)
- **GitHub (recommended, free):** the automation's HTTP block does an authenticated `PUT` to
  `https://api.github.com/repos/<you>/yoxo-dashboard/contents/data.json`
  (JSON body: `{ "message":"update","content":"<base64>","sha":"<current file sha>" }`, header `Authorization: Bearer <fine-grained PAT, contents:write>`). GitHub Pages then serves it next to `index.html`.
- **`?data=` link (no store, simplest):** build the JSON, base64url-encode it, and open
  `https://<you>.github.io/yoxo-dashboard/?data=<base64url>`. The dashboard ingests and caches it. Updates only when the link is opened.

## Notes
- Run the task on a schedule (e.g., every few hours) and/or via a home-screen shortcut = your "manual refresh".
- Never put your Yoxo password into the automation for a *cloud* login — it will be blocked. The whole point is that the fetch stays on the device.
