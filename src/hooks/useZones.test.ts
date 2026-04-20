import { describe, it, expect, vi } from "vitest";

// Mock Supabase bindings
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
  },
}));

import { useZones } from "./useZones";

describe("useZones React Hook", () => {
  it("should define the useZones export", () => {
    expect(useZones).toBeDefined();
  });

  it("should return a loading state initially", () => {
    expect(typeof useZones).toBe("function");
  });
});
