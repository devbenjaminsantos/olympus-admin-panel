(function () {
  const API_BASE_KEY = "olympus_api_base";
  const TOKEN_KEY = "olympus_token";
  const USER_KEY = "olympus_current_user";
  const DEFAULT_API_BASE = "http://localhost:5000/api";

  function getApiBase() {
    return localStorage.getItem(API_BASE_KEY) || DEFAULT_API_BASE;
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getStoredUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async function request(path, options = {}) {
    const token = getToken();
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${getApiBase()}${path}`, {
      ...options,
      headers,
    });

    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      const message = payload?.error || "Request failed";
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  function redirectToLogin() {
    if (window.location.pathname.endsWith("/login.html")) return;
    window.location.href = "login.html";
  }

  window.OlympusAPI = {
    clearSession,
    getApiBase,
    getStoredUser,
    getToken,
    redirectToLogin,
    request,
    setSession,
  };
})();
