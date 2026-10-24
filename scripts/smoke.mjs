import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const executablePath = process.env.BERT_CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.BERT_CONSOLE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ executablePath, headless: true });

try {
  const errors = [];
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  desktop.on("pageerror", (error) => errors.push(error.message));
  await desktop.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await desktop.getByText("All data sources connected").first().waitFor({ timeout: 20_000 });
  await desktop.getByRole("link", { name: "V2.3 Funding" }).waitFor();
  assert.equal((await desktop.locator(".topbar-title").textContent())?.trim(), "Overview");
  await desktop.getByRole("button", { name: "Collapse navigation" }).click();
  await desktop.waitForFunction(() => document.querySelector(".sidebar")?.getBoundingClientRect().width < 100);
  await desktop.getByRole("button", { name: "Expand navigation" }).click();
  await desktop.getByRole("button", { name: "Refresh protocol data" }).click();
  await desktop.getByText("All data sources connected").first().waitFor({ timeout: 20_000 });
  await desktop.screenshot({ path: "/tmp/bert-console-desktop.png", fullPage: true });

  const retina = await browser.newPage({ viewport: { width: 1401, height: 820 }, deviceScaleFactor: 2 });
  await retina.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await retina.locator(".hero-logo-canvas canvas").waitFor();
  const heroCanvas = await retina.evaluate(() => {
    const mount = document.querySelector(".hero-logo-canvas").getBoundingClientRect();
    const canvas = document.querySelector(".hero-logo-canvas canvas").getBoundingClientRect();
    return { mountWidth: mount.width, mountHeight: mount.height, canvasWidth: canvas.width, canvasHeight: canvas.height };
  });
  assert.ok(Math.abs(heroCanvas.mountWidth - heroCanvas.canvasWidth) < 2, "Retina canvas must match hero width");
  assert.ok(Math.abs(heroCanvas.mountHeight - heroCanvas.canvasHeight) < 2, "Retina canvas must match hero height");
  await retina.close();

  await desktop.getByRole("link", { name: "V2.3 Funding" }).click();
  await desktop.getByRole("heading", { name: "Funding explorer" }).waitFor();
  const ideaId = (await desktop.locator(".data-table tbody tr td").first().textContent())?.trim();
  assert.ok(ideaId, "Expected at least one indexed idea");
  await desktop.getByRole("textbox", { name: "Search loaded ideas..." }).fill(ideaId);
  assert.ok((await desktop.locator(".data-table tbody tr").count()) > 0);

  await desktop.getByRole("link", { name: "V3.2 Communities" }).click();
  await desktop.getByRole("heading", { name: "Community explorer" }).waitFor();
  await desktop.locator(".clickable-row td").first().click();
  await desktop.locator(".detail-drawer h2").waitFor();
  await desktop.getByRole("button", { name: "Close details" }).click();
  await desktop.getByRole("tab", { name: /Proposals/ }).click();
  assert.ok((await desktop.locator(".data-table tbody tr").count()) > 0);
  // Proposal/round IDs are local to a Community, not globally unique.
  const winnerRow = desktop.locator(".data-table tbody tr", { hasText: "winner votes" }).first();
  const winnerLabel = (await winnerRow.locator("td").nth(0).locator("strong").textContent()).trim();
  const roundLink = winnerRow.locator("button.table-link");
  const roundLabel = (await roundLink.textContent()).trim();
  const winnerVotes = (await winnerRow.locator("td").nth(4).textContent()).replace(/\s+/g, " ").trim();
  assert.match(winnerVotes, /USDC winner votes/);
  await roundLink.click();
  assert.match(await desktop.getByRole("tab", { name: /Slate rounds/ }).getAttribute("class"), /active/);
  await desktop.getByText(`Round ${roundLabel}`, { exact: true }).first().waitFor();
  assert.ok((await desktop.locator(".data-table tbody tr").first().textContent()).replace(/\s+/g, " ").includes(winnerVotes));
  await desktop.getByText(winnerLabel, { exact: true }).first().waitFor();
  await desktop.getByRole("tab", { name: /Members/ }).click();
  await desktop.getByText(/Not a protocol-wide total/).waitFor();
  assert.ok((await desktop.locator(".data-table tbody tr").count()) <= 6);
  const tabBadge = await desktop.locator(".tab-bar button.active span").boundingBox();
  assert.ok(tabBadge && Math.abs(tabBadge.width - tabBadge.height) < 1, "Tab count badge must be circular");

  await desktop.getByRole("link", { name: "Data Explorer" }).click();
  await desktop.getByRole("heading", { name: "Explore every layer." }).waitFor();
  await desktop.getByText("TEST V3.1 Tenyokj").first().waitFor();
  const csvDownload = desktop.waitForEvent("download");
  await desktop.getByRole("button", { name: "CSV" }).click();
  assert.match((await csvDownload).suggestedFilename(), /^bert-v3-communities-.*\.csv$/);
  await desktop.getByRole("button", { name: /Copy address/ }).first().click();
  await desktop.getByRole("button", { name: "Address copied" }).first().waitFor();
  await desktop.getByRole("button", { name: /Inspect record/ }).first().click();
  await desktop.getByRole("dialog", { name: "Record inspector" }).waitFor();
  await desktop.getByRole("button", { name: "Copy JSON" }).click();
  await desktop.getByRole("button", { name: "Close record inspector" }).click();
  await desktop.getByRole("button", { name: "V2.3 Funding" }).click();
  await desktop.getByText("TEST IDEA 12.10.26").first().waitFor();
  await desktop.locator(".ledger-group-toggle", { hasText: "Voting" }).click();
  await desktop.getByRole("button", { name: "Pledge refunds" }).click();
  await desktop.getByText("No records indexed yet").waitFor();
  await desktop.locator(".ledger-group-toggle", { hasText: "Funding" }).click();
  await desktop.getByRole("button", { name: "Ideas", exact: true }).click();
  await desktop.getByRole("link", { name: /Query in Studio/ }).click();
  await desktop.waitForFunction(() => document.querySelector('textarea[aria-label="GraphQL query editor"]')?.value.includes("records: ideas"));
  assert.match(await desktop.getByRole("textbox", { name: "GraphQL query editor" }).inputValue(), /records: ideas/);
  await desktop.locator('button[title="Copy current GraphQL query"]').click();
  await desktop.locator('button[title="Copy a runnable cURL command"]').click();

  await desktop.locator(".source-option").first().click();
  await desktop.getByRole("button", { name: /Run query/ }).click();
  await desktop.getByText('"communities"').waitFor({ timeout: 20_000 });
  const jsonDownload = desktop.waitForEvent("download");
  await desktop.locator('button[title="Download JSON"]').click();
  assert.match((await jsonDownload).suggestedFilename(), /^bert-v3-query-.*\.json$/);
  await desktop.getByRole("button", { name: "Table" }).click();
  assert.ok((await desktop.locator(".result-table tbody tr").count()) > 0);
  await desktop.locator(".source-option").nth(1).click();
  assert.match(await desktop.getByRole("textbox", { name: "GraphQL query editor" }).inputValue(), /protocolStats/);
  await desktop.getByRole("button", { name: /Run query/ }).click();
  await desktop.getByText('"protocolStats"').waitFor({ timeout: 20_000 });
  await desktop.locator(".source-option").first().click();
  assert.match(await desktop.getByRole("textbox", { name: "GraphQL query editor" }).inputValue(), /communities/);
  await desktop.getByRole("textbox", { name: "GraphQL query editor" }).fill("{ communities(first: 2) { name } communityProposals(first: 2) { proposalId } }");
  await desktop.getByRole("button", { name: /Run query/ }).click();
  await desktop.getByRole("button", { name: "Table" }).click();
  await desktop.getByRole("button", { name: /communityProposals/ }).click();
  await desktop.getByText("proposalId").first().waitFor();
  await desktop.screenshot({ path: "/tmp/bert-console-studio.png", fullPage: true });

  await desktop.route("**/api/graphql", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: { communities: Array.from({ length: 45 }, (_, index) => ({ id: String(index + 1), name: `Test ${index + 1}` })) } }),
  }));
  await desktop.getByRole("textbox", { name: "GraphQL query editor" }).fill("{ communities(first: 45) { id name } }");
  await desktop.getByRole("button", { name: /Run query/ }).click();
  await desktop.getByText("45 returned rows").first().waitFor();
  assert.equal(await desktop.locator(".result-table tbody tr").count(), 20);
  await desktop.getByRole("button", { name: "Next result page" }).click();
  await desktop.getByText("Test 21", { exact: true }).waitFor();
  await desktop.unroute("**/api/graphql");

  await desktop.getByRole("link", { name: "Deployments" }).click();
  await desktop.getByRole("heading", { name: "Live proxy state" }).waitFor();
  await desktop.getByText("Verified read").first().waitFor({ timeout: 20_000 });
  assert.ok((await desktop.locator(".live-contract-scroll tbody tr").count()) >= 9);
  assert.ok((await desktop.locator(".data-table tbody tr").count()) <= 6);
  await desktop.getByRole("button", { name: "Next page" }).click();
  await desktop.getByText(/Page 2 \/ /).waitFor();
  await desktop.getByRole("textbox", { name: "Search contracts..." }).fill("CommunityFactory implementation");
  await desktop.getByText("V3.1 CommunityFactory implementation").first().waitFor();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await mobile.getByText("All data sources connected").first().waitFor({ timeout: 20_000 });
  const width = await mobile.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(width.document <= width.viewport, `Mobile horizontal overflow: ${JSON.stringify(width)}`);
  await mobile.screenshot({ path: "/tmp/bert-console-mobile.png", fullPage: true });
  await mobile.getByRole("button", { name: "Open navigation" }).click();
  await mobile.getByRole("link", { name: "V3.2 Communities" }).click();
  await mobile.getByRole("heading", { name: "Community explorer" }).waitFor();
  const mobileWidth = await mobile.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(mobileWidth.document <= mobileWidth.viewport, `Community mobile overflow: ${JSON.stringify(mobileWidth)}`);
  await mobile.goto(`${baseUrl}/explore`, { waitUntil: "domcontentloaded" });
  await mobile.getByText("TEST V3.1 Tenyokj").first().waitFor({ timeout: 20_000 });
  const ledgerWidth = await mobile.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(ledgerWidth.document <= ledgerWidth.viewport, `Ledger mobile overflow: ${JSON.stringify(ledgerWidth)}`);
  assert.deepEqual(errors, []);
  console.log("Desktop/mobile smoke passed. Screenshots saved in /tmp/bert-console-*.png");
} finally {
  await browser.close();
}
