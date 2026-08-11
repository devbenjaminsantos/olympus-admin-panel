import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, login, logout } from "./api";
import { readSession, writeSession } from "./session";
import type { Session } from "./types";

const apiBaseUrl = "http://localhost:5140";

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

const refreshedSession: Session = {
  ...session,
  accessToken: "next-access-token",
  refreshToken: "next-refresh-token"
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("API client", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    window.localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("logs in with JSON credentials and returns the token pair", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(session));

    await expect(login("admin@runbase.local", "Admin123!")).resolves.toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@runbase.local", password: "Admin123!" })
    });
  });

  it("exposes the response status through ApiError", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Forbidden" }, 403));

    await expect(login("inactive@runbase.local", "Admin123!")).rejects.toMatchObject({
      name: "Error",
      message: "Login failed",
      status: 403
    });
  });

  it("adds the access token without discarding caller headers", async () => {
    writeSession(session);
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "client-id" }));

    await apiFetch<{ id: string }>("/api/clients/client-id", {
      headers: { "x-request-source": "vitest" }
    });

    const request = fetchMock.mock.calls[0];
    const headers = request[1]?.headers as Headers;
    expect(request[0]).toBe(`${apiBaseUrl}/api/clients/client-id`);
    expect(headers.get("authorization")).toBe("Bearer access-token");
    expect(headers.get("x-request-source")).toBe("vitest");
  });

  it("rotates the session and retries once after an unauthorized response", async () => {
    writeSession(session);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse(refreshedSession))
      .mockResolvedValueOnce(jsonResponse([{ id: "order-id" }]));

    await expect(apiFetch<Array<{ id: string }>>("/api/orders")).resolves.toEqual([
      { id: "order-id" }
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe(`${apiBaseUrl}/api/auth/refresh`);
    const retryHeaders = fetchMock.mock.calls[2][1]?.headers as Headers;
    expect(retryHeaders.get("authorization")).toBe("Bearer next-access-token");
    expect(readSession()).toEqual(refreshedSession);
  });

  it("shares one refresh operation between concurrent unauthorized requests", async () => {
    writeSession(session);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse(refreshedSession))
      .mockResolvedValueOnce(jsonResponse([{ id: "client-id" }]))
      .mockResolvedValueOnce(jsonResponse([{ id: "order-id" }]));

    const [clients, orders] = await Promise.all([
      apiFetch<Array<{ id: string }>>("/api/clients"),
      apiFetch<Array<{ id: string }>>("/api/orders")
    ]);

    expect(clients).toEqual([{ id: "client-id" }]);
    expect(orders).toEqual([{ id: "order-id" }]);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(fetchMock.mock.calls.filter(([url]) =>
      url === `${apiBaseUrl}/api/auth/refresh`
    )).toHaveLength(1);
    expect(readSession()).toEqual(refreshedSession);
  });

  it("clears the session and reports the original 401 when refresh is rejected", async () => {
    writeSession(session);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ message: "Invalid refresh token" }, 401));

    const request = apiFetch("/api/users");

    await expect(request).rejects.toEqual(new ApiError("Request failed", 401));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(readSession()).toBeNull();
  });

  it("returns undefined for successful responses without content", async () => {
    writeSession(session);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(apiFetch<void>("/api/orders/order-id", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("revokes the refresh token and always clears the local session", async () => {
    writeSession(session);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await logout();

    expect(fetchMock).toHaveBeenCalledWith(`${apiBaseUrl}/api/auth/logout`, {
      method: "POST",
      headers: {
        authorization: "Bearer access-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({ refreshToken: "refresh-token" })
    });
    expect(readSession()).toBeNull();
  });
});
