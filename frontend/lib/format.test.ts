import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate } from "./format";

describe("format helpers", () => {
  it("formats US dollar values consistently", () => {
    expect(formatCurrency(19.9)).toBe("$19.90");
  });

  it("uses a placeholder when a date is absent", () => {
    expect(formatDate(null)).toBe("-");
  });
});
