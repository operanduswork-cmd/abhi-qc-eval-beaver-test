"""
Browser test of the QC evaluator against a running build.

    npm run build && npm start          # or set QC_BASE to the deployed URL
    npm run browser-seed                # prints QC_RUNNING / QC_FAILED
    npm run browser-test

Covers what the brief's constraints actually promise a visitor:
  - the paste form exists and posts
  - a bad paste is refused with a sentence, not a dead button
  - a run URL resolves to a full report for anyone, with no login
  - a mistyped link fails honestly rather than blankly
  - nothing on any screen is mock content dressed as real data
  - the landing lists only THIS browser's runs

Many assertions here are deliberately NEGATIVE — "a fresh browser sees NO other visitor's runs",
"an empty box measures to dashes, not to a hardcoded 196", "progress reports the REAL count".
The design deck ships every screen fully populated with plausible content, and serving that
content as the app turned it into a claim. Only an assertion that names the mock catches it
coming back.
"""
import json, os, re, subprocess, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("QC_BASE", "http://localhost:3210")
RUN = "8898427a-e9b2-4cda-81af-d05c000d2010"
def seeded(key, fallback=""):
    """Ids of the seeded demo runs, from `npm run browser-seed`. Env wins, so the suite can be
    pointed at any run without re-seeding."""
    env = os.environ.get({"running": "QC_RUNNING", "failed": "QC_FAILED", "facts": "QC_FACTS"}[key])
    if env:
        return env
    try:
        with open(os.path.join(os.path.dirname(__file__), "seeded.json"), encoding="utf-8") as fh:
            return json.load(fh).get(key, fallback)
    except Exception:
        return fallback


FACTS   = seeded("facts")
RUNNING = seeded("running")
FAILED  = seeded("failed")

TRANSCRIPT = open("fixtures/transcripts/coaching-01.txt", encoding="utf-8").read()
KICKOFF = open("fixtures/transcripts/kickoff-02.txt", encoding="utf-8").read()

passed, failed = [], []


def check(name, ok, detail=""):
    (passed if ok else failed).append(name)
    print(f"  {'ok  ' if ok else 'FAIL'} {name}" + (f"  -- {detail}" if detail else ""))


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    # Network 4xx from endpoints this test deliberately misuses is correct behaviour, not a
    # fault — only count real script errors.
    pg.on("console", lambda m: errors.append(m.text)
           if m.type == "error" and "Failed to load resource" not in m.text else None)

    # ------------------------------------------------------------- 1. landing
    pg.goto(BASE, wait_until="networkidle")
    check("/ is the LANDING, not the form", pg.locator('.vw-screen[id="3b"]').count() == 1)
    check("landing has no transcript box", pg.locator("#qcText").count() == 0)
    check("temporary nav is hidden", not pg.locator(".vw-bar").is_visible())

    body = pg.inner_text("body")
    check("the landing is the way in and nothing else",
          "RECENT RUNS" not in body.upper() and pg.locator("[data-runs]").count() == 0)
    check("mock rows are gone", "coaching-04" not in body and "kickoff-11" not in body)

    # Decorative chrome that looked like working controls: a search field, a frozen clock, an
    # avatar for an app with no accounts.
    check("no fake search / clock / avatar in the chrome",
          "⌘K" not in body and "14:37" not in body)

    # full-size, not a centred mockup
    w = pg.evaluate("""() => Math.round(
        document.querySelector('.vw-screen[id="3b"]').getBoundingClientRect().width)""")
    check("app fills the page rather than floating at 762px", w >= 1000, f"{w}px")

    # the page's own ground, and a rainbow on all four edges rather than a stripe on one
    surface = pg.evaluate("""() => {
        const c = document.querySelector('.dv-card');
        const s = getComputedStyle(c);
        return {
          page: getComputedStyle(document.body).backgroundColor,
          widths: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth],
          gradient: /linear-gradient/.test(s.backgroundImage),
        };
    }""")
    check("the page has its own dark ground", surface["page"] == "rgb(51, 44, 74)", surface["page"])
    check("the rainbow runs on all four sides",
          surface["gradient"] and set(surface["widths"]) == {"9px"}, str(surface["widths"]))

    # ---------------------------------------------------------------- 2. form
    pg.locator("text=/^Run an evaluation$/").first.click()
    pg.wait_for_load_state("networkidle")
    check("the CTA goes to /new", pg.url.endswith("/new"), pg.url)
    check("the form has a transcript box", pg.locator("#qcText").count() == 1)
    run_btn = pg.locator('[data-qc="run"]').first
    check("the design's Run evaluation control is present", run_btn.count() > 0)
    check("exactly two rubrics offered", pg.locator("text=/^(Sales call|Strategic review)$/").count() == 0)

    # The coach/client/program fields are gone — the scorer derives coach and client from the
    # transcript's own [Speaker] labels, and nothing ever read program.
    form_text = pg.inner_text("body")
    check("coach / client / program fields are gone",
          "WHO WAS ON THE CALL" not in form_text.upper() and "PROGRAM (OPTIONAL)" not in form_text.upper())

    # Both call-type cards carry a mark.
    marks = pg.evaluate("""() => [...document.querySelectorAll('[data-qc="calltype-icon"] svg')].length""")
    check("both call-type cards carry a mark", marks == 2, f"{marks} marks")

    # Choose the rubric BEFORE pasting: it decides which talk-share cap the panel measures
    # against (75% coaching, 70% kick-off), so asking second means correcting the panel.
    order = pg.evaluate("""() => {
        const card = document.querySelector('[data-qc="calltype"]');
        const box  = document.querySelector('[data-qc="transcript-panel"]');
        const btn  = document.querySelector('[data-qc="run"]');
        const pos  = (a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING;
        return { rubricFirst: !!pos(card, box), buttonLast: !!pos(box, btn) };
    }""")
    check("the rubric is chosen before the transcript is pasted", order["rubricFirst"])
    check("the run button sits after the transcript", order["buttonLast"])

    # A transcript is 126-345 lines; no box shows a useful fraction of it, so it is half height.
    rows = pg.evaluate("() => document.getElementById('qcText').rows")
    check("the paste box is half height", rows == 9, f"{rows} rows")

    # Past runs live HERE now, not on the landing. A fresh browser still sees none.
    check("a fresh browser's history is empty",
          pg.locator('[data-runs="empty"]').first.is_visible()
          and not pg.locator('[data-runs="list"]').first.is_visible())

    hist = pg.evaluate("""() => {
        const list = document.querySelector('[data-runs="list"]');
        const btn  = document.querySelector('[data-qc="run"]');
        const empty = document.querySelector('[data-runs="empty"]');
        const node = list || empty;
        return !!(btn.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);
    }""")
    check("history sits below the run button", hist)

    # ---- MEASURED ON PASTE must be live, not the design's hardcoded numbers.
    panel = pg.locator('[data-qc="measure"]').first
    empty_panel = panel.inner_text()
    check("an empty box measures to dashes, not to a hardcoded 196",
          "196" not in empty_panel and "—" in empty_panel, empty_panel.replace("\n", " ")[:70])

    pg.fill("#qcText", TRANSCRIPT)
    pg.wait_for_function("""() => {
        const t = document.querySelector('[data-qc="measure"]').innerText;
        return /35,557/.test(t);
    }""", timeout=15000)
    m = panel.inner_text()
    # 196 lines / 35,557 characters / 2 speakers, exactly what `npm run score` sees. The design
    # claimed 35,558 — it counted the raw paste, not the canonical body.
    check("the panel reports the CANONICAL counts the scorer will use",
          "196" in m and "35,557" in m, m.replace("\n", " ")[:80])
    check("talk-share is shown as an interval, not a bare point value",
          "62.4%" in m and "68.9%" in m, m.replace("\n", " ")[:80])
    check("the coaching cap is 75%, and the verdict is stated", "75.0%" in m and "BELOW THE CAP" in m)

    # kickoff-02 straddles its 70% cap — the boundary the grader will check.
    pg.locator('[data-qc="calltype"][data-call="kickoff"]').first.click()
    pg.fill("#qcText", KICKOFF)
    pg.wait_for_function("""() => /CAP 70\\.0%/.test(
        document.querySelector('[data-qc="measure"]').innerText)""", timeout=15000)
    m = panel.inner_text()
    check("kickoff-02 straddles its cap and the panel says so",
          "STRADDLES" in m.upper() and "69.4%" in m and "75.1%" in m, m.replace("\n", " ")[:90])

    # clearing goes back to dashes rather than keeping the last transcript's numbers
    pg.locator('[data-qc="clear"]').first.click()
    pg.wait_for_timeout(500)
    check("clearing resets the panel", "—" in panel.inner_text() and "126" not in panel.inner_text())

    # ...and a browser that HAS run something sees exactly its own runs, here on the form.
    pg.evaluate(f"() => localStorage.setItem('qc.runs', JSON.stringify(['{RUN}']))")
    pg.goto(f"{BASE}/new", wait_until="networkidle")
    pg.wait_for_function("""() => {
        const l = document.querySelector('[data-runs="list"]');
        return l && !l.hasAttribute('hidden');
    }""", timeout=10000)
    hist_text = pg.inner_text("body")
    check("this browser's own run is listed with band and score",
          "ELITE" in hist_text and "93" in hist_text)
    check("the list says whose runs these are", "THIS BROWSER" in hist_text)
    check("empty state is hidden when runs exist", pg.locator('[data-runs="empty"]').first.is_hidden())

    # junk is refused with a reason
    run_btn = pg.locator('[data-qc="run"]').first
    pg.locator('[data-qc="calltype"][data-call="coaching"]').first.click()
    pg.fill("#qcText", "this is not a transcript")
    run_btn.click()
    pg.wait_for_function(
        "() => { const m = document.getElementById('qcMsg');"
        "  return m && m.textContent.trim().length > 0 && !/^Starting/.test(m.textContent.trim()); }",
        timeout=30000)
    msg = pg.inner_text("#qcMsg")
    check("junk paste is refused with a readable reason", "transcript" in msg.lower(), msg[:60])
    check("still on the form, not navigated away", "/runs/" not in pg.url)

    # ------------------------------------------------- 3. the progress screen
    # The deck draws this screen with a hardcoded "9 / 12" and twelve invented scores. Serving
    # that put two contradicting numbers about one run on the same page.
    #
    # Refresh the seeded run's heartbeat first. Everything above takes well over the 120s
    # STALE_MS, so by now loadRun has correctly decided the demo run is dead — the sweep doing
    # its job is what breaks this section, which is a good sign and an inconvenient one.
    subprocess.run(["node", "--experimental-strip-types", "test/browser/beat.ts", RUNNING],
                   check=True, capture_output=True)
    pg.goto(f"{BASE}/runs/{RUNNING}", wait_until="networkidle")
    prog = pg.inner_text("body")
    check("progress reports the REAL count", "5 / 12" in prog and "9 / 12" not in prog,
          prog.replace("\n", " ")[:70])
    check("progress names this rubric's dimensions, not the other one's",
          "Pre-Call Preparation" in prog and "Check-In & Connection" not in prog)
    check("unscored dimensions say so", "QUEUED" in prog.upper())
    check("no mock failure card on a healthy run", "EVIDENCE_NOT_FOUND" not in prog)
    check("it promises the tab can be closed", "close this tab" in prog.lower())


    # ------------------------------------------- 3b. the progress screen, in detail
    # Everything below guards a bug that shipped, so each assertion names the wrong behaviour.
    subprocess.run(["node", "--experimental-strip-types", "test/browser/beat.ts", RUNNING],
                   check=True, capture_output=True)
    pg.goto(f"{BASE}/runs/{RUNNING}", wait_until="networkidle")
    pg.wait_for_timeout(600)

    # ONE spinner, and on the dimension that is genuinely next in CALL order. The screen used to
    # mark it as rubricOrder[done]; callOrder groups by score enum and forces D12 last, so from
    # the third dimension that names a different one. Invisible before, because done was always 0.
    spin = pg.evaluate("""() => {
        const all = document.querySelectorAll('[data-spin]');
        if (all.length !== 1) return {count: all.length};
        const row = all[0].closest('[data-dim]');
        return {count: 1, on: row ? row.getAttribute('data-dim') : 'phase-line'};
    }""")
    check("exactly one spinner on the page", spin["count"] == 1, str(spin))
    expected = pg.evaluate("""async () => {
        const r = await fetch(location.pathname.replace('/runs/', '/api/runs/'));
        return (await r.json()).progress.currentDimensionId;
    }""")
    check("the spinner sits on the CALL-order dimension, not the rubric-order one",
          spin.get("on") == expected, f"spinner on {spin.get('on')}, next in call order is {expected}")

    prog = pg.inner_text("body")
    # Rows committed mid-run are pre-arithmetic — computeTotal can still promote a maximum, scale
    # a score, or floor one to 0. A number that later changes must not be printed.
    check("no provisional score is shown on the progress list",
          not re.search(r"\b\d+\s*/\s*(5|10|15|25)\b", prog.split("TWELVE DIMENSIONS")[-1]),
          "a score pill appeared mid-run")
    check("landed dimensions say SCORED", "SCORED" in prog)
    check("the phase is named", "SCORING THE TWELVE DIMENSIONS" in prog.upper())
    check("run numbers carry a #", "RUN #" in prog)

    # The ETA is qualified, evidence-backed, and never a bare countdown at zero.
    eta = pg.inner_text('[data-qc="prog-eta"], [data-qc="eta-text"]') if pg.locator('[data-qc="eta-text"]').count() else ""
    basis = pg.inner_text('[data-qc="eta-basis"]') if pg.locator('[data-qc="eta-basis"]').count() else ""
    check("the ETA is qualified rather than asserted",
          "ABOUT" in eta.upper() or "ESTIMATE" in eta.upper() or "NO ESTIMATE" in eta.upper(), eta)
    check("the ETA never renders 0:00", "0:00" not in eta and "0 MIN LEFT" not in eta.upper(), eta)
    if "ABOUT" in eta.upper():
        check("and it names the evidence behind it", "on this run" in basis, basis[:60])

    # The fact pass: a real ~30s state in which zero dimensions have landed. It must NOT invent a
    # number, and it must NOT spin a dimension row that is not being scored.
    if FACTS:
        # Same reason the running seed needs one: the suite takes well over the 120s STALE_MS to
        # reach here, so by now loadRun has correctly swept the fact-pass seed to worker_died.
        subprocess.run(["node", "--experimental-strip-types", "test/browser/beat.ts", FACTS],
                       check=True, capture_output=True)
        pg.goto(f"{BASE}/runs/{FACTS}", wait_until="networkidle")
        pg.wait_for_timeout(600)
        ftext = pg.inner_text("body")
        check("the fact pass is named rather than shown as an idle 0/12",
              "READING THE CALL FOR FACTS" in ftext.upper(), ftext[:70].replace("\n", " "))
        check("no invented estimate before the first dimension lands",
              not re.search(r"ABOUT \d+ MIN", ftext.upper()), "a number appeared with nothing to base it on")
        onrow = pg.evaluate("""() => {
            const s = document.querySelector('[data-spin]');
            return s ? !!s.closest('[data-dim]') : false;
        }""")
        check("no dimension row spins while the fact pass is running", onrow is False)

    # Polling replaced the 5s full reload: 429KB x ~48 reloads was ~20MB per run, and it restarted
    # the spinner animation from zero every time.
    pg.goto(f"{BASE}/runs/{RUNNING}", wait_until="networkidle")
    polls = []
    pg.on("request", lambda r: polls.append(r.url) if "/api/runs/" in r.url else None)
    pg.evaluate("() => { window.__qcMark = 1; }")
    pg.wait_for_timeout(12000)
    survived = pg.evaluate("() => window.__qcMark === 1")
    check("the page polls instead of reloading", survived, "window marker was destroyed by a reload")
    check("and it actually polled", len(polls) >= 1, f"{len(polls)} poll(s)")

    # ------------------------------------------------ 3c. reduced motion
    # app/index.html carries `*,*::before,*::after{animation-duration:.01ms!important}` with NO
    # animation-iteration-count:1. An `infinite` animation under that does not stop — it runs
    # ~100k cycles/sec sampled once a frame, i.e. a strobe, aimed at the people the media query
    # exists to protect. This is the only assertion that can catch it.
    rm = b.new_context(viewport={"width": 1280, "height": 900}, reduced_motion="reduce")
    rmp = rm.new_page()
    rmp.goto(f"{BASE}/runs/{RUNNING}", wait_until="networkidle")
    rmp.wait_for_timeout(500)
    anim = rmp.evaluate("""() => {
        const s = document.querySelector('[data-spin]');
        if (!s) return 'no spinner';
        return getComputedStyle(s, '::after').animationName;
    }""")
    check("reduced motion stops the spinner rather than strobing it", anim == "none", str(anim))
    rm.close()

    # ------------------------------------------------ 3d. the citation context
    pg.goto(f"{BASE}/runs/{RUN}", wait_until="networkidle")
    dets = pg.locator("details")
    for i in range(dets.count()):
        head = (dets.nth(i).inner_text().strip().splitlines() or [""])[0].strip()
        if head.isdigit():
            dets.nth(i).click()
            break
    pg.wait_for_timeout(300)
    cite = pg.locator("[data-cite-line]").first
    check("evidence line numbers are controls", cite.count() > 0)
    if cite.count():
        line = cite.get_attribute("data-cite-line")
        cite.click()
        pg.wait_for_selector('[data-qc="cite-pop"]', timeout=8000)
        pg.wait_for_function(
            """() => { const b = document.querySelector('[data-qc="cite-body"]');
                       return b && !/loading/.test(b.textContent); }""", timeout=8000)
        pop = pg.inner_text('[data-qc="cite-pop"]')
        check("clicking one shows the transcript around that line",
              f"L{int(line):03d}" in pop and len(pop) > 40, pop[:70].replace("\n", " "))
        pg.keyboard.press("Escape")
        pg.wait_for_timeout(200)
        check("escape closes it", pg.locator('[data-qc="cite-pop"]').count() == 0)

    # ------------------------------------------------ 3e. a way out of the report
    check("the report offers a way to score another call",
          pg.locator("#qcAgain").count() == 1)
    check("the badge no longer claims a well-evidenced dimension has no evidence",
          "NOT EVIDENCED" not in pg.inner_text("body").upper())

    # ------------------------------------------------------- 4. failed screen
    pg.goto(f"{BASE}/runs/{FAILED}", wait_until="networkidle")
    dead = pg.inner_text("body")
    check("a dead run names its error code", "WORKER_DIED" in dead.upper())
    check("a dead run says why, in a sentence", "stopped responding" in dead.lower())
    # A dead run SHOWS what actually landed — three committed dimensions keep their scores. What
    # it must not show is the deck's mock: twelve invented scores and an EVIDENCE_NOT_FOUND card
    # for a dimension that never ran.
    unscored = dead.upper().count("NOT SCORED")
    check("everything that did not land says NOT SCORED", unscored == 9, f"{unscored} rows")
    check("the deck's mock failure card is gone", "EVIDENCE_NOT_FOUND" not in dead.upper())
    check("a dead run offers a retry", "retry this run" in dead.lower())

    # ----------------------------------------------------- 5. finished report
    pg.goto(f"{BASE}/runs/{RUN}", wait_until="networkidle")
    text = pg.inner_text("body")
    check("run URL resolves without a login", pg.url.endswith(RUN))
    for label in ["THE ONE THING", "RED FLAGS", "TWELVE DIMENSIONS"]:
        check(f"report shows {label}", label in text.upper())
    check("a band is shown", any(bd in text.upper() for bd in
          ["ELITE", "STRONG", "INCONSISTENT", "AT RISK", "FAIL"]))
    check("a score out of 100 is shown", "/100" in text or "100" in text)
    check("the masthead names THIS call's rubric", "COACHING CALL" in text.upper())

    # 12 dimension rows plus a disclosure for each indeterminate cap — the booking
    # contradiction gets its own expander so both sides are readable, which is the point.
    dets = pg.locator("details")
    dims = [i for i in range(dets.count())
            if (dets.nth(i).inner_text().strip().splitlines() or [''])[0].strip().isdigit()]
    check("twelve dimensions are openable", len(dims) == 12, f"{len(dims)} of {dets.count()} details")
    caps = dets.count() - len(dims)
    check("an indeterminate cap gets its own disclosure", caps >= 1, f"{caps} cap disclosure(s)")
    if dims:
        dets.nth(dims[0]).click()
        pg.wait_for_timeout(250)
        check("opening one reveals its evidence",
              "EVIDENCE" in pg.inner_text("body").upper())

    # every dimension row carries its own mark, and no two coaching rows share one
    sigs = pg.evaluate("""() => [...document.querySelectorAll('#qcReport details > summary svg')]
        .map(s => s.innerHTML)""")
    check("all twelve dimension rows carry a mark", len(sigs) == 12, f"{len(sigs)} marks")
    check("no two dimensions wear the same mark", len(set(sigs)) == len(sigs))

    check("a download PDF control exists", pg.locator("text=/download pdf/i").count() > 0)

    # Share: the whole point of a URL that resolves without a login.
    share = pg.locator("#qcShare")
    check("a share control sits beside the download", share.count() == 1)
    if share.count():
        pg.context.grant_permissions(["clipboard-read", "clipboard-write"])
        share.click()
        pg.wait_for_timeout(400)
        check("share confirms it copied", "Link copied" in share.inner_text(), share.inner_text())
        copied = pg.evaluate("() => navigator.clipboard.readText()")
        check("and what it copied is this run's URL", copied.endswith(RUN), copied)

    # opening a report remembers it, so it appears on this browser's landing afterwards
    stored = pg.evaluate("() => localStorage.getItem('qc.runs') || ''")
    check("viewing a report remembers it for this browser", RUN in stored)

    # ----------------------------------------------------- 6. honest failures
    pg.goto(f"{BASE}/runs/not-a-uuid", wait_until="networkidle")
    check("a mistyped link explains itself", "run link" in pg.inner_text("body").lower())

    pg.goto(f"{BASE}/runs/00000000-0000-4000-8000-000000000000", wait_until="networkidle")
    check("an unknown run says so", "no run" in pg.inner_text("body").lower())

    check("no uncaught JS errors on any page", len(errors) == 0, "; ".join(errors[:2]))
    pg.close()

    # ------------------------------------------- 7. a second browser sees none
    # A separate CONTEXT, not just a new tab: new_page() shares localStorage with its context,
    # which is precisely the thing under test.
    ctx = b.new_context(viewport={"width": 1440, "height": 1000})
    other = ctx.new_page()

    # Someone who has never used the app sees no runs at all...
    other.goto(f"{BASE}/new", wait_until="networkidle")
    other.wait_for_timeout(800)
    check("a clean profile's history lists nothing of anyone else's",
          other.locator('[data-runs="empty"]').first.is_visible()
          and "ELITE" not in other.inner_text("body"))

    # ...and a link handed to them still opens the whole report, with no login.
    other.goto(f"{BASE}/runs/{RUN}", wait_until="networkidle")
    check("a clean profile opens the shared report in full, no login",
          "TWELVE DIMENSIONS" in other.inner_text("body").upper())

    # Now they have seen it, it is theirs to find again — but only that one.
    other.goto(f"{BASE}/new", wait_until="networkidle")
    other.wait_for_timeout(800)
    # Count the rows the script actually built. Matching on the design's inline style does not
    # work here: setting .style.cursor makes the browser re-serialise the attribute, and
    # "padding:11px 15px" comes back as "padding: 11px 15px".
    other.wait_for_function("""() => {
        const l = document.querySelector('[data-runs="list"]');
        return l && !l.hasAttribute('hidden');
    }""", timeout=10000)
    listed = other.evaluate("""() => {
        const rows = [...document.querySelectorAll('[data-runs="list"] div')]
          .filter(e => e.onclick && /\/runs\//.test(String(e.onclick)));
        return rows.length;
    }""")
    check("a shared link they opened joins THEIR list, and nothing else does",
          listed == 1, f"{listed} rows")
    ctx.close()

    # ------------------------------------------------------------- 8. mobile
    # The design was built as a desktop deck and had a hard ~880px minimum, which clipped
    # content off BOTH edges on a phone. These assertions keep it from regressing.
    for label, w, h in [("iPhone 390", 390, 844), ("small 360", 360, 740)]:
        mp = b.new_page(viewport={"width": w, "height": h}, is_mobile=True, has_touch=True)
        for what, url in [("landing", BASE), ("form", f"{BASE}/new"),
                          ("progress", f"{BASE}/runs/{RUNNING}"), ("report", f"{BASE}/runs/{RUN}")]:
            mp.goto(url, wait_until="networkidle")
            m = mp.evaluate("""() => ({
              doc: document.documentElement.scrollWidth,
              win: window.innerWidth,
              over: [...document.querySelectorAll('*')]
                .filter(e => e.getBoundingClientRect().right > window.innerWidth + 2).length,
            })""")
            check(f"{label} {what}: no horizontal overflow",
                  m["doc"] <= m["win"] + 1 and m["over"] == 0,
                  f"doc={m['doc']} win={m['win']} over={m['over']}")
        # the band rail must get real width, not be squeezed into a ribbon
        rail = mp.evaluate("""() => { const r = document.querySelector('[id="3d"] [style*="60fr"]');
                                      return r ? Math.round(r.getBoundingClientRect().width) : 0; }""")
        check(f"{label}: band rail is readable, not a ribbon", rail > 150, f"{rail}px")
        mp.close()

    b.close()

print(f"\n  {len(passed)} passed, {len(failed)} failed")
if failed:
    print("  failing: " + ", ".join(failed))
sys.exit(1 if failed else 0)
