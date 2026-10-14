#!/usr/bin/env python3
"""Merge the three synthesis parts into research/bible.md, claims.json, quotes.json."""
import json, re, os, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.dirname(HERE)

def load(name):
    return open(os.path.join(HERE, name), encoding="utf-8").read()

def sections(text):
    out = collections.OrderedDict()
    parts = re.split(r"<!--SECTION:([A-Z_]+)-->", text)
    for i in range(1, len(parts), 2):
        out[parts[i]] = parts[i + 1].strip("\n")
    return out

P = [sections(load(f"bible_p{i}.md")) for i in (1, 2, 3)]

# ---------- claims & quotes ----------
claims = []
for i in (1, 2, 3):
    claims += json.load(open(os.path.join(HERE, f"claims_p{i}.json"), encoding="utf-8"))
quotes_by_part = []
seen_text = {}
dropped = {}
for i in (1, 2, 3):
    qs = []
    for q in json.load(open(os.path.join(HERE, f"quotes_p{i}.json"), encoding="utf-8")):
        key = re.sub(r"\W+", " ", q["text"].lower()).strip()
        if key in seen_text:
            dropped[q["id"]] = seen_text[key]
            continue
        seen_text[key] = q["id"]
        qs.append(q)
    quotes_by_part.append(qs)
quotes = [q for qs in quotes_by_part for q in qs]

cids = [c["id"] for c in claims]
qids = [q["id"] for q in quotes]
assert len(cids) == len(set(cids)), "duplicate claim ids"
assert len(qids) == len(set(qids)), "duplicate quote ids"
for c in claims:
    assert set(c) == {"id", "claim", "date", "era", "sources", "status"}, c["id"]
    assert c["status"] in ("confirmed", "contested"), c["id"]
    assert c["sources"] and all(s.startswith("http") for s in c["sources"]), c["id"]
for q in quotes:
    assert set(q) == {"id", "text", "speaker", "date", "source", "context"}, q["id"]
    assert q["source"].startswith("http"), q["id"]

# ---------- chronology ----------
MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}
SEASONS = {"winter": 1, "early": 1, "spring": 4, "mid": 6, "summer": 7, "autumn": 10, "fall": 10, "late": 11}

def date_key(s):
    y = re.search(r"(1[89]\d\d|20\d\d)", s)
    year = int(y.group(1)) if y else 9999
    month, day = 0, 0
    mm = re.search(r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b", s, re.I)
    if mm:
        month = MONTHS[mm.group(1).lower()]
        d = re.search(r"(\d{1,2})\D{0,6}" + re.escape(mm.group(0)), s)
        pre = s[: mm.start()]
        dd = re.search(r"(\d{1,2})(?!\d)", pre)
        if dd and int(dd.group(1)) <= 31:
            day = int(dd.group(1))
    else:
        ss = re.search(r"\b(winter|spring|summer|autumn|fall|early|mid|late)\b", s, re.I)
        if ss:
            month = SEASONS[ss.group(1).lower()]
    return (year, month, day)

chrono_lines, seen = [], set()
for p in P:
    for line in p["CHRONO"].splitlines():
        line = line.rstrip()
        if not line.startswith("- **"):
            continue
        if line in seen:
            continue
        seen.add(line)
        m = re.match(r"- \*\*(.+?)\*\*", line)
        chrono_lines.append((date_key(m.group(1)), len(chrono_lines), line))
chrono_lines.sort(key=lambda t: (t[0], t[1]))

# ---------- hooks ----------
hook_text = {}
hooks_by_part = []
for p in P:
    lines = [l for l in p["HOOKS"].splitlines() if l.startswith("- H-")]
    hooks_by_part.append(lines)
    for l in lines:
        hid = l[2:].split(":", 1)[0]
        hook_text[hid] = l[2:].split(":", 1)[1].strip()

RANKED = [
    ("H-navy", ""),
    ("H-bedroom", "Say 'per the Computer History Museum' — NVIDIA describes a lab (contested)."),
    ("H-fiveseconds", ""),
    ("H-skeptic", "Minsky and Papert are not villains; see §9."),
    ("H-birthday", "Restraint: an accident, never implied despair."),
    ("H-pitts", "Use Gefter's account with attribution."),
    ("H-standing", "Attribute the auction details to Cade Metz."),
    ("H-move19", "Treat Lee Sedol with dignity; give him move 78."),
    ("H-randomorder", ""),
    ("H-finnish", ""),
    ("H-checks", "The winter was of prestige, not use."),
    ("H-rabbit", ""),
    ("H-feltfaster", "METR now calls the result outdated — say 'early-2025 tools'."),
    ("H-answerkey", "Pair with the sceptical community post."),
    ("H-biggestloss", ""),
    ("H-hiddenreceipt", ""),
    ("H-cheaphotel", ""),
    ("H-twoofthree", ""),
    ("H-love", ""),
    ("H-motors", ""),
    ("H-chinchilla", ""),
    ("H-backflip", ""),
    ("H-octopus", ""),
    ("H-cia", ""),
    ("H-weekend", ""),
    ("H-nuclear", ""),
    ("H-19years", ""),
    ("H-twogpus", ""),
    ("H-waitgpus", ""),
    ("H-hallucinated", ""),
    ("H-intern", ""),
    ("H-goldengate", ""),
    ("H-sark", ""),
    ("H-versailles", ""),
    ("H-72hours", ""),
    ("H-bletchleyboth", ""),
    ("H-importersaidno", ""),
    ("H-rulerrunsout", ""),
]
for hid, _ in RANKED:
    assert hid in hook_text, hid

# ---------- assemble ----------
nclaims, ncontested = len(claims), sum(c["status"] == "contested" for c in claims)
out = []
w = out.append
w("# Research Bible — *neural-net-history* (pilot film)")
w("")
w("**The screenwriter's single source of truth.** As of **5 October 2026**. Synthesised from all 14 research dossiers in `research/dossiers/` (one per topic in `research/plan.json`) and their 14 adversarial fact-check verdicts in `research/factcheck/`. Only fact-checked content is here: every claim a fact-checker corrected appears in its corrected form, and every item marked unverifiable is excluded (see §11, *Do not use*).")
w("")
w(f"- **Claims:** {nclaims} in `research/claims.json` ({nclaims - ncontested} confirmed, {ncontested} contested). Bracketed IDs like `[e8-result]` point to them; IDs beginning `q` point to `research/quotes.json`.")
w(f"- **Quotes:** {len(quotes)} verified, verbatim quotations in `research/quotes.json` (§6). Anything not there must not be quoted.")
w("- **Eras:** E1–E14, from the logical neuron (1943) to reasoning models and agents (2026). Era labels in `claims.json` match §2.")
w("- **Deep dives:** AlexNet (Primer F) and the Transformer (Primer J).")
w("- **Standards:** contested claims are narrated two-sided with attribution; machine-generated text is labelled as such; appearance notes are unverified unless stated and must be checked against licensed photographs; the narrator is an archetype and must not sound like or claim to be Geoffrey Hinton.")
w("")
w("## Contents")
for i, t in enumerate(["Master chronology", "Eras: belief, holders, dissent, duration, ending", "People index", "Experiments and machines (for the art department)", "Technical primers", "Verified quotes", "Debates (two-sided)", "Curiosity hooks (ranked top 38, then all)", "Sensitive-topic guidance", "Where things stand on 5 October 2026", "Do not use", "Further verified details"], 1):
    w(f"{i}. {t}")
w("")
w("---")
w("")
w("## 1. Master chronology")
w("")
w("One dated line per event, sorted by date; IDs point to `claims.json`.")
w("")
for _, _, line in chrono_lines:
    w(line)
w("")
w("---")
w("")
w("## 2. Eras")
w("")
w("Each era: the belief of the age, who held it, who dissented, how long it lasted, and what ended it.")
w("")
for p in P:
    w(p["ERAS"])
    w("")
w("---")
w("")
w("## 3. People index")
w("")
w("Role, institutions and silhouette notes. *Silhouette notes are unverified unless stated; confirm against licensed reference photos; never caricature.*")
w("")
for title, p in zip(["### Eras 1–6 (1943–2006)", "### Eras 7–9 (2006–2017)", "### Eras 10–14 (2017–2026)"], P):
    w(title)
    w("")
    w(p["PEOPLE"])
    w("")
w("---")
w("")
w("## 4. Experiments and machines")
w("")
w("Physical descriptions for the art department. Keep hardware and interfaces generic; no logos or trademarked characters.")
w("")
for p in P:
    w(p["MACHINES"])
    w("")
w("---")
w("")
w("## 5. Technical primers")
w("")
w("Precise mechanics, numbers and intuition. Primers A–E (eras 1–6), F–I (eras 7–9; **F is the AlexNet deep dive**), J–P (eras 10–14; **J is the Transformer deep dive**). Numbers marked *derived* are our own arithmetic from primary figures; worked examples are illustrative and labelled as such.")
w("")
for p in P:
    w(p["PRIMERS"])
    w("")
w("---")
w("")
w("## 6. Verified quotes")
w("")
w("Verbatim, with speaker, date, context and source. Only these may be quoted. Translations are flagged; machine-generated text is labelled. Fragments are marked as such in their context note.")
w("")

def qblock(q):
    w(f"> “{q['text']}”")
    w(f"> — **{q['speaker']}**, {q['date']}. {q['context']} [{q['id']}]  ")
    w(f"> Source: {q['source']}")
    w("")

w("### Eras 1–6 (1943–2006)")
w("")
for q in quotes_by_part[0]:
    qblock(q)
w("### Eras 7–9 (2006–2017)")
w("")
for q in quotes_by_part[1]:
    qblock(q)
ERA_TITLES = {"q10": "### Era 10 — Transformers and the pretraining era", "q11": "### Era 11 — Scaling, RLHF, the parrot debate, Anthropic", "q12": "### Era 12 — ChatGPT and the frontier-lab race", "q13": "### Era 13 — The US–China AI race", "q14": "### Era 14 — Reasoning, agents and the current understanding"}
cur = None
for q in quotes_by_part[2]:
    pre = q["id"][:3]
    if pre != cur:
        cur = pre
        w(ERA_TITLES[pre])
        w("")
    qblock(q)
w("---")
w("")
w("## 7. Debates")
w("")
w("Fair two-sided summaries. The film presents; it does not adjudicate.")
w("")
for p in P:
    w(p["DEBATES"])
    w("")
w("---")
w("")
w("## 8. Curiosity hooks")
w("")
w("### 8.1 The 38 best, ranked")
w("")
w("Ranked for surprise, visual power and narrative weight, then accuracy-checked. Each traces to claims; notes say how to use it safely.")
w("")
for n, (hid, note) in enumerate(RANKED, 1):
    w(f"{n}. **{hid}** — {hook_text[hid]}" + (f" *Note: {note}*" if note else ""))
w("")
w("### 8.2 All hooks, by era")
w("")
for title, lines in zip(["**Eras 1–6**", "**Eras 7–9**", "**Eras 10–14**"], hooks_by_part):
    w(title)
    w("")
    for l in lines:
        w(l)
    w("")
w("---")
w("")
w("## 9. Sensitive-topic guidance")
w("")
w(P[2]["SENSITIVE_GLOBAL"])
w("")
for title, p in zip(["### Eras 1–6", "### Eras 7–9", "### Eras 10–14 (including the lab this film is made with)"], P):
    w(title)
    w("")
    w(p["SENSITIVE"])
    w("")
w("---")
w("")
w("## 10. Where things stand on 5 October 2026")
w("")
w(P[2]["NOW"])
w("")
w("---")
w("")
w("## 11. Do not use")
w("")
w("Corrected, unverified or demoted by the fact-checkers. Earlier eras' items (e.g. Hinton's “I last sat down in 2005…”) are flagged in §9.")
w("")
w(P[2]["DONOTUSE"])
w("")
# ---------- appendix: claims not yet cited in the prose ----------
pre = "\n".join(out)
cited = set()
for grp in re.findall(r"\[([a-z0-9][a-z0-9\-, ]+)\]", pre):
    for r in grp.split(","):
        cited.add(r.strip())
extra = [c for c in claims if c["id"] not in cited]
if extra:
    w("---")
    w("")
    w("## 12. Further verified details")
    w("")
    w("Fact-checked claims not cited above, kept for completeness (useful for captions and texture).")
    w("")
    cur = None
    for c in extra:
        if c["era"] != cur:
            if cur is not None:
                w("")
            cur = c["era"]
            w(f"**{cur}**")
            w("")
        flag = " *(contested — attribute both sides)*" if c["status"] == "contested" else ""
        w(f"- {c['claim']}{flag} [{c['id']}]")
    w("")
bible = "\n".join(out)
for qid, keep in dropped.items():
    bible = bible.replace(qid, keep)

# ---------- reference check ----------
known = set(cids) | set(qids)
refs = set()
for grp in re.findall(r"\[([a-z0-9][a-z0-9\-, ]+)\]", bible):
    for r in grp.split(","):
        r = r.strip()
        if re.match(r"^(e\d+|q[\d-])", r):
            refs.add(r)
missing = sorted(r for r in refs if r not in known)
unref = sorted(set(cids) - refs)

open(os.path.join(RES, "bible.md"), "w", encoding="utf-8").write(bible + "\n")
json.dump(claims, open(os.path.join(RES, "claims.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(quotes, open(os.path.join(RES, "quotes.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps({"claims": nclaims, "contested": ncontested, "quotes": len(quotes), "dropped_dupe_quotes": dropped,
                  "chrono_lines": len(chrono_lines), "missing_refs": missing, "unreferenced_claims": len(unref),
                  "bible_bytes": len(bible)}, indent=1))
