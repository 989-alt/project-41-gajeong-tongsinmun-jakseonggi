"""End-to-end smoke test for Letter Studio (가정통신문 자동 작성기).

Runs against http://localhost:5180 (started by with_server.py).
- Loads the page
- Fills school header
- Selects the field-trip template
- Fills fields, verifies preview updates
- Switches templates
- Triggers print path (cancelled)
- Checks console / page errors
- Saves a few screenshots for visual review

Exit code 0 = pass.
"""
import json
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "tests" / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)
URL = os.environ.get("APP_URL", "http://127.0.0.1:5180/")

NOISE = (
    "cdn.tailwindcss.com",
    "favicon",
    "DevTools",
    "Failed to load resource: net::ERR_CERT",
)


def is_noise(msg: str) -> bool:
    return any(n in msg for n in NOISE)


def run() -> int:
    failures: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, locale="ko-KR")
        page = ctx.new_page()
        console_errors: list[str] = []
        page_errors: list[str] = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" and not is_noise(m.text) else None)
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        # 1. load
        page.goto(URL)
        page.wait_for_load_state("networkidle")
        page.screenshot(path=str(SHOTS / "01-initial.png"), full_page=True)

        # empty-state visible
        expect(page.locator("#paper-empty")).to_be_visible()
        expect(page.locator("#paper-doc")).to_be_hidden()

        # 2. fill school header
        page.fill("#schoolName", "한빛초등학교")
        page.fill("#grade", "5")
        page.fill("#classNo", "3")
        page.fill("#teacherName", "김민호")
        page.screenshot(path=str(SHOTS / "02-school-filled.png"), full_page=True)

        # 3. pick "현장 체험학습" template
        page.locator(".tpl-card[data-id='fieldtrip']").click()
        page.wait_for_selector("#paper-doc:not([hidden])")
        page.wait_for_timeout(120)
        # empty-state must be visually gone, not just attribute-hidden
        expect(page.locator("#paper-empty")).to_be_hidden()
        expect(page.locator("#doc-school")).to_have_text("한빛초등학교")
        expect(page.locator("#doc-meta")).to_contain_text("5학년")
        expect(page.locator("#doc-meta")).to_contain_text("3반")
        page.screenshot(path=str(SHOTS / "03-template-selected.png"), full_page=True)

        # 4. fill key fields
        page.fill("#f-title", "5학년 3반 가을 현장 체험학습 안내")
        page.fill("#f-summary", "국립중앙박물관 견학 일정 및 준비물 안내")
        page.fill("#f-place", "국립중앙박물관")
        page.fill("#f-meetPoint", "학교 정문 앞")
        page.fill("#f-dismissPoint", "학교 정문 앞")
        page.fill("#f-transport", "전세버스 2대")
        page.fill("#f-items", "점심 도시락, 물 1병, 필기구, 우산")
        page.fill("#f-leaders", "담임 1명, 보조 교사 1명")
        page.fill("#f-emergency", "학교 02-000-0000")
        page.wait_for_timeout(100)
        expect(page.locator("#doc-title")).to_have_text("5학년 3반 가을 현장 체험학습 안내")
        expect(page.locator("#doc-fields")).to_contain_text("국립중앙박물관")
        expect(page.locator("#doc-fields")).to_contain_text("학교 정문 앞")
        expect(page.locator("#doc-sig-label")).to_contain_text("김민호")
        page.screenshot(path=str(SHOTS / "04-fieldtrip-filled.png"), full_page=True)

        # 5. switch to safety template - state isolated
        page.locator(".tpl-card[data-id='safety']").click()
        page.wait_for_timeout(150)
        # fieldtrip-specific title should no longer be shown
        title_now = page.locator("#doc-title").inner_text()
        if "현장 체험학습" in title_now:
            failures.append("Switching template did not reset doc-title")
        page.fill("#f-hazard", "폭염")
        page.fill("#f-level", "경보")
        page.fill("#f-rules", "외출 자제, 수분 섭취, 가벼운 옷차림")
        expect(page.locator("#doc-fields")).to_contain_text("폭염")
        page.screenshot(path=str(SHOTS / "05-safety-filled.png"), full_page=True)

        # 6. button states
        if page.locator("#download-pdf").is_disabled():
            failures.append("download-pdf button still disabled after template selection")
        if page.locator("#print-btn").is_disabled():
            failures.append("print-btn still disabled after template selection")

        # 7. theme toggle
        page.locator("#theme-toggle").click()
        page.wait_for_timeout(50)
        if page.evaluate("document.documentElement.getAttribute('data-theme')") != "light":
            failures.append("Theme toggle did not switch to light")
        page.screenshot(path=str(SHOTS / "06-light-theme.png"), full_page=True)
        page.locator("#theme-toggle").click()
        page.wait_for_timeout(50)

        # 8. recent list initially empty
        if "저장된" not in page.locator("#recent-list").inner_text():
            failures.append("Recent empty state copy missing")

        # 9. simulate save-via-print: monkey-patch window.print
        page.evaluate("window.print = () => { window.__printed = true; }")
        page.locator("#print-btn").click()
        page.wait_for_timeout(120)
        printed = page.evaluate("window.__printed === true")
        if not printed:
            failures.append("print() was not called")
        # after print, recent list should now have an item
        recent_text = page.locator("#recent-list").inner_text()
        if "폭염" not in recent_text and "안전" not in recent_text:
            failures.append(f"Recent list missing entry after print: {recent_text!r}")
        page.screenshot(path=str(SHOTS / "07-after-print.png"), full_page=True)

        # 10. accessibility: focus visible on first form input
        page.locator("#schoolName").focus()
        outline = page.evaluate(
            "(() => { const e = document.getElementById('schoolName'); const s = getComputedStyle(e); return { outline: s.outlineColor + ' ' + s.outlineWidth, boxShadow: s.boxShadow }; })()"
        )
        if "rgb" not in outline["boxShadow"]:
            failures.append(f"No focus indicator on #schoolName: {outline}")

        # 11. final state JSON
        state_snapshot = {
            "doc_title": page.locator("#doc-title").inner_text(),
            "doc_school": page.locator("#doc-school").inner_text(),
            "doc_meta": page.locator("#doc-meta").inner_text(),
            "recent_count": page.locator(".recent-item").count(),
            "console_errors": console_errors,
            "page_errors": page_errors,
        }
        (ROOT / "tests" / "state-snapshot.json").write_text(
            json.dumps(state_snapshot, ensure_ascii=False, indent=2)
        )

        browser.close()

    if console_errors:
        failures.append(f"Console errors: {console_errors}")
    if page_errors:
        failures.append(f"Page errors: {page_errors}")

    print("─" * 60)
    print(f"Screenshots: {SHOTS}")
    print(f"Failures: {len(failures)}")
    for f in failures:
        print(f"  ✗ {f}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(run())
