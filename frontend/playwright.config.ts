import { defineConfig, devices } from "@playwright/test";

const frontendUrl = "http://localhost:3000";
const apiUrl = "http://localhost:5140";
const localOperaExecutable = "/Applications/Opera.app/Contents/MacOS/Opera";
const useLocalOpera = process.platform === "darwin" && !process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL: frontendUrl,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: process.env.CI ? "retain-on-failure" : "off"
  },
  expect: {
    timeout: 10_000
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: useLocalOpera
          ? { executablePath: localOperaExecutable }
          : undefined
      }
    }
  ],
  webServer: [
    {
      command: "dotnet run --project ../backend/src/RunBase.Api --no-launch-profile",
      env: {
        ASPNETCORE_ENVIRONMENT: "Development",
        ASPNETCORE_URLS: apiUrl,
        ConnectionStrings__DefaultConnection: "",
        DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE: "false"
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${apiUrl}/health`
    },
    {
      command: "npm run dev -- --hostname localhost --port 3000",
      env: {
        NEXT_PUBLIC_API_BASE_URL: apiUrl
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${frontendUrl}/login`
    }
  ]
});
