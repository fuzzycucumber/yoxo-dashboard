#!/usr/bin/env python3
"""Validation tests for the Ma Conso dashboard.

Runs without a browser: checks the data contract sample and key invariants
of index.html so a bad edit fails fast.
"""
import json
import hashlib
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FAILS = []


def check(cond, msg):
    if cond:
        print(f"  ok  - {msg}")
    else:
        print(f" FAIL - {msg}")
        FAILS.append(msg)


def valid_bucket(b, name):
    if b is None:
        return True
    if not isinstance(b, dict):
        return False
    if b.get("unlimited") is True:
        return True
    if "remaining" not in b and "total" not in b:
        return False
    for k in ("remaining", "total"):
        if k in b and not isinstance(b[k], (int, float)):
            return False
    return True


def test_data_sample():
    print("data.sample.json")
    d = json.loads((ROOT / "data.sample.json").read_text(encoding="utf-8"))
    check("updatedAt" in d, "has updatedAt")
    check(isinstance(d.get("lines"), list) and len(d["lines"]) == 2, "has 2 lines")
    for i, ln in enumerate(d["lines"]):
        check(bool(ln.get("id")), f"line {i} has id")
        for bucket in ("data", "voice", "sms"):
            check(valid_bucket(ln.get(bucket), bucket), f"line {i} '{bucket}' bucket valid")


def test_index_html():
    print("index.html")
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    for anchor in ('id="gate"', 'id="cards"', "PASSWORD_SHA256", "DATA_URL",
                   "data.json", "CONFIG", "LINES", "Ligne 1", "Ligne 2"):
        check(anchor in html, f"contains {anchor!r}")
    # privacy: no Moroccan mobile number (0[67] + 8 digits) baked into the public build
    import re
    leaked = re.findall(r"0[67]\d{8}", html)
    check(not leaked, "does NOT hard-code any mobile number")
    # demo password hash must match sha256('yoxo2026')
    expected = hashlib.sha256(b"yoxo2026").hexdigest()
    check(expected in html, "ships a resolvable demo password hash (yoxo2026)")
    # no obvious leftover corruption / TODO markers
    check("TODO" not in html and "FIXME" not in html, "no TODO/FIXME markers")


def test_userscript():
    print("yoxo-userscript.user.js")
    import re
    p = ROOT / "yoxo-userscript.user.js"
    check(p.exists(), "userscript present")
    if not p.exists():
        return
    js = p.read_text(encoding="utf-8")
    check("PASTE_YOUR_GITHUB_PAT_HERE" in js, "ships a token placeholder (not a real token)")
    check("api.github.com" in js and "@connect" in js, "declares GitHub API connect grant")
    check("espace-client.yoxo.ma" in js, "matches the Yoxo domain")
    # never commit a real fine-grained token
    check(not re.search(r"github_pat_[A-Za-z0-9_]{20,}", js), "no real github_pat_ token committed")


if __name__ == "__main__":
    test_data_sample()
    test_index_html()
    test_userscript()
    print()
    if FAILS:
        print(f"{len(FAILS)} check(s) failed")
        sys.exit(1)
    print("All checks passed.")
