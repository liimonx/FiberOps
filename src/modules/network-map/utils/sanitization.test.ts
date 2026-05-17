import { describe, it, expect } from "vitest";
import { sanitizeSearchQuery } from "./sanitization";

describe("sanitizeSearchQuery", () => {
  it("should handle empty or null inputs", () => {
    expect(sanitizeSearchQuery("")).toBe("");
    // @ts-expect-error Testing invalid input
    expect(sanitizeSearchQuery(null)).toBe("");
    // @ts-expect-error Testing invalid input
    expect(sanitizeSearchQuery(undefined)).toBe("");
  });

  it("should strip HTML tags", () => {
    expect(sanitizeSearchQuery("<b>Bold</b>")).toBe("Bold");
    expect(sanitizeSearchQuery("<script>alert(1)</script>Safe")).toBe("Safe");
    expect(sanitizeSearchQuery("<img src='x' onerror='alert(1)' />")).toBe("");
  });

  it("should trim the input", () => {
    expect(sanitizeSearchQuery("  hello  ")).toBe("hello");
  });

  it("should limit the length to 100 characters", () => {
    const longString = "a".repeat(150);
    const result = sanitizeSearchQuery(longString);
    expect(result.length).toBe(100);
    expect(result).toBe("a".repeat(100));
  });

  it("should preserve standard characters that were previously stripped by regex if they are part of safe text", () => {
    const result = sanitizeSearchQuery('hello & "world"');
    expect(result).toBe('hello & "world"');
  });
});
