import sys
from playwright.sync_api import sync_playwright, expect, Page

def run(playwright, action: str, screenshot_path: str):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")

        # Wait for the initial loading spinner in the StatusCard to disappear
        status_card = page.get_by_text("RAG Status").locator("..").locator("..")
        loading_spinner = status_card.locator('span[role="progressbar"]')
        expect(loading_spinner).to_be_hidden(timeout=15000)

        if action == "settings":
            # Click the settings button
            settings_button = page.get_by_role("button", name="Settings")
            expect(settings_button).to_be_visible()
            settings_button.click()

            # Wait for the popover to appear and take a screenshot
            # The Popover component doesn't have a 'dialog' role, so we select by its content
            settings_header = page.get_by_role("heading", name="Settings")
            expect(settings_header).to_be_visible()
            # Screenshot the whole page to capture the popover in context
            page.screenshot(path=screenshot_path)

        elif action == "status":
            # Just take a screenshot of the status card area
            status_card = page.get_by_text("RAG Status").locator("..").locator("..")
            expect(status_card).to_be_visible()
            status_card.screenshot(path=screenshot_path)

        else:
            print(f"Unknown action: {action}")

    except Exception as e:
        print(f"An error occurred: {e}")
        # Take a screenshot on error for debugging
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python verify_ui.py <action> <screenshot_path>")
        sys.exit(1)

    action_arg = sys.argv[1]
    path_arg = sys.argv[2]

    with sync_playwright() as p:
        run(p, action_arg, path_arg)
