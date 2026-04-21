/// <reference types="node" />
/*
  Playwright load test script for Savr
  - Logs in as N concurrent users
  - Sends a chat message with K randomly selected grocery items
  - Navigates to Lists and clicks "Check Prices"
  - Measures per-user completion time and total wall time
  Usage:
    npm run loadtest -- --users 5 --items 10 --headed --baseURL https://...
*/

// Helper function for timestamped logging
const scriptStartTime = Date.now();
function logWithTimestamp(message: string, user?: string) {
  const elapsed = Date.now() - scriptStartTime;
  const timestamp = new Date().toISOString();
  const userPrefix = user ? `[${user}] ` : '';
  console.log(`[${timestamp}] +${elapsed}ms ${userPrefix}${message}`);
}

import { chromium, firefox, webkit, Browser, Page } from 'playwright';

type BrowserName = 'chromium' | 'firefox' | 'webkit';

interface RunOptions {
  baseURL: string;
  users: number;
  items: number;
  headed: boolean;
  browser: BrowserName;
  timeoutMs: number;
  seed?: number;
  ignoreHTTPSErrors: boolean;
}

interface UserCred {
  email: string;
  password: string;
}

interface UserResult {
  user: string;
  success: boolean;
  error?: string;
  timings: {
    loginStart: number;
    loginEnd?: number;
    chatSentAt?: number;
    checkPricesClickAt?: number;
    jobCompleteAt?: number;
  };
  completionMethod?: string;
  duration?: number;
}

const DEFAULT_USERS: UserCred[] = [
  { email: 'testuser1@savr.app', password: 'testuser1' },
  { email: 'testuser2@savr.app', password: 'testuser2' },
  { email: 'testuser3@savr.app', password: 'testuser3' },
  { email: 'testuser4@savr.app', password: 'testuser4' },
  { email: 'testuser5@savr.app', password: 'testuser5' },
];

const ITEM_POOL = [
  'Eggs', 'Garlic', 'Olive Oil', 'Ground Beef', 'Onions', 'Black Pepper', 'Salt', 'Chicken Breast', 'Butter',
  'Bell Peppers', 'Lettuce', 'Tomatoes', 'Cheddar Cheese', 'Bread', 'Milk', 'Chicken Breasts', 'Frozen Vegetables',
  'Bananas', 'Rice', 'Potatoes', 'Pasta', 'Carrots', 'Chicken Thighs', 'Apples', 'Salmon Fillets', 'Spinach',
  'Greek Yogurt', 'Garlic Powder', 'Peanut Butter', 'Orange Juice',
];

function parseArgs(): RunOptions {
  const args = process.argv.slice(2);
  const get = (name: string, def?: string) => {
    const idx = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
    if (idx === -1) return def;
    const arg = args[idx];
    if (arg.includes('=')) return arg.split('=')[1];
    return args[idx + 1] ?? def;
  };

  // Defaults
  let baseURL = get('baseURL', process.env.SAVR_BASE_URL || 'http://localhost:5173')!;
  let users = Number(get('users', 'NaN'));
  let items = Number(get('items', 'NaN'));
  const headed = args.includes('--headed') || get('headed', 'false') === 'true';
  const browser = (get('browser', 'chromium') as BrowserName) || 'chromium';
  const timeoutMs = Number(get('timeoutMs', '300000')); // 5 minutes default for testing
  const seed = get('seed') ? Number(get('seed')) : undefined;
  let ignoreHTTPSErrors = args.includes('--ignoreHTTPSErrors') || get('ignoreHTTPSErrors', 'false') === 'true';

  // Positional fallback: [users, items, baseURL]
  const booleanFlags = new Set(['headed', 'ignoreHTTPSErrors']);
  // Remove values that belong to non-boolean flags with separate values
  // e.g., "--users 5" should consume "5", but "--headed 5" should NOT consume
  const consumed: Set<number> = new Set();
  for (let i = 0; i < args.length; i++) {
    const thisArg = args[i];
    if (thisArg.startsWith('--')) {
      const flagName = thisArg.replace(/^--/, '').split('=')[0];
      const isBoolean = booleanFlags.has(flagName);
      if (!isBoolean && !thisArg.includes('=') && i + 1 < args.length) {
        const nextArg = args[i + 1];
        if (!nextArg.startsWith('--')) {
          consumed.add(i + 1);
        }
      }
    }
  }
  const truePositionals = args
    .map((a, i) => ({ a, i }))
    .filter(({ a, i }) => !a.startsWith('--') && !consumed.has(i))
    .map(({ a }) => a);

  const pUsers = Number(truePositionals[0]);
  const pItems = Number(truePositionals[1]);
  const pBase = truePositionals[2];

  if (!Number.isFinite(users) || Number.isNaN(users)) users = Number.isFinite(pUsers) ? pUsers : 5;
  if (!Number.isFinite(items) || Number.isNaN(items)) items = Number.isFinite(pItems) ? pItems : 10;
  if (!get('baseURL') && pBase) baseURL = pBase;

  // Auto-enable HTTPS ignore for IP-based URLs if not explicitly set
  const ipHttps = /^https:\/\/(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/|$)/i.test(baseURL);
  const explicitlySet = args.includes('--ignoreHTTPSErrors') || typeof get('ignoreHTTPSErrors') !== 'undefined';
  if (!explicitlySet && ipHttps) {
    ignoreHTTPSErrors = true;
  }

  return { baseURL, users, items, headed, browser, timeoutMs, seed, ignoreHTTPSErrors };
}

function seededRandom(seed: number) {
  // xorshift32
  let x = seed || Date.now();
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return ((x < 0 ? ~x + 1 : x) % 1_000_000) / 1_000_000;
  };
}

function pickRandomItems(count: number, seed?: number): string[] {
  const rng = seed !== undefined ? seededRandom(seed) : Math.random;
  const pool = [...ITEM_POOL];
  const picked: string[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor((rng as any)() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

async function launchBrowser(name: BrowserName, headed: boolean): Promise<Browser> {
  const common = { headless: !headed };
  if (name === 'firefox') return await firefox.launch(common);
  if (name === 'webkit') return await webkit.launch(common);
  return await chromium.launch(common);
}

async function login(page: Page, baseURL: string, cred: UserCred): Promise<void> {
  await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Email address').fill(cred.email);
  await page.getByLabel('Password').fill(cred.password);
  await Promise.all([
    page.waitForURL(url => /\/chat$/.test(url.toString()), { timeout: 60000 }),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);
}

async function sendChatAndWaitForSaveShop(page: Page, itemsCsv: string, user?: string): Promise<void> {
  // Send the chat message
  const input = page.getByPlaceholder(/Type your message|Add a description|Analyzing/i);
  await input.click();
  await input.fill(itemsCsv);
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/chat') && resp.request().method() === 'POST').catch(() => null),
    page.getByRole('button', { name: /send/i }).click(),
  ]);

  // Wait for bot response and Save & Shop button to appear
  logWithTimestamp('Waiting for chat bot response and Save & Shop button...', user);

  // Wait for the chat response to appear (look for bot message)
  await page.waitForFunction(() => {
    const messages = document.querySelectorAll('[data-testid="chat-message"], .message, [class*="message"]');
    const botMessages = Array.from(messages).filter(msg => {
      const content = msg.textContent || '';
      return content.includes('Here\'s what I found') ||
             content.includes('shopping list') ||
             content.includes('items') ||
             content.length > 50; // Bot responses are typically longer
    });
    return botMessages.length > 0;
  }, { timeout: 60000 });

  // Wait for Save & Shop button to appear
  const saveShopButton = page.getByRole('button', { name: /save.*shop|shop.*now|save.*list/i });
  await saveShopButton.waitFor({ state: 'visible', timeout: 30000 });

  logWithTimestamp('Found Save & Shop button, clicking...', user);
  await saveShopButton.click();

  // Wait for navigation to lists page
  await page.waitForURL(url => /\/lists$/.test(url.toString()), { timeout: 30000 });
  logWithTimestamp('Navigated to lists page', user);
}

// Simplified workflow - we trust that "Save & Shop" navigates to the correct list

async function clickCheckPricesAndWait(page: Page, timeoutMs: number, items?: string[], user?: string): Promise<{duration: number, completedVia: string}> {
  const start = Date.now();

  // UI-based fallback mechanism (declared outside for Promise.race access)
  const uiFallbackPromise = new Promise<{duration: number, completedVia: string}>((uiResolve, uiReject) => {
    const checkUIFallback = async () => {
      try {
        // Check if page is still valid and API monitoring hasn't completed
        if (page.isClosed() || completionDetected) {
          logWithTimestamp('UI fallback skipped - page closed or API completion already detected', user);
          return;
        }

        logWithTimestamp('Running UI fallback check...', user);

        // Wait for the button to become enabled again (not searching)
        const checkBtn = page.getByRole('button', { name: /check prices/i });

        // Check if button exists and is visible (with shorter timeout)
        try {
          await checkBtn.waitFor({ state: 'visible', timeout: 10000 });
        } catch (e) {
          logWithTimestamp('Check Prices button not visible for UI fallback check', user);
          return;
        }

        // Check if button is no longer disabled (meaning job might be done)
        const isDisabled = await checkBtn.evaluate((btn: HTMLButtonElement) => btn.disabled);
        if (!isDisabled) {
          // Button is enabled, check if we have results
          const hasResults = await page.locator('table, [data-testid="price-results"], [data-testid="savings-summary"]').count() > 0;
          if (hasResults) {
            const duration = Date.now() - start;
            logWithTimestamp(`UI fallback completion detected in ${duration}ms`, user);
            uiResolve({ duration, completedVia: 'ui_fallback' });
            return;
          } else {
            logWithTimestamp('Button enabled but no results found yet', user);
          }
        } else {
          logWithTimestamp('Button still disabled, job may still be running', user);
        }
      } catch (e) {
        logWithTimestamp(`UI fallback check failed: ${e}`, user);
      }
    };

    // Start checking after 2 minutes (give API monitoring time to work first)
    setTimeout(checkUIFallback, Math.min(120000, timeoutMs / 2));
  });

  // Shared state for completion detection
  let jobStarted = false;
  let sessionId: string | null = null;
  let currentListId: string | null = null;
  let completionDetected = false;

  // Set up comprehensive monitoring for completion detection
  const completionPromise = new Promise<{duration: number, completedVia: string}>((resolve, reject) => {
    // Monitor ALL network responses for debugging and completion signals
    page.on('response', async (response) => {
      const url = response.url();
      const method = response.request().method();
      const status = response.status();

      // Log all check_prices related responses for debugging
      if (url.includes('/check_prices')) {
        logWithTimestamp(`API Response: ${method} ${url} - Status: ${status}`, user);
      }

      try {
        // Detect when check_prices starts for our specific list
        if (url.includes('/check_prices') && method === 'POST' && status >= 200 && status < 300) {
          const data = await response.json();
          sessionId = data.session_id || data.id;
          currentListId = data.list_id;

          // Check if this is for our list by examining the request body if possible
          // For now, we'll assume the most recent check_prices call is ours
          jobStarted = true;
          logWithTimestamp(`Job started with session ${sessionId} for list ${currentListId}`, user);
        }

        // Multiple completion detection strategies
        if (url.includes('/check_prices') && jobStarted && !completionDetected) {
          const data = await response.json();

          // Strategy 1: isShoppingNow becomes false
          if (data && data.isShoppingNow === false) {
            const duration = Date.now() - start;
            logWithTimestamp(`Backend confirmed completion (isShoppingNow=false) in ${duration}ms`, user);
            completionDetected = true;
            resolve({ duration, completedVia: 'backend_status' });
            return;
          }

          // Strategy 2: Results are present
          if (data && (data.results || data.completed || data.status === 'complete' || data.message?.includes('complete'))) {
            const duration = Date.now() - start;
            logWithTimestamp(`Results received in ${duration}ms`, user);
            completionDetected = true;
            resolve({ duration, completedVia: 'results_response' });
            return;
          }

          // Strategy 3: Success status in response
          if (data && data.success === true) {
            const duration = Date.now() - start;
            logWithTimestamp(`Success status received in ${duration}ms`, user);
            completionDetected = true;
            resolve({ duration, completedVia: 'success_status' });
            return;
          }
        }

        // Strategy 4: Any successful response after job started (fallback)
        if (jobStarted && !completionDetected && url.includes('/check_prices') && status >= 200 && status < 300) {
          const data = await response.json();
          if (data && typeof data === 'object' && !data.isShoppingNow) {
            const duration = Date.now() - start;
            logWithTimestamp(`Fallback completion detected in ${duration}ms`, user);
            completionDetected = true;
            resolve({ duration, completedVia: 'fallback_completion' });
            return;
          }
        }
      } catch (e) {
        // Ignore JSON parsing errors for non-JSON responses
        logWithTimestamp(`Could not parse response from ${url}: ${e}`, user);
      }
    });

    // Timeout fallback with better error messages
    setTimeout(() => {
      if (!jobStarted) {
        reject(new Error('Job never started - check if Check Prices button is enabled and stores are selected'));
      } else if (!completionDetected) {
        reject(new Error(`Job started but no completion signal detected within ${timeoutMs}ms. Check backend logs.`));
      }
    }, timeoutMs);
  });

  // Perform the UI actions - find and click Check Prices button
  logWithTimestamp('Looking for Check Prices button...', user);

  // Try the most common selectors for Check Prices button
  const btnSelectors = [
    page.getByRole('button', { name: /check prices/i }),
    page.getByRole('button', { name: /check price/i }),
    page.getByRole('button', { name: /shop now/i }),
    page.locator('[data-testid="check-prices-button"]'),
  ];

  let btn: any = null;
  for (const selector of btnSelectors) {
    try {
      await selector.waitFor({ state: 'visible', timeout: 10000 });
      btn = selector;
      logWithTimestamp('Found Check Prices button', user);
      break;
    } catch (e) {
      logWithTimestamp('Button selector not found, trying next...', user);
    }
  }

  if (!btn) {
    // Fallback: try to find any button that might be the Check Prices button
    try {
      const fallbackBtn = page.locator('button').first();
      await fallbackBtn.waitFor({ state: 'visible', timeout: 5000 });
      logWithTimestamp('Using fallback button', user);
      btn = fallbackBtn;
    } catch (e) {
      throw new Error('Check Prices button not found after trying all selectors');
    }
  }

  // Check if button is enabled before clicking
  const isDisabled = await btn.evaluate((button: HTMLButtonElement) => button.disabled);
  if (isDisabled) {
    throw new Error('Check Prices button is disabled - ensure stores are selected for this list');
  }

  logWithTimestamp('Clicking Check Prices button...', user);
  await btn.click();

  // Small delay to allow UI to start updating
  await page.waitForTimeout(2000);

  // Wait for either API confirmation or UI fallback
  try {
    return await Promise.race([completionPromise, uiFallbackPromise]);
  } catch (error) {
    // If both promises fail, throw a combined error
    logWithTimestamp(`Both API and UI fallback failed: ${error}`, user);
    throw error;
  }
}

async function runUserFlow(browser: Browser, baseURL: string, items: number, cred: UserCred, timeoutMs: number, seed?: number, ignoreHTTPSErrors?: boolean): Promise<UserResult> {
  const user = cred.email;
  logWithTimestamp(`Starting user flow for ${user}`, user);

  const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, ignoreHTTPSErrors: !!ignoreHTTPSErrors });
  const page = await context.newPage();
  const timings: UserResult['timings'] = { loginStart: Date.now() };

  try {
    logWithTimestamp('Logging in...', user);
    await login(page, baseURL, cred);
    timings.loginEnd = Date.now();
    logWithTimestamp(`Login completed in ${timings.loginEnd - timings.loginStart}ms`, user);

    const picked = pickRandomItems(items, seed);
    const csv = picked.join(',');
    logWithTimestamp(`Sending chat message with ${picked.length} items: ${csv}`, user);
    await sendChatAndWaitForSaveShop(page, csv, user);
    timings.chatSentAt = Date.now();

    // Wait for UI to settle after navigation
    logWithTimestamp('Waiting for UI to settle...', user);
    await page.waitForTimeout(700);

    timings.checkPricesClickAt = Date.now();

    // Click Check Prices and wait for completion
    let completionResult;
    try {
      logWithTimestamp('Starting price check monitoring...', user);
      completionResult = await clickCheckPricesAndWait(page, timeoutMs, picked, user);
      logWithTimestamp(`Price check completed via ${completionResult.completedVia} in ${completionResult.duration}ms`, user);
    } catch (error) {
      logWithTimestamp(`Check Prices button interaction failed: ${error}`, user);
      throw error;
    }

    timings.jobCompleteAt = Date.now();

    await context.close();
    logWithTimestamp(`User flow completed successfully`, user);
    return {
      user: cred.email,
      success: true,
      timings,
      completionMethod: completionResult.completedVia,
      duration: completionResult.duration
    };
  } catch (err: any) {
    await context.close();
    logWithTimestamp(`User flow failed: ${err?.message || String(err)}`, user);
    return {
      user: cred.email,
      success: false,
      error: err?.message || String(err),
      timings
    };
  }
}

function summarize(results: UserResult[]) {
  const successes = results.filter(r => r.success && r.duration !== undefined);
  const durations = successes.map(r => r.duration!);
  const totalWall = Math.max(...results.map(r => (r.timings.jobCompleteAt || r.timings.checkPricesClickAt || r.timings.chatSentAt || r.timings.loginEnd || r.timings.loginStart) || 0))
    - Math.min(...results.map(r => r.timings.loginStart));

  const p95 = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a,b)=>a-b);
    const idx = Math.floor(0.95 * (sorted.length - 1));
    return sorted[idx];
  };

  const toMs = (ms: number | undefined) => (ms ?? 0);
  const fmt = (ms: number) => `${ms} ms`;

  console.log('\n=== Savr Load Test Report ===');
  console.table(results.map(r => ({
    user: r.user,
    success: r.success,
    login: r.timings.loginEnd ? `${toMs(r.timings.loginEnd - r.timings.loginStart)} ms` : '-',
    'check->done': r.duration ? `${fmt(r.duration)} (${r.completionMethod || 'unknown'})` : '-',
    error: r.error || '',
  })));

  console.log('Aggregate:');
  console.log(`  Users: ${results.length}, Success: ${successes.length}, Failed: ${results.length - successes.length}`);
  if (durations.length) {
    const avg = durations.reduce((a,b)=>a+b,0) / durations.length;
    console.log(`  Per-user job duration: min=${fmt(Math.min(...durations))}, avg=${fmt(Math.round(avg))}, p95=${fmt(p95(durations))}, max=${fmt(Math.max(...durations))}`);
  }
  console.log(`  Total wall time: ${fmt(Math.max(0, totalWall))}`);
}

(async () => {
  logWithTimestamp('Load test script starting...');

  const opts = parseArgs();
  logWithTimestamp(`Options: ${JSON.stringify({ baseURL: opts.baseURL, users: opts.users, items: opts.items, headed: opts.headed, browser: opts.browser, timeoutMs: opts.timeoutMs, seed: opts.seed, ignoreHTTPSErrors: opts.ignoreHTTPSErrors })}`);

  const browser = await launchBrowser(opts.browser, opts.headed);
  const creds = DEFAULT_USERS.slice(0, Math.max(1, Math.min(opts.users, DEFAULT_USERS.length)));

  const startAll = Date.now();
  logWithTimestamp(`Starting ${creds.length} user flows...`);

  const promises = creds.map((c, idx) => runUserFlow(browser, opts.baseURL, opts.items, c, opts.timeoutMs, opts.seed ? opts.seed + idx : undefined, opts.ignoreHTTPSErrors));
  const settled = await Promise.all(promises);
  const totalEnd = Date.now();
  await browser.close();

  logWithTimestamp(`All user flows completed`);
  summarize(settled);
  logWithTimestamp(`Total execution time: ${totalEnd - startAll} ms`);

  const failed = settled.filter(r => !r.success).length;
  if (failed > 0) process.exitCode = 1;
})();


