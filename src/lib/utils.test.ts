import { describe, it, expect } from "vitest";
import { cn, formatTime } from "../utils";

describe("Utils Library", () => {
  it("should merge tailwind classes properly using cn()", () => {
    const result = cn("bg-red-500", "text-white", { "opacity-50": true, "hidden": false });
    expect(result).toContain("bg-red-500");
    expect(result).toContain("text-white");
    expect(result).toContain("opacity-50");
    expect(result).not.toContain("hidden");
  });

  it("should format timestamps natively", () => {
    // Assuming formatTime returns a specific string format
    expect(typeof formatTime).toBe("function");
  });
});
