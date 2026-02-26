import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "dotenv/config";

// Cleanup after each test case
afterEach(() => {
  cleanup();
});
