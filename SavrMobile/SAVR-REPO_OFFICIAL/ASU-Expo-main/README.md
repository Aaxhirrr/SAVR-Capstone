# SAVR — Expo React Native App

A React Native app built with Expo and TypeScript for the SAVR savings platform.

---

## Prerequisites

Before you start, make sure you have the following installed on your computer:

1. **Node.js** (v18 or later) — [Download here](https://nodejs.org)
2. **npm** — comes with Node.js
3. **Expo Go** — install the app on your iOS or Android phone from the App Store / Google Play
4. **Cursor** — [Download here](https://cursor.sh) (AI-powered code editor)

---

## Getting Started (Cursor + Expo)

### 1. Open the project in Cursor

Open Cursor, then go to **File → Open Folder** and select the `savr-expo` folder.

### 2. Open the built-in terminal

In Cursor, press `` Ctrl+` `` (backtick) to open the integrated terminal.

### 3. Install dependencies

Run this command in the terminal:

```bash
npm install
```

### 4. Start the development server

```bash
npx expo start
```

This will open a screen in your terminal showing a **QR code**.

### 5. Run on your phone

- Open the **Expo Go** app on your phone
- Scan the QR code shown in the terminal
- The SAVR app will load on your phone

> **Tip:** Your phone and computer must be on the same Wi-Fi network.

---

## Project Structure

```
savr-expo/
├── App.tsx                    ← App entry point
├── src/
│   ├── screens/               ← One file per screen
│   │   ├── LoginScreen.tsx
│   │   └── HomeScreen.tsx
│   ├── components/            ← Reusable UI pieces
│   │   └── Button.tsx
│   ├── services/              ← API and auth logic
│   │   ├── api.ts             ← Axios base config (points to backend)
│   │   └── auth.ts            ← Login, logout, token storage
│   ├── navigation/            ← Screen routing
│   │   └── index.tsx
│   └── theme/                 ← Colors, fonts, spacing
│       └── index.ts
```

---

## API Configuration

The backend URL is set in `src/services/api.ts`:

```ts
export const API_BASE_URL = 'http://31.97.140.85:8001';
```

To change the backend URL, edit that one line.

### Authentication

Login sends a `POST` request to `/auth/login` with **form-encoded** data:

```
username=<username>&password=<password>
```

The response looks like:

```json
{
  "access_token": "...",
  "user_id": "123"
}
```

The token and user ID are stored on the device using `AsyncStorage` and persist across app restarts.

---

## Adding a New Screen

1. Create a new file in `src/screens/`, e.g. `ProfileScreen.tsx`
2. Add it to the navigator in `src/navigation/index.tsx`:

```ts
// 1. Add to the type list
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;   // ← add this
};

// 2. Add the Screen inside <Stack.Navigator>
<Stack.Screen name="Profile" component={ProfileScreen} />
```

3. Navigate to it from any screen:

```ts
navigation.navigate('Profile');
```

---

## Making API Calls

Import the `api` instance from `src/services/api.ts`:

```ts
import api from '../services/api';
import { getToken } from '../services/auth';

async function fetchSomething() {
  const token = await getToken();
  const response = await api.get('/some/endpoint', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
```

---

## Theme / Styling

All colors, fonts and spacing live in `src/theme/index.ts`. Import what you need:

```ts
import { colors, fonts, spacing, radius } from '../theme';
```

---

## Common Issues

| Problem | Fix |
|---|---|
| App won't load on phone | Make sure your phone and computer are on the same Wi-Fi |
| Login fails with network error | Check the API server is running at `http://31.97.140.85:8001` |
| `npm install` errors | Delete `node_modules/` and run `npm install` again |
| TypeScript errors in Cursor | Press `Cmd+Shift+P` → "TypeScript: Restart TS Server" |

---

## Scripts

| Command | What it does |
|---|---|
| `npx expo start` | Start dev server + QR code |
| `npx expo start --ios` | Open in iOS Simulator (Mac only) |
| `npx expo start --android` | Open in Android Emulator |
| `npx expo start --web` | Open in browser |
