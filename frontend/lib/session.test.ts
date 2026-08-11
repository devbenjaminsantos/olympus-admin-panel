import { beforeEach, describe, expect, it } from "vitest";
import { clearSession, readSession, writeSession } from "./session";
import type { Session } from "./types";

const session: Session = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresAtUtc: "2026-08-11T18:00:00Z",
  user: {
    id: "11111111-1111-1111-1111-111111111111",
    name: "RunBase Admin",
    email: "admin@runbase.local",
    role: "Admin",
    status: "Active"
  }
};

describe("session storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when no session is stored", () => {
    expect(readSession()).toBeNull();
  });

  it("writes and reads the complete session", () => {
    writeSession(session);

    expect(readSession()).toEqual(session);
  });

  it("removes malformed JSON instead of throwing", () => {
    window.localStorage.setItem("runbase.session", "{invalid-json");

    expect(readSession()).toBeNull();
    expect(window.localStorage.getItem("runbase.session")).toBeNull();
  });

  it("clears the stored session", () => {
    writeSession(session);

    clearSession();

    expect(readSession()).toBeNull();
  });
});
