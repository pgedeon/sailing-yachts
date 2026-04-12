import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("FAQ Proposals API", () => {
  test("GET /api/faq-proposals returns valid response", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/faq-proposals`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("proposals");
    expect(data).toHaveProperty("total");
    expect(Array.isArray(data.proposals)).toBe(true);
    expect(typeof data.total).toBe("number");
  });

  test("GET /api/faq-proposals?summary=true returns summary", async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE_URL}/api/faq-proposals?summary=true`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("totalProposed");
    expect(data).toHaveProperty("totalApproved");
    expect(data).toHaveProperty("totalPublished");
    expect(data).toHaveProperty("totalRejected");
    expect(data).toHaveProperty("byCategory");
    expect(data).toHaveProperty("topProposals");
  });

  test("GET /api/faq-proposals filters by status", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/faq-proposals?status=proposed`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    for (const proposal of data.proposals) {
      expect(proposal.status).toBe("proposed");
    }
  });

  test("GET /api/faq-proposals filters by source", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/faq-proposals?source=search`
    );
    expect(response.status()).toBe(200);

    const data = await response.json();
    for (const proposal of data.proposals) {
      expect(proposal.source).toBe("search");
    }
  });

  test("POST /api/faq-proposals creates manual proposal", async ({
    request,
  }) => {
    const response = await request.post(`${BASE_URL}/api/faq-proposals`, {
      data: {
        action: "create",
        question: "What is the best bluewater sailboat for beginners?",
        category: "buying",
      },
    });
    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.proposal).toBeDefined();
    expect(data.proposal.question).toBe(
      "What is the best bluewater sailboat for beginners?"
    );
    expect(data.proposal.source).toBe("manual");
    expect(data.proposal.status).toBe("proposed");
    expect(data.proposal.priorityScore).toBeGreaterThanOrEqual(0);
  });

  test("POST /api/faq-proposals rejects missing question", async ({
    request,
  }) => {
    const response = await request.post(`${BASE_URL}/api/faq-proposals`, {
      data: {
        action: "create",
      },
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/faq-proposals harvests from search data", async ({
    request,
  }) => {
    const response = await request.post(`${BASE_URL}/api/faq-proposals`, {
      data: { action: "harvest" },
    });
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("newProposals");
    expect(data).toHaveProperty("updatedProposals");
    expect(data).toHaveProperty("skipped");
  });

  test("GET /api/faq-proposals?id= returns single proposal", async ({
    request,
  }) => {
    // First create one
    const createResp = await request.post(`${BASE_URL}/api/faq-proposals`, {
      data: {
        action: "create",
        question: "Test question for single lookup?",
        category: "general",
      },
    });
    const created = await createResp.json();

    if (created.proposal?.id) {
      const response = await request.get(
        `${BASE_URL}/api/faq-proposals?id=${created.proposal.id}`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.proposal.id).toBe(created.proposal.id);
    }
  });
});

test.describe("FAQ Proposal Proposal Structure", () => {
  test("each proposal has required fields", async ({ request }) => {
    // Create a proposal first
    await request.post(`${BASE_URL}/api/faq-proposals`, {
      data: {
        action: "create",
        question: "What are the best 40-foot cruising sailboats?",
      },
    });

    const response = await request.get(`${BASE_URL}/api/faq-proposals`);
    const data = await response.json();

    if (data.proposals.length > 0) {
      const proposal = data.proposals[0];
      expect(proposal).toHaveProperty("id");
      expect(proposal).toHaveProperty("source");
      expect(proposal).toHaveProperty("question");
      expect(proposal).toHaveProperty("status");
      expect(proposal).toHaveProperty("frequency");
      expect(proposal).toHaveProperty("priorityScore");
      expect(proposal).toHaveProperty("category");
      expect(proposal).toHaveProperty("intentType");
      expect(proposal).toHaveProperty("createdAt");
    }
  });
});
