import { clearSession, readSession, writeSession } from "./session";
import type {
  AuthTokenResponse,
  InitialAccountInput,
  InitialSetupStatus
} from "./types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5140";
let activeRefresh: Promise<boolean> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export async function getInitialSetupStatus(): Promise<InitialSetupStatus> {
  const response = await fetch(`${apiBaseUrl}/api/auth/setup`);

  if (!response.ok) {
    throw new ApiError("Initial setup status failed", response.status);
  }

  return response.json() as Promise<InitialSetupStatus>;
}

export async function createInitialAccount(
  input: InitialAccountInput
): Promise<AuthTokenResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/setup`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new ApiError("Initial account setup failed", response.status);
  }

  return response.json() as Promise<AuthTokenResponse>;
}

export async function login(email: string, password: string): Promise<AuthTokenResponse> {
  var response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new ApiError("Login failed", response.status);
  }

  return response.json() as Promise<AuthTokenResponse>;
}

export async function logout(): Promise<void> {
  var session = readSession();

  if (!session) {
    clearSession();
    return;
  }

  await fetch(`${apiBaseUrl}/api/auth/logout`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ refreshToken: session.refreshToken })
  });

  clearSession();
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  var response = await fetchWithAccessToken(path, init);

  if (response.status === 401) {
    var refreshed = await refreshSessionOnce();

    if (refreshed) {
      response = await fetchWithAccessToken(path, init);
    }
  }

  if (!response.ok) {
    throw new ApiError("Request failed", response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function fetchWithAccessToken(path: string, init: RequestInit): Promise<Response> {
  var session = readSession();
  var headers = new Headers(init.headers);

  if (session) {
    headers.set("authorization", `Bearer ${session.accessToken}`);
  }

  return fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers
  });
}

function refreshSessionOnce(): Promise<boolean> {
  if (!activeRefresh) {
    activeRefresh = refreshSession().finally(() => {
      activeRefresh = null;
    });
  }

  return activeRefresh;
}

async function refreshSession(): Promise<boolean> {
  var session = readSession();

  if (!session) {
    return false;
  }

  var response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ refreshToken: session.refreshToken })
  });

  if (!response.ok) {
    clearSession();
    return false;
  }

  var nextSession = (await response.json()) as AuthTokenResponse;
  writeSession(nextSession);
  return true;
}
