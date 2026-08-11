import { describe, expect, it } from "vitest";
import { canAccess, navItems } from "./navigation";
import type { UserRole } from "./types";

const allRoles: UserRole[] = ["Admin", "Manager", "Support", "Viewer"];

const expectedAccess: Record<string, UserRole[]> = {
  "/dashboard": ["Admin", "Manager", "Support", "Viewer"],
  "/users": ["Admin"],
  "/clients": ["Admin", "Manager"],
  "/plans": ["Admin", "Manager"],
  "/orders": ["Admin", "Manager", "Support"],
  "/settings": ["Admin", "Manager", "Support", "Viewer"]
};

describe("navigation guards", () => {
  it("keeps the complete role matrix explicit", () => {
    for (const item of navItems) {
      expect(item.roles).toEqual(expectedAccess[item.href]);
    }
  });

  it("allows only configured roles for every navigation item", () => {
    for (const item of navItems) {
      for (const role of allRoles) {
        expect(canAccess(role, item)).toBe(expectedAccess[item.href].includes(role));
      }
    }
  });
});
