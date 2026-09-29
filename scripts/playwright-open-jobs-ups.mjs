/**
 * Abre jobs-ups.com (portal donde el bot busca vacantes y envía referidos).
 * Uso: pnpm exec node scripts/playwright-open-jobs-ups.mjs
 */
import { chromium } from "playwright";

const REFERRALS_HOME =
  process.env.UPS_BASE_URL ??
  "https://www.jobs-ups.com/i/us/en/referrals/home";

const JOB_SEARCH =
  "https://www.jobs-ups.com/i/us/en/search-results";

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: "en-US",
  });
  const page = await context.newPage();

  console.log("1) Referrals home:", REFERRALS_HOME);
  const r1 = await page.goto(REFERRALS_HOME, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  console.log("   HTTP", r1?.status(), "| titulo:", await page.title());

  await page.waitForTimeout(3000);
  await page.screenshot({ path: "playwright-jobs-ups-referrals-home.png", fullPage: true });

  console.log("2) Busqueda de empleos (donde scrapea job_search):", JOB_SEARCH);
  const r2 = await page.goto(JOB_SEARCH, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  console.log("   HTTP", r2?.status(), "| titulo:", await page.title());

  await page.waitForTimeout(3000);
  await page.screenshot({ path: "playwright-jobs-ups-search.png", fullPage: true });
  console.log("Capturas: playwright-jobs-ups-referrals-home.png, playwright-jobs-ups-search.png");
  console.log("Navegador abierto 90s (login manual si hace falta)...");
  await page.waitForTimeout(90000);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
