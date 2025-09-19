from playwright.sync_api import sync_playwright, Page, expect
import time
import re

def verify_line_graph(page: Page):
    """
    This script verifies the RAG forecast graph.
    It checks for the new line graph and the updated tooltip.
    """
    print("Navigating to http://localhost:3000...")
    page.goto("http://localhost:3000", wait_until="networkidle")
    print("Page loaded.")

    print("Scrolling to the bottom of the page...")
    page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(1)
    print("Scrolled.")

    print("Waiting for the RAG Forecast text...")
    forecast_text = page.get_by_text("RAG Forecast")
    expect(forecast_text).to_be_visible(timeout=60000)
    print("Text found.")

    forecast_card = forecast_text.locator("xpath=../..")
    expect(forecast_card).to_be_visible()
    print("Forecast card found.")

    print("Waiting for graph bars to render...")
    first_bar = forecast_card.locator("rect.recharts-bar-rectangle").first
    expect(first_bar).to_be_visible(timeout=30000)
    print("Graph bars found.")

    print("Waiting for line graph to render...")
    line = forecast_card.locator("path.recharts-line-curve")
    expect(line).to_be_visible(timeout=10000)
    print("Line graph found.")

    print("Hovering over the first bar...")
    first_bar.hover(timeout=10000)
    print("Hover successful.")

    print("Waiting for the tooltip...")
    tooltip = page.locator(".MuiPaper-root:has-text('Reasons:')")
    expect(tooltip).to_be_visible()
    print("Tooltip found.")

    tooltip_text = tooltip.inner_text()
    print(f"Tooltip text: {tooltip_text}")
    if "Status:" in tooltip_text:
        raise Exception("Tooltip still contains 'Status:'")
    if not re.search(r"River Level: \d+\.\d{2}m", tooltip_text):
        raise Exception("Tooltip does not contain correctly formatted River Level")
    print("Tooltip text is correct.")

    print("Taking screenshot...")
    page.screenshot(path="jules-scratch/verification/line_graph.png")
    print("Screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_line_graph(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"Verification script failed: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")
            print("Error screenshot taken.")
        finally:
            browser.close()
