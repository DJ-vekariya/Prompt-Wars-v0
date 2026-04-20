import { describe, it, expect, vi } from "vitest";

// Deep mock required for Auth provider tests
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

import { useAuth } from "./useAuth";

describe("useAuth Authentication Hook", () => {
  it("must throw if used outside of Provider", () => {
    expect(() => useAuth()).toThrow("useAuth must be used within AuthProvider");
  });
});
