from playwright.sync_api import sync_playwright, expect
import os

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Get the absolute path of the index.html file
        file_path = os.path.abspath('index.html')
        page.goto(f'file://{file_path}')

        # Wait for the network to be idle, allowing time for the getClientes call to complete.
        # The timeout is increased because the API call might be slow.
        page.wait_for_load_state('networkidle', timeout=30000)

        # Type 'a' into the autocomplete input to trigger the dropdown with results
        cliente_input = page.locator("#clienteAutocomplete")
        cliente_input.type("a")

        # The results div is #clienteResultados. It should become visible.
        resultados_div = page.locator("#clienteResultados")
        expect(resultados_div).to_be_visible(timeout=15000)

        # We expect at least one customer to match 'a' and be displayed.
        expect(resultados_div.locator(".autocomplete-item").first).to_be_visible(timeout=15000)

        # Take a screenshot of the form container, showing the populated dropdown.
        page.locator(".form-container").screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

run_verification()