from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the app
        page.goto("http://localhost:3000")

        # Wait for the main status card's loading spinner to disappear.
        # This is a robust way to wait for the primary async data to load.
        # We target the progressbar within the element with data-testid="status-card".
        spinner = page.get_by_test_id("status-card").get_by_role("progressbar")
        expect(spinner).not_to_be_visible(timeout=30000)

        # Now that the page is loaded, find the settings button by its role and accessible name.
        settings_button = page.get_by_role("button", name="Settings")
        # Force the click to bypass any potential overlay issues.
        settings_button.click(force=True)

        # Wait for the modal to appear
        expect(page.get_by_role("heading", name="Settings")).to_be_visible()

        # Find the theme switch
        # The switch is not directly associated with the label, so we find it by its role.
        # It's the only switch on the page.
        theme_switch = page.get_by_role("switch")

        # --- Dark Mode Verification ---
        # Check if the switch is already enabled for dark mode
        is_dark_mode = theme_switch.is_checked()
        if not is_dark_mode:
            # If not, click it to enable dark mode
            theme_switch.click()
            # Wait for the "Dark Mode" text to appear to confirm the switch
            expect(page.get_by_text("Dark Mode")).to_be_visible()

        # Take a screenshot of the settings modal in dark mode
        page.screenshot(path="jules-scratch/verification/settings_modal_dark.png")
        print("Screenshot of dark mode saved.")

        # --- Light Mode Verification ---
        # Click the switch again to go back to light mode
        theme_switch.click()
        # Wait for the "Light Mode" text to appear
        expect(page.get_by_text("Light Mode")).to_be_visible()

        # Take a screenshot of the settings modal in light mode
        page.screenshot(path="jules-scratch/verification/settings_modal_light.png")
        print("Screenshot of light mode saved.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)