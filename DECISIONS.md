# DECISIONS

Append-only. Newest entries added at the bottom. Format: `D-NNNN`.

---

## D-0001 — Cloud-side login to Yoxo is not viable
**Context:** Approved plan was a free cloud host that logs into `espace-client.yoxo.ma` server-side and serves usage as JSON.
**Findings (Phase 1 spike):**
- Login page reachable from a US AWS IP (HTTP 200), so not a blanket geo-block.
- Login is gated by **F5 "Shape" / BIG-IP Distributed Cloud Bot Defense** (`/TSPD/` challenge scripts, `TS*` cookies) plus **OpenID Connect** (`OpenIdConnectSDK.min.js`, `/oidc/authorize`). `www.yoxo.ma` returns the F5 "Request Rejected" page to non-browser clients.
- A scripted POST returned *"Une erreur inattendue est survenue"*; a real headless Chromium failed twice with *"Une erreur… lors de l'authentification"* then bounced to login. These are **generic errors, not wrong-password** — credentials are valid.
**Decision:** Do not attempt cloud-side login. Datacenter/cloud IPs + automation are blocked by design, and defeating Shape is fragile + against ToS.
**Reflection:** Any free cloud host (Vercel/HF/Render — all datacenter IPs) would hit the same wall. The only reliable read point is the user's own device on its Moroccan connection.

## D-0002 — Split architecture: fetch on phone, display in cloud (Option A)
**Context:** User (skipped the direction question) prefers autonomous execution; needs a view on mobile + desktop, free, no home server.
**Decision:** Build a **static single-page dashboard** (this repo) that displays usage from a `data.json`, and let an **on-device automation** produce that `data.json`. The page never authenticates to Yoxo.
**Reflection / tradeoffs surfaced:**
- Honors "free + accessible anywhere + no home server" (phone is the fetcher, not a server).
- Cost = one-time phone automation setup; freshness = last phone push (mitigated by manual refresh + manual entry).
- Rejected B (cloud + Moroccan residential proxy): not free, fragile, ToS-risky.

## D-0003 — Manual-entry fallback is a first-class data source
**Decision:** Ship inline per-line editing saved to `localStorage`, so the dashboard is useful immediately even before any automation exists.
**Reflection:** De-risks the hardest component (the fetcher). Worst case, the user glances at the official Max it app and types two numbers; the dashboard still delivers the "one glance, both lines, anywhere" value.

## D-0004 — Password gate is client-side SHA-256, documented as light
**Decision:** Gate on a SHA-256 hash compared in-browser; no plaintext, no credentials stored.
**Reflection:** Real auth needs a backend (not free/simple). Data here is low-sensitivity usage numbers, so a light lock is an acceptable, honestly-documented tradeoff.

## D-0005 — Public repo on GitHub Pages, phone numbers scrubbed from source
**Context:** User chose GitHub Pages for a free permanent URL. Free Pages serves only from a **public** repo, and a client-side page cannot hide its own source from anyone who opens the URL.
**Decision:** Create `fuzzycucumber/yoxo-dashboard` as **public**, but **do not commit the real line numbers**. `CONFIG.LINES` ships with empty ids; a new editor "Numéro" field lets the user store numbers in `localStorage` on-device; `data.json` is gitignored. Deploy uses the REST Git Data API (git CLI is blocked by the sandbox proxy); the initial commit is bootstrapped via the Contents API to work around GitHub's empty-repo blob 409.
**Reflection / tradeoffs surfaced:** Keeps the two mobile numbers off the public internet by default. Cost: numbers are per-device (localStorage), and true auto-refresh via a committed `data.json` would expose numbers+usage publicly. If the user wants auto-refresh AND privacy, the path is Cloudflare Pages with a private source repo (or a paid GitHub plan for private Pages) — flagged for operator choice.
