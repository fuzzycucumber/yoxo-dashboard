// ==UserScript==
// @name         Yoxo → Ma Conso
// @namespace    maconso.yoxo
// @version      1.0.0
// @description  Lit la conso (Go / minutes) sur espace-client.yoxo.ma et met à jour le tableau de bord (data.json sur GitHub).
// @match        https://espace-client.yoxo.ma/*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// ==/UserScript==

(function () {
  "use strict";

  /* ======================= CONFIG — À REMPLIR ======================= */
  // 1) Colle ici ton token GitHub (celui qui commence par github_pat_...).
  const GITHUB_TOKEN = "PASTE_YOUR_GITHUB_PAT_HERE";
  // 2) Ne change rien ci-dessous, sauf si tu renommes le dépôt.
  const OWNER  = "fuzzycucumber";
  const REPO   = "yoxo-dashboard";
  const PATH   = "data.json";
  const BRANCH = "main";
  // 3) Association numéro de ligne -> emplacement + libellé sur le tableau de bord.
  //    (Les numéros restent ici, sur ton téléphone ; ils ne sont PAS publiés.)
  const LINES = {
    "0614014003": { id: "line1", label: "Ligne 1" },
    "0650605049": { id: "line2", label: "Ligne 2" },
  };
  // 4) Options.
  const AUTO_CLOSE  = false; // true = ferme l'onglet après une mise à jour réussie
  const REFRESH_MIN = 0;     // >0 = recharge la page toutes les N minutes (garde l'onglet ouvert)
  /* ================================================================== */

  const KNOWN = Object.keys(LINES);

  // ---- petit "toast" en bas de l'écran ----
  function toast(msg, ok) {
    let t = document.getElementById("maconso-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "maconso-toast";
      t.style.cssText =
        "position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483647;" +
        "font:600 14px system-ui,sans-serif;padding:12px 16px;border-radius:12px;color:#fff;" +
        "box-shadow:0 8px 24px rgba(0,0,0,.35);max-width:90vw;text-align:center";
      document.documentElement.appendChild(t);
    }
    t.style.background = ok === false ? "#c0392b" : (ok ? "#1e7d5a" : "#333");
    t.textContent = msg;
  }

  // ---- extraction des valeurs depuis le texte affiché ----
  function parse() {
    const txt = (document.body ? document.body.innerText : "").replace(/ /g, " ");
    const num = KNOWN.find((n) => txt.includes(n)) || null;

    let dataGo = null;
    const mData = txt.match(/([\d]+(?:[.,]\d+)?)\s*GO\b/i);
    if (mData) dataGo = parseFloat(mData[1].replace(",", "."));

    let voiceMin = null, voiceUnlimited = false;
    if (/illimit/i.test(txt) && /appel/i.test(txt)) voiceUnlimited = true;
    const mHM = txt.match(/(\d+)\s*h\s*(\d+)\s*min/i);
    if (mHM) voiceMin = parseInt(mHM[1], 10) * 60 + parseInt(mHM[2], 10);
    else {
      const mM = txt.match(/(\d+)\s*min\b/i);
      if (mM) voiceMin = parseInt(mM[1], 10);
    }

    let validUntil = "";
    const mR = txt.match(/r[ée]initialis\w*[^0-9]{0,20}(\d{2})\/(\d{2})\/(\d{4})/i);
    if (mR) validUntil = `${mR[3]}-${mR[2]}-${mR[1]}`;

    let asOf = null;
    const mA = txt.match(/Au\s+(\d{2})\/(\d{2})\/(\d{4})\s+[àa]\s+(\d{2}):(\d{2})/i);
    if (mA) asOf = `${mA[3]}-${mA[2]}-${mA[1]}T${mA[4]}:${mA[5]}:00+01:00`;
    else asOf = new Date().toISOString();

    return { num, dataGo, voiceMin, voiceUnlimited, validUntil, asOf };
  }

  // ---- helpers base64 UTF-8 ----
  const b64enc = (s) => btoa(unescape(encodeURIComponent(s)));
  const b64dec = (s) => decodeURIComponent(escape(atob(String(s).replace(/\s+/g, ""))));

  // ---- appels GitHub via GM_xmlhttpRequest (pas de souci CORS) ----
  function gh(method, url, body) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method,
        url,
        headers: {
          Authorization: "Bearer " + GITHUB_TOKEN,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        data: body ? JSON.stringify(body) : undefined,
        onload: (r) => resolve({ status: r.status, text: r.responseText }),
        onerror: () => reject(new Error("network")),
        ontimeout: () => reject(new Error("timeout")),
      });
    });
  }

  const CONTENT_URL =
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

  async function loadCurrent() {
    const r = await gh("GET", CONTENT_URL + "?ref=" + BRANCH);
    if (r.status === 200) {
      const j = JSON.parse(r.text);
      return { sha: j.sha, data: JSON.parse(b64dec(j.content)) };
    }
    if (r.status === 404) return { sha: null, data: { lines: [] } };
    throw new Error("GET data.json HTTP " + r.status);
  }

  function merge(current, slot, p) {
    const byId = {};
    (current.data.lines || []).forEach((l) => { if (l && l.id) byId[l.id] = l; });
    const prev = byId[slot.id] || {};
    byId[slot.id] = {
      id: slot.id,
      label: slot.label,
      data: p.dataGo != null ? { remaining: p.dataGo, unit: "Go" } : (prev.data || null),
      voice: p.voiceUnlimited
        ? { unlimited: true, unit: "min" }
        : (p.voiceMin != null ? { remaining: p.voiceMin, unit: "min" } : (prev.voice || null)),
      validUntil: p.validUntil || prev.validUntil || "",
      asOf: p.asOf,
    };
    const order = ["line1", "line2"];
    const labels = { line1: "Ligne 1", line2: "Ligne 2" };
    const lines = order.map(
      (id) => byId[id] || { id, label: labels[id], data: null, voice: null, validUntil: "", asOf: null }
    );
    // updatedAt = le relevé le plus récent des deux lignes
    const times = lines.map((l) => l.asOf).filter(Boolean).sort();
    return { updatedAt: times[times.length - 1] || new Date().toISOString(), lines };
  }

  async function put(sha, obj, msg) {
    const body = { message: msg, content: b64enc(JSON.stringify(obj, null, 2)), branch: BRANCH };
    if (sha) body.sha = sha;
    return gh("PUT", CONTENT_URL, body);
  }

  async function pushOnce(p, slot) {
    let cur = await loadCurrent();
    let out = merge(cur, slot, p);
    let r = await put(cur.sha, out, `maj ${slot.id}`);
    if (r.status === 409) { // sha périmé -> on relit et on réessaie une fois
      cur = await loadCurrent();
      out = merge(cur, slot, p);
      r = await put(cur.sha, out, `maj ${slot.id} (retry)`);
    }
    if (r.status !== 200 && r.status !== 201) throw new Error("PUT HTTP " + r.status + " " + r.text.slice(0, 140));
  }

  async function run() {
    if (GITHUB_TOKEN.indexOf("PASTE_") === 0) {
      toast("Ajoute ton token GitHub dans le script (Tampermonkey).", false);
      return;
    }
    // Attendre que les valeurs soient rendues (SPA) — jusqu'à ~24s.
    let p = null;
    for (let i = 0; i < 16; i++) {
      p = parse();
      if (p.num && (p.dataGo != null || p.voiceMin != null || p.voiceUnlimited)) break;
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (!p || !p.num) {
      toast("Ligne non reconnue — es-tu bien connecté ?", false);
      return;
    }
    if (p.dataGo == null && p.voiceMin == null && !p.voiceUnlimited) {
      toast("Valeurs introuvables sur cette page.", false);
      return;
    }
    const slot = LINES[p.num];
    toast("Mise à jour de " + slot.label + "…");
    try {
      await pushOnce(p, slot);
      const bits = [];
      if (p.dataGo != null) bits.push(p.dataGo + " Go");
      if (p.voiceMin != null) bits.push(Math.floor(p.voiceMin / 60) + "h" + String(p.voiceMin % 60).padStart(2, "0"));
      if (p.voiceUnlimited) bits.push("appels ∞");
      toast(slot.label + " ✓ " + bits.join(" · "), true);
      if (REFRESH_MIN > 0) setTimeout(() => location.reload(), REFRESH_MIN * 60000);
      if (AUTO_CLOSE) setTimeout(() => window.close(), 2500);
    } catch (e) {
      toast("Échec de l'envoi : " + (e && e.message ? e.message : e), false);
    }
  }

  // Laisser la page se stabiliser un instant avant de lancer.
  setTimeout(run, 1500);
})();
