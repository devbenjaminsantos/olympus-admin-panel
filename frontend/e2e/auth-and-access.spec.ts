import { expect, test } from "@playwright/test";
import type { Session } from "../lib/types";

const apiUrl = "http://127.0.0.1:5140";
const adminCredentials = {
  email: "admin@runbase.local",
  password: "Admin123!Secure"
};
const setupKey = "runbase-development-setup-key-change-before-production";

let adminSession: Session;
let viewerCredentials: { email: string; password: string };

test.describe.serial("authentication and role access", () => {
  test.beforeAll(async () => {
    viewerCredentials = {
      email: `viewer-${Date.now()}@runbase.local`,
      password: "Viewer123!"
    };
  });

  test("creates the first administrator account through the setup screen", async ({ page }) => {
    test.setTimeout(120_000);

    const setupStatusResponsePromise = page.waitForResponse((response) =>
      response.url() === `${apiUrl}/api/auth/setup` && response.request().method() === "GET"
    );
    await page.goto("/login");
    const setupStatusResponse = await setupStatusResponsePromise;
    const setupStatus = await setupStatusResponse.json() as { setupRequired: boolean };

    if (setupStatus.setupRequired) {
      await expect(page.getByRole("heading", { name: "Create your administrator account" })).toBeVisible();
      await page.getByLabel("Name").fill("RunBase Admin");
      await page.getByLabel("Email").fill(adminCredentials.email);
      await page.getByLabel("Password", { exact: true }).fill(adminCredentials.password);
      await page.getByLabel("Confirm password").fill(adminCredentials.password);
      await page.getByLabel("Setup key").fill(setupKey);
      const setupResponsePromise = page.waitForResponse((response) =>
        response.url() === `${apiUrl}/api/auth/setup` && response.request().method() === "POST"
      );
      await page.getByRole("button", { name: "Create account" }).click();
      const setupResponse = await setupResponsePromise;

      expect(setupResponse.ok()).toBeTruthy();
    } else {
      await submitLoginForm(page, adminCredentials);
    }

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
    adminSession = await readBrowserSession(page);

    const createViewerResponse = await page.request.post(`${apiUrl}/api/users`, {
      data: {
        name: "Playwright Viewer",
        email: viewerCredentials.email,
        password: viewerCredentials.password,
        role: "Viewer",
        status: "Active"
      },
      headers: {
        authorization: `Bearer ${adminSession.accessToken}`
      }
    });
    expect(createViewerResponse.ok()).toBeTruthy();
  });

  test("logs in and shows the complete admin navigation", async ({ page }) => {
    await loginThroughUi(page, adminCredentials);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    const navigation = page.getByRole("navigation", { name: "RunBase" });
    await expect(navigation.getByRole("link", { name: "Users", exact: true })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Clients", exact: true })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Plans", exact: true })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Orders", exact: true })).toBeVisible();
  });

  test("hides admin navigation and denies a Viewer on the users page", async ({ page }) => {
    await loginThroughUi(page, viewerCredentials);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);

    await page.goto("/users");

    await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
    await expect(page.getByText("Permission denied")).toBeVisible();
  });

  test("refreshes an invalid access token without returning to login", async ({ page }) => {
    await setSession(page, {
      ...adminSession,
      accessToken: "invalid-access-token"
    });

    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard$/);
    const refreshedSession = await readBrowserSession(page);
    expect(refreshedSession.accessToken).not.toBe("invalid-access-token");
    expect(refreshedSession.refreshToken).not.toBe(adminSession.refreshToken);
    adminSession = refreshedSession;
  });

  test("logs out, clears the browser session and returns to login", async ({ page }) => {
    await setSession(page, adminSession);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.getByRole("button", { name: "Logout" }).press("Enter");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByAltText("RunBase").first()).toBeVisible();
    await expect(page.evaluate(() => window.localStorage.getItem("runbase.session"))).resolves.toBeNull();
  });
});

async function loginThroughUi(
  page: import("@playwright/test").Page,
  credentials: { email: string; password: string }
): Promise<void> {
  await page.goto("/login");
  await submitLoginForm(page, credentials);
}

async function submitLoginForm(
  page: import("@playwright/test").Page,
  credentials: { email: string; password: string }
): Promise<void> {
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  const loginResponsePromise = page.waitForResponse((response) =>
    response.url() === `${apiUrl}/api/auth/login`
  );
  await page.getByLabel("Password").press("Enter");
  const loginResponse = await loginResponsePromise;

  expect(loginResponse.ok()).toBeTruthy();
}

async function setSession(
  page: import("@playwright/test").Page,
  session: Session
): Promise<void> {
  await page.goto("/login");
  await page.evaluate((value) => {
    window.localStorage.setItem("runbase.session", JSON.stringify(value));
  }, session);
}

async function readBrowserSession(
  page: import("@playwright/test").Page
): Promise<Session> {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem("runbase.session");

    if (!raw) {
      throw new Error("Expected an authenticated browser session.");
    }

    return JSON.parse(raw) as Session;
  });
}
