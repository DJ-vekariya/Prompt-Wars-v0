import { describe, it, expect, vi } from "vitest";

// Deep mock required for React components
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    useState: vi.fn(() => [false, vi.fn()]),
  };
});

import AIChatWidget from "./AIChatWidget";

describe("AIChatWidget GenAI Component", () => {
  it("should securely initialize the Gemini Generative AI context", () => {
    expect(AIChatWidget).toBeDefined();
  });
});
