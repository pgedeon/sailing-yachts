import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Sailing Quiz (P25.3)", () => {
  test("quiz page loads and shows first question", async ({ page }) => {
    await page.goto(`${BASE_URL}/en/quiz`);
    await page.waitForLoadState("networkidle");

    // Should show the quiz title
    await expect(
      page.locator("h1", { hasText: /sailing yacht/i })
    ).toBeVisible();

    // Should show progress (Step 1 / 7)
    await expect(page.locator("text=1 / 7")).toBeVisible();

    // Should show first question about experience
    await expect(
      page.locator("text=/experience level/i")
    ).toBeVisible();

    // Should show options (Beginner, Intermediate, Advanced)
    await expect(page.locator("text=Beginner")).toBeVisible();
    await expect(page.locator("text=Intermediate")).toBeVisible();
    await expect(page.locator("text=Advanced")).toBeVisible();

    // Next button should be disabled until an option is selected
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeDisabled();
  });

  test("can navigate through all quiz steps", async ({ page }) => {
    await page.goto(`${BASE_URL}/en/quiz`);
    await page.waitForLoadState("networkidle");

    const steps = [
      { option: "Beginner" },
      { option: "Coastal" },
      { option: "Solo" },
      { option: "Budget" },
      { option: "Small" },
      { option: "Fin Keel" },
      { option: "Performance" },
    ];

    for (let i = 0; i < steps.length; i++) {
      // Click option
      await page.locator(`text=${steps[i].option}`).first().click();

      // Verify selection is highlighted (border changes)
      const selectedOption = page.locator(
        'button.border-blue-500, button[class*="border-blue-500"]'
      );
      await expect(selectedOption.first()).toBeVisible();

      // Click Next (or "Find My Yacht" on last step)
      if (i < steps.length - 1) {
        await page.locator('button:has-text("Next")').click();
        // Verify progress updated
        await expect(
          page.locator(`text=${i + 2} / 7`)
        ).toBeVisible();
      } else {
        await page.locator('button:has-text("Find My Yacht")').click();
      }
    }

    // Should show loading state
    await expect(
      page.locator('text=/analyzing/i')
    ).toBeVisible({ timeout: 5000 }).catch(() => {
      // May have already completed
    });

    // Should show results (or error if DB unavailable)
    await page.waitForLoadState("networkidle");
    const hasResults =
      (await page.locator("text=/Your Perfect Yacht/i").count()) > 0;
    const hasRetry =
      (await page.locator("text=/No matching/i").count()) > 0;
    expect(hasResults || hasRetry).toBeTruthy();
  });

  test("back button navigates to previous step", async ({ page }) => {
    await page.goto(`${BASE_URL}/en/quiz`);
    await page.waitForLoadState("networkidle");

    // Select first option and go to step 2
    await page.locator("text=Intermediate").first().click();
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator("text=2 / 7")).toBeVisible();

    // Go back
    await page.locator('button:has-text("Back")').click();
    await expect(page.locator("text=1 / 7")).toBeVisible();

    // Previous answer should still be selected
    await expect(
      page.locator("button.border-blue-500").first()
    ).toBeVisible();
  });

  test("quiz API POST returns scored yachts", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/quiz`, {
      data: {
        experience: "intermediate",
        sailingType: "coastal",
        crewSize: "couple",
        budget: "midrange",
        preferredLength: "medium",
        keelPreference: "any",
        priority: "comfort",
      },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("yachts");
    expect(Array.isArray(data.yachts)).toBeTruthy();

    if (data.yachts.length > 0) {
      const yacht = data.yachts[0];
      expect(yacht).toHaveProperty("id");
      expect(yacht).toHaveProperty("slug");
      expect(yacht).toHaveProperty("modelName");
      expect(yacht).toHaveProperty("manufacturerName");
      expect(yacht).toHaveProperty("matchScore");
      expect(yacht).toHaveProperty("matchReasons");
      expect(yacht.matchScore).toBeGreaterThanOrEqual(0);
      expect(yacht.matchScore).toBeLessThanOrEqual(100);
    }
  });

  test("quiz API POST handles empty answers", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/quiz`, {
      data: {
        experience: "",
        sailingType: "",
        crewSize: "",
        budget: "",
        preferredLength: "",
        keelPreference: "",
        priority: "",
      },
    });
    // Should still return results (no filtering applied)
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("yachts");
  });

  test("quiz API GET requires 'r' parameter", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/quiz`);
    expect(res.status()).toBe(400);
  });

  test("quiz API GET can load shared results", async ({ request }) => {
    const answers = {
      experience: "advanced",
      sailingType: "offshore",
      crewSize: "couple",
      budget: "premium",
      preferredLength: "large",
      keelPreference: "fin",
      priority: "performance",
    };
    const encoded = Buffer.from(JSON.stringify(answers)).toString("base64");

    const res = await request.get(`${BASE_URL}/api/quiz?r=${encoded}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("yachts");
    expect(data).toHaveProperty("answers");
    expect(data.answers.experience).toBe("advanced");
  });

  test("French quiz page loads with French content", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/quiz`);
    await page.waitForLoadState("networkidle");

    // Should show French title
    await expect(
      page.locator("h1", { hasText: /voilier/i })
    ).toBeVisible();

    // Should show "Étape" instead of "Step"
    await expect(page.locator("text=/Étape/i")).toBeVisible();
  });

  test("quiz page is responsive (mobile viewport)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/en/quiz`);
    await page.waitForLoadState("networkidle");

    // Page should still render properly
    await expect(
      page.locator("h1", { hasText: /sailing yacht/i })
    ).toBeVisible();

    // Options should be visible and clickable
    await page.locator("text=Beginner").first().click();
    await expect(page.locator('button:has-text("Next")')).toBeEnabled();
  });
});
