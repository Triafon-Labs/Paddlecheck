from playwright.sync_api import sync_playwright, TimeoutError

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3000")

    try:
        # Wait for the initial loading spinner to appear
        page.wait_for_selector('[role="progressbar"]')
        # Wait for the loading spinner to disappear
        page.locator('[role="progressbar"]').first.wait_for(state='hidden', timeout=60000)

        page.screenshot(path="jules-scratch/verification/light-theme.png", full_page=True)

        # Switch to dark mode
        page.evaluate("localStorage.setItem('themeMode', 'dark')")
        page.reload()

        # Wait for the page to reload and render
        page.wait_for_selector('[role="progressbar"]')
        page.locator('[role="progressbar"]').first.wait_for(state='hidden', timeout=60000)

        page.screenshot(path="jules-scratch/verification/dark-theme.png", full_page=True)
    except TimeoutError:
        print("Timeout error waiting for page to load.")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
