from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000", timeout=60000)

        # Wait for the "Detailed Stats" card to be visible
        stats_card_locator = page.locator('.MuiCardContent-root:has-text("Detailed Stats")')
        expect(stats_card_locator).to_be_visible(timeout=30000)

        # Wait for the data to load by looking for the temperature value
        temperature_locator = page.get_by_text("°C")
        expect(temperature_locator).to_be_visible(timeout=30000)

        # Take a screenshot of the stats card
        stats_card_locator.screenshot(path="jules-scratch/verification/stats_card_verification.png")

    finally:
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)