from playwright.sync_api import sync_playwright
import os

def run_diag():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Array to store console messages
        console_logs = []

        # Listen for all console events and store their text
        page.on("console", lambda msg: console_logs.append(f"[{msg.type.upper()}] {msg.text}"))

        # Get the absolute path of the index.html file
        file_path = os.path.abspath('index.html')

        print("Navigating to the application...")
        page.goto(f'file://{file_path}')

        # Wait for a generous amount of time to ensure all async operations complete
        print("Waiting for 30 seconds to capture all logs...")
        page.wait_for_timeout(30000)
        print("Wait complete.")

        browser.close()

        # Write the captured logs to a file
        log_content = "\n".join(console_logs)
        log_path = "jules-scratch/diagnostics_v2/console_log.txt"
        with open(log_path, "w") as f:
            f.write(log_content)

        print(f"All console logs have been saved to {log_path}")

run_diag()