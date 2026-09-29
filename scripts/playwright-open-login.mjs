import { chromium } from "playwright";

const URL = "https://ups-control-dashboard.vercel.app/login";

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  console.log("Navegando a", URL);
  const response = await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  console.log("HTTP status:", response?.status());

  const title = await page.title();
  console.log("Titulo:", title);

  const errorBox = page.locator('[class*="bad"], [class*="error"], .text-bad-ink').first();
  const hasLocalhost = await page.getByText(/localhost:8090/i).count();
  const hasApi = await page.getByText(/api\.referidosops\.com/i).count();
  console.log("Menciona localhost:8090:", hasLocalhost > 0);
  console.log("Menciona api.referidosops.com:", hasApi > 0);

  const heading = await page.getByRole("heading", { name: /iniciar sesi/i }).count();
  console.log("Formulario login visible:", heading > 0);

  const shot = "playwright-login-prod.png";
  await page.screenshot({ path: shot, fullPage: true });
  console.log("Captura:", shot);

  console.log("Navegador abierto 45s para inspeccion manual...");
  await page.waitForTimeout(45000);
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
