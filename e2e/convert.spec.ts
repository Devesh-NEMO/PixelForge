import { expect, test, type Page } from "@playwright/test";

/** A 120x80 PNG generated once and inlined so the suite needs no binary fixtures. */
const SAMPLE_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAHgAAABQCAYAAADSm7GJAAABbUlEQVR42u3dwVHEMBBEUXnKwUAOREIkhEAkJAJBcCaR5QhFcYCCteTp9yOw+rtlW96VxwAAAAAAIIdtpYO5PNxdfnzgjy8bfYsL/o1Qwk8i+D+lkr2Q4CPEEj1B8AyxRH9Q3eWudBxtGrxyoGltrrS2pLW5EsNLklypoaVIruSwEiRXekjdJZdweksuofSWXAOuwSlne8dxlRB6j88UbYrOWxzoNE4N1uDMRfou49Xg5uwi+J7bt+dxcz9O0eLXp237U4OTfxFhigbBIBizBLv+ajAIBsEgGASDYIJBMAgGwVhAsG0QNBgEg2DME+w6rMEgGEsLNk1rMM4uOKXFncapwRqc1eJu4ysh9B6XKdoUnXG2d52VSii97ysqPZzuN42VHFLCc32lhpWyaFOJoSWtq1daeGkvTfZrhrjSf4tT34ZVQqjJrzr3o8L15bPm+2QdKZrYiRuhfQ7f10eb73T3VYrvBwMAAAAArsw70tOekFeWucEAAAAASUVORK5CYII=";

const sample = {
  name: "sample.png",
  mimeType: "image/png",
  buffer: Buffer.from(SAMPLE_PNG, "base64"),
};

async function upload(page: Page) {
  await page.setInputFiles('input[type="file"]', sample);
}

test.describe("PixelForge converter", () => {
  test("converts an image and offers a download", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Drop image" })
    ).toBeVisible();

    await upload(page);
    await expect(
      page.getByRole("button", { name: "Convert image to PNG" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Convert image to PNG" }).click();

    const download = page.locator('a[download="sample.png"]');
    await expect(download).toBeVisible({ timeout: 15_000 });
    await expect(download).toHaveAttribute("href", /^blob:/);
    await expect(page.getByText(/PNG|KB|B/).first()).toBeVisible();
  });

  test("format chip on the landing card preselects the target", async ({
    page,
  }) => {
    await page.goto("/");

    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Convert to JPG" }).click();
    await (await chooserPromise).setFiles(sample);

    await expect(
      page.getByRole("button", { name: "JPG", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("resize hint reflects the requested width", async ({ page }) => {
    await page.goto("/?w=60");
    await upload(page);
    await page.getByRole("button", { name: /Advanced settings/ }).click();

    await expect(
      page.getByText("120×80 → 60×40", { exact: true })
    ).toBeVisible();
  });

  test("converts a batch and exposes the ZIP download", async ({ page }) => {
    await page.goto("/");
    await page.setInputFiles('input[type="file"]', [sample, sample]);

    await page.getByRole("button", { name: "Convert 2 images to PNG" }).click();

    await expect(
      page.getByRole("button", { name: /Download all \(2\)/ })
    ).toBeVisible({ timeout: 20_000 });
  });

  test("combines a batch into a single PDF", async ({ page }) => {
    await page.goto("/");
    await page.setInputFiles('input[type="file"]', [sample, sample]);

    await page.getByRole("button", { name: "PDF", exact: true }).click();
    await page.getByRole("button", { name: "Convert 2 images to PDF" }).click();

    const download = page.locator('a[download="pixelforge-2-pages.pdf"]');
    await expect(download).toBeVisible({ timeout: 20_000 });
    await expect(download).toHaveAttribute("href", /^blob:/);
    await expect(page.getByText(/2 pages/)).toBeVisible();
  });

  test("toggles dark mode and remembers the choice", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");

    await expect(html).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Toggle dark mode" }).click();
    await expect(html).toHaveAttribute("data-theme", "dark");

    const background = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor
    );
    expect(background).toBe("rgb(18, 18, 16)");

    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "dark");
  });
});
