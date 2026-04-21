## Savr Playwright Load Test (Hybrid Approach)

Run a load test using a hybrid approach that combines realistic browser interactions with precise backend API monitoring for accurate completion timing. The script follows the proper user workflow:

1. **Login** as test users
2. **Send Chat Message** with randomly selected grocery items
3. **Wait for Bot Response** and click "Save & Shop" button
4. **Navigate to Lists Page** (Save & Shop automatically selects the new list)
5. **Wait for UI to Settle** (700ms delay)
6. **Click Check Prices** and monitor completion via API responses
7. **Measure Duration** from click to backend completion

The script trusts that "Save & Shop" properly selects the correct list, eliminating complex carousel navigation logic.

### Prereqs
- Node 18+
- Install deps and browsers:
  - `npm install`
  - `npm run playwright:install`

### Environment
- Base URL defaults to `http://localhost:5173`. Override with `--baseURL` or `SAVR_BASE_URL`.
  
### Test Credentials
Hardcoded in the script:
- `testuser1@savr.app` / `testuser1`
- `testuser2@savr.app` / `testuser2`
- `testuser3@savr.app` / `testuser3`
- `testuser4@savr.app` / `testuser4`
- `testuser5@savr.app` / `testuser5`

### Users
Preconfigured emails (truncate with `--users`):
- `testuser1@savr.app`
- `testuser2@savr.app`
- `testuser3@savr.app`
- `testuser4@savr.app`
- `testuser5@savr.app`

### Run
Headless (default):

```bash
npm run loadtest -- --users 5 --items 10 --baseURL https://your-env
```

Headed:

```bash
npm run loadtest:headed -- --users 5 --items 10 --baseURL https://your-env
```

You can also pass positional args (users items baseURL). On Windows, put flags before positionals:

```bash
# Windows (PowerShell)
npm run loadtest:headed -- 5 10 https://your-env

# With HTTPS/IPs using self-signed certs (flag before positionals)
npm run loadtest:headed -- --ignoreHTTPSErrors 5 10 https://your-env
```

Optional flags:
- `--browser=chromium|firefox|webkit`
- `--timeoutMs=900000` (default 15m)
- `--seed=123` (stable item selection)
- `--ignoreHTTPSErrors` (useful for IPs/self-signed certs)

### Output
Prints a table per user with success, timings, completion method, and aggregate stats (min/avg/p95/max and total wall time). All log messages include timestamps and elapsed time from script start for precise timing analysis. Non‑zero exit code if any user fails.

## How It Works

The script implements a comprehensive workflow that mirrors real user behavior:

### Workflow Steps:
1. **Authentication**: Login as test users
2. **Chat Interaction**: Send grocery item list and wait for bot response
3. **List Creation**: Click "Save & Shop" button to create and navigate to new list
4. **List Verification**: Ensure the correct list is selected with our items
5. **Price Checking**: Click "Check Prices" and monitor backend completion
6. **Completion Detection**: Use multiple strategies to detect when price checking finishes

### Completion Detection Methods:
- **API Monitoring**: Tracks `/check_prices` responses for completion signals
- **Status Checking**: Monitors `isShoppingNow` status changes
- **Results Detection**: Waits for results to be returned
- **UI Fallback**: Uses button state and results visibility as backup

### Key Features:
- **Simplified Workflow**: Trusts "Save & Shop" to properly select the correct list
- **Robust Timing**: Measures from actual backend completion, not UI state changes
- **Timestamped Logging**: All log messages include precise timestamps and elapsed time from script start
- **Multiple Completion Detection**: Uses both API monitoring and UI fallback for reliability
- **Smart Button Detection**: Tries common selectors to find the Check Prices button
- **Error Recovery**: Graceful handling of missing elements with helpful error messages
- **UI Settling**: 700ms wait after navigation ensures UI is ready

### Troubleshooting:

**If the script fails to find the Check Prices button:**
- The script will try common button selectors
- Check that stores are properly selected for the list
- Verify the list was created properly via "Save & Shop"

**If timing seems off:**
- The script measures from actual backend completion, not UI state changes
- Multiple completion detection methods ensure accuracy

This approach eliminates the "wrong list" issue and provides reliable performance measurements for the actual user workflow.


