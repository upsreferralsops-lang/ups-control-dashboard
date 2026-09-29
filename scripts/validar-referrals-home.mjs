import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const URL = "https://www.jobs-ups.com/i/us/en/referrals/home";
const storageArg = process.argv[2];
const storageDefault = join(process.cwd(), "..", "ups-core-backend", "storage_state.json");
const storagePath = storageArg || (existsSync(storageDefault) ? storageDefault : null);
const outDir = join(process.cwd(), "storage", "playwright-audit");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const contextOpts = {
  viewport: { width: 1400, height: 900 },
  locale: "en-US",
  ...(storagePath ? { storageState: storagePath } : {}),
};
const context = await browser.newContext(contextOpts);
const page = await context.newPage();
const resp = await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(5000);

const placeholders = await page.locator("input[placeholder]").evaluateAll(
  (els) => [...new Set(els.map((e) => e.getAttribute("placeholder")).filter(Boolean))],
);

const report = {
  url: URL,
  storage_state: storagePath,
  http_status: resp?.status(),
  final_url: page.url(),
  title: await page.title(),
  placeholders,
  legacy_single_field: (await page.getByPlaceholder("Enter job title or location").count()) > 0,
  dual_search_fields:
    (await page.getByPlaceholder("Search Job Title").count()) > 0 &&
    (await page.getByPlaceholder("Search Location").count()) > 0,
  search_jobs_button: (await page.getByRole("button", { name: "Search Jobs" }).count()) > 0,
  see_all_results: (await page.getByText("See all results for").count()) > 0,
  jobs_list_items: await page.locator("li.jobs-list-item").count(),
  on_referrals_home: page.url().includes("/referrals/home"),
  backend_ups_base_url: "https://www.jobs-ups.com/i/us/en/referrals/home",
};

await page.screenshot({ path: join(outDir, "referrals-home.png"), fullPage: true });
await browser.close();

writeFileSync(join(outDir, "referrals-home-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
