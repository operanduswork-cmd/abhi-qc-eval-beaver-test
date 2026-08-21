"""
Photographs every page of the app, in the order an operator walks through it.

    npm run browser-seed && npm run screenshots

Desktop 1440 and phone 390 for the screens whose layout differs; the two honest-failure pages are
plain text at any width, so they get one each.

The run form appears three times on purpose: empty, with a transcript pasted (so the live
measurement panel is visible), and as a stranger sees it with no past runs at all. That last
difference IS the privacy fix, so it is worth a picture rather than a sentence.
"""
import json, os, subprocess
from playwright.sync_api import sync_playwright

BASE     = os.environ.get("QC_BASE", "http://localhost:3210")
OUT      = "screenshots"
FINISHED = "8898427a-e9b2-4cda-81af-d05c000d2010"
# The running and dead runs come from `npm run browser-seed`.
with open(os.path.join(os.path.dirname(__file__), "seeded.json"), encoding="utf-8") as fh:
    _seeded = json.load(fh)
RUNNING  = os.environ.get("QC_RUNNING", _seeded["running"])
FACTS    = os.environ.get("QC_FACTS", _seeded.get("facts", _seeded["running"]))
FAILED   = os.environ.get("QC_FAILED", _seeded["failed"])

# The progress page only shows "still going" while the heartbeat is fresh; loadRun sweeps a run
# with no beat for 120s to worker_died. Bump it immediately before photographing it.
subprocess.run(["node", "--experimental-strip-types", "test/browser/beat.ts", RUNNING], check=True)

TRANSCRIPT = open("fixtures/transcripts/coaching-01.txt", encoding="utf-8").read()

for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))


def shot(pg, url, name, full=False, before=None, after=None):
    pg.goto(url, wait_until="networkidle")
    if before:
        before(pg)
    pg.wait_for_timeout(500)
    if after:
        after(pg)
    path = os.path.join(OUT, name)
    pg.screenshot(path=path, full_page=full)
    print(f"  {name:34s} {os.path.getsize(path)//1024:>5d} KB  {url}")


def fill_form(pg):
    pg.fill("#qcText", TRANSCRIPT)
    pg.wait_for_function(
        """() => /35,557/.test(document.querySelector('[data-qc="measure"]').innerText)""",
        timeout=15000)
    pg.evaluate("() => { const t = document.getElementById('qcText'); if(t) t.scrollTop = 0; }")


def open_dimension(pg):
    dets = pg.locator("details")
    for i in range(dets.count()):
        head = (dets.nth(i).inner_text().strip().splitlines() or [""])[0].strip()
        if head.isdigit():
            dets.nth(i).click()
            pg.wait_for_timeout(300)
            dets.nth(i).scroll_into_view_if_needed()
            pg.wait_for_timeout(200)
            return
    print("    ! no dimension disclosure found")


def open_citation(pg):
    """The evidence line number opens the transcript around the quote — the point of the feature."""
    open_dimension(pg)
    c = pg.locator("[data-cite-line]").first
    c.scroll_into_view_if_needed()
    c.click()
    pg.wait_for_selector('[data-qc="cite-pop"]', timeout=8000)
    pg.wait_for_function(
        """() => { const b = document.querySelector('[data-qc="cite-body"]');
                   return b && !/loading/.test(b.textContent); }""", timeout=8000)


def click_share(pg):
    pg.locator("#qcShare").click()
    pg.wait_for_timeout(350)


def wait_for_rows(pg):
    pg.wait_for_function("""() => {
        const l = document.querySelector('[data-runs="list"]');
        return l && !l.hasAttribute('hidden');
    }""", timeout=10000)


def paste_then_wait(pg):
    fill_form(pg)
    wait_for_rows(pg)


with sync_playwright() as p:
    b = p.chromium.launch()

    print("desktop 1440")
    fresh = b.new_context(viewport={"width": 1440, "height": 1000})
    pg = fresh.new_page()
    shot(pg, BASE,          "01-landing.png",             full=True)
    shot(pg, f"{BASE}/new", "02-run-form-fresh.png",      full=True)

    # seed this browser's own runs so the populated history can be photographed
    pg.evaluate("() => localStorage.setItem('qc.runs', JSON.stringify(%s))"
                % str([FINISHED, RUNNING, FAILED]).replace("'", '"'))
    shot(pg, f"{BASE}/new", "02b-run-form-with-history.png", full=True, before=wait_for_rows)
    shot(pg, f"{BASE}/new", "02c-run-form-pasted.png",       full=True, before=paste_then_wait)
    shot(pg, f"{BASE}/runs/{FACTS}",    "03-progress-fact-pass.png")
    shot(pg, f"{BASE}/runs/{RUNNING}",  "03b-progress-scoring.png")
    shot(pg, f"{BASE}/runs/{FINISHED}", "04-report.png",            full=True)
    shot(pg, f"{BASE}/runs/{FINISHED}", "05-report-dimension.png",  full=True, before=open_dimension)
    shot(pg, f"{BASE}/runs/{FINISHED}", "06-report-share.png",      before=click_share)
    shot(pg, f"{BASE}/runs/{FINISHED}", "06b-report-citation.png",   before=open_citation)
    shot(pg, f"{BASE}/runs/{FAILED}",   "07-failed-run.png")
    shot(pg, f"{BASE}/runs/00000000-0000-4000-8000-000000000000", "08-run-not-found.png")
    fresh.close()

    print("phone 390")
    mob = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    mp = mob.new_page()
    shot(mp, BASE,                      "01-landing-mobile.png",  full=True)
    shot(mp, f"{BASE}/new",             "02-run-form-mobile.png", full=True)
    shot(mp, f"{BASE}/runs/{RUNNING}",  "03-progress-mobile.png", full=True)
    shot(mp, f"{BASE}/runs/{FINISHED}", "04-report-mobile.png",   full=True)
    mob.close()

    b.close()
print("\nwrote", len(os.listdir(OUT)), "files to", OUT + "/")
