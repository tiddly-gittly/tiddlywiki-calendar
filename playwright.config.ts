import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8080';

export default defineConfig({
  testDir: './wiki/tiddlers/tests/playwright',
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: true,
  // The development server compiles a large single-file wiki. Limiting concurrency
  // prevents parallel page loads from exhausting it on CI and developer machines.
  workers: process.env.CI ? 1 : 4,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      TIDDLYWIKI_PLUGIN_DEV_PORT: '8080',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
          : {},
      },
    },
  ],
});
