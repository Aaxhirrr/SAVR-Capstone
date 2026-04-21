# SAVR Mobile — Student Setup Guide

Welcome to the SAVR mobile team. This guide will get you from zero to running the app on your phone, and walk you through how to contribute new screens using Cursor.

Read the whole thing once before you start. It's long, but it will save you hours.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the repo and install dependencies](#2-clone-the-repo-and-install-dependencies)
3. [Run the app and test login](#3-run-the-app-and-test-login)
4. [Setting up the frontend reference repo](#4-setting-up-the-frontend-reference-repo)
5. [Adding a new screen with Cursor](#5-adding-a-new-screen-with-cursor)
6. [API base URL and authenticated requests](#6-api-base-url-and-authenticated-requests)
7. [Folder structure explained](#7-folder-structure-explained)
8. [Rules — please read carefully](#8-rules--please-read-carefully)
9. [Cursor workflow: converting web components to React Native](#9-cursor-workflow-converting-web-components-to-react-native)

---

## 1. Prerequisites

Install all of these before anything else. If you already have one, skip it.

### Node.js

Node.js is the JavaScript runtime that powers everything. You need version 18 or later.

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version (the left button — "Recommended for most users")
3. Run the installer, click through all the defaults
4. Open a terminal and verify it worked:

```bash
node --version
# should print something like v20.11.0
```

> **What is a terminal?**
> On Mac: press `Cmd+Space`, type "Terminal", press Enter.
> On Windows: press the Windows key, type "PowerShell", press Enter.

### Expo Go (on your phone)

Expo Go lets you run your app on a real phone without submitting it to the App Store.

- **iPhone:** Open the App Store, search "Expo Go", install it
- **Android:** Open Google Play, search "Expo Go", install it

### Cursor (code editor)

Cursor is the AI-powered code editor you'll use to write and modify code.

1. Go to [https://cursor.sh](https://cursor.sh)
2. Download and install it for your operating system
3. Open it — you'll be prompted to sign in or create a free account

### Git

Git is how you download (clone) the code repository.

- **Mac:** Open Terminal and run `git --version`. If git isn't installed, it will prompt you to install it automatically.
- **Windows:** Download from [https://git-scm.com](https://git-scm.com) and install with all defaults.

---

## 2. Clone the repo and install dependencies

### Step 1 — Open a terminal

On Mac, press `Cmd+Space`, type "Terminal", press Enter.

### Step 2 — Navigate to your Desktop

```bash
cd ~/Desktop
```

### Step 3 — Clone the repository

```bash
git clone <repo-url> savr-expo
```

Replace `<repo-url>` with the URL your team lead gave you (it will look something like `https://github.com/your-org/savr-expo.git`).

> If you were given the project folder directly (not a git URL), skip the clone step — just copy the folder to your Desktop.

### Step 4 — Move into the project folder

```bash
cd savr-expo
```

### Step 5 — Install dependencies

```bash
npm install
```

This downloads all the code libraries the app needs. It may take 1–2 minutes. You'll see a lot of text scrolling — that's normal.

When it finishes you should see something like:

```
added 747 packages, and audited 747 packages in 25s
```

If you see **errors in red**, stop and ask your team lead before continuing.

### Step 6 — Open the project in Cursor

In Cursor, go to **File → Open Folder**, then select the `savr-expo` folder on your Desktop.

---

## 3. Run the app and test login

### Step 1 — Start the development server

In Cursor, press `` Ctrl+` `` to open the built-in terminal. Then run:

```bash
npx expo start
```

You will see output like this and a **QR code** will appear in the terminal:

```
Starting project at /Users/you/Desktop/savr-expo
...
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

> **Important:** Your phone and your computer must be connected to the **same Wi-Fi network**. This will not work over mobile data.

### Step 2 — Open the app on your phone

- **iPhone:** Open the default **Camera** app, point it at the QR code. A banner will appear at the top — tap it to open in Expo Go.
- **Android:** Open the **Expo Go** app, tap "Scan QR code", and scan it.

The app will load on your phone within about 30 seconds the first time.

### Step 3 — Test the login

Use these credentials to log in and verify the app can talk to the backend:

| Field | Value |
|---|---|
| Username | `test@staging.com` |
| Password | `TestPass123` |

If login succeeds, you'll land on the Home screen. If you see an error, check that you're on the same Wi-Fi as your computer, and that the backend is running.

### Reloading the app

While the dev server is running, any time you save a file in Cursor the app on your phone will automatically reload. You don't need to re-scan the QR code.

To manually reload: shake your phone to open the Expo developer menu, then tap **Reload**.

---

## 4. Setting up the frontend reference repo

The SAVR web app (`savr-frontend-reference`) is the design source of truth. It contains the visual components — buttons, cards, colours, layouts — that the mobile app should match. You'll clone it locally and open it alongside this repo in Cursor so the AI can see both at once and help you translate web components into React Native.

### Step 1 — Clone the reference repo

Open a new terminal tab (or press `Cmd+T` in Terminal on Mac) and run:

```bash
cd ~/Desktop
git clone <frontend-reference-repo-url> savr-frontend-reference
```

Replace `<frontend-reference-repo-url>` with the URL your team lead gives you.

### Step 2 — Add it to your Cursor workspace

Cursor supports **multi-root workspaces**, which lets you have two project folders open at the same time. This is key — it lets Cursor's AI read both codebases simultaneously.

1. In Cursor, go to **File → Add Folder to Workspace…**
2. Select the `savr-frontend-reference` folder on your Desktop
3. Click **Add**

You should now see two folders in the left sidebar:

```
SAVR-EXPO
SAVR-FRONTEND-REFERENCE
```

> **Why does this matter?**
> When you open Cursor's AI chat (`Cmd+L`) and paste a web component, Cursor can now see the actual theme files, colours, and patterns from both repos and give you much more accurate conversions.

### Step 3 — Save this as a workspace file (optional but recommended)

Go to **File → Save Workspace As…** and save a file called `savr.code-workspace` on your Desktop. Next time, open this file instead of the individual folders and both will load automatically.

### Step 4 — Understand what to look at in the reference repo

The most useful files in the reference repo are usually:

| What you're looking for | Where to find it |
|---|---|
| Component designs | `src/components/` or `components/` |
| Page/screen designs | `src/pages/`, `src/views/`, or `src/app/` |
| Colour tokens | `tailwind.config.js`, `theme.ts`, or CSS variables |
| Fonts and spacing | Same theme files |

Don't worry about understanding all of it — you only need to find the specific component you're converting.

---

## 5. Adding a new screen with Cursor

This section walks you through adding a brand new screen end-to-end. Follow these steps every time.

### Example: adding a "Profile" screen

#### Step 1 — Create the screen file

In the Cursor file explorer (left sidebar), right-click on `src/screens/` and choose **New File**. Name it `ProfileScreen.tsx`.

Cursor will create an empty file. Leave it open.

#### Step 2 — Ask Cursor AI to scaffold it

Press `Cmd+L` to open the Cursor AI chat panel. Paste this prompt (edit the screen name as needed):

```
I'm building a React Native Expo app with TypeScript.

Create a new screen called ProfileScreen in src/screens/ProfileScreen.tsx.

It should:
- Use the theme from src/theme/index.ts for all colours and spacing
- Have a SafeAreaView wrapper
- Show the user's ID (fetched from src/services/auth.ts using getUserId())
- Include a placeholder section called "Account Settings"
- Use a consistent style with the existing HomeScreen.tsx

Look at HomeScreen.tsx for style patterns to follow.
```

Cursor will generate the file contents. Review them, then paste them into your new `ProfileScreen.tsx` file.

#### Step 3 — Register the screen in the navigator

Open `src/navigation/index.tsx`. You need to do two things:

**a) Add the screen name to the type list** near the top of the file:

```ts
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;   // ← add this line
};
```

**b) Import your new screen** at the top of the file (with the other imports):

```ts
import ProfileScreen from '../screens/ProfileScreen';
```

**c) Add a `<Stack.Screen>` entry** inside `<Stack.Navigator>`:

```tsx
<Stack.Screen name="Profile" component={ProfileScreen} />
```

Ask Cursor AI if you're unsure where these lines go — paste the current contents of `navigation/index.tsx` into the chat and ask it to add your new screen.

#### Step 4 — Navigate to the new screen

From any existing screen (e.g. `HomeScreen.tsx`), you can navigate to your new screen like this:

```ts
navigation.navigate('Profile');
```

For example, add a button in `HomeScreen.tsx` that goes to Profile:

```tsx
<TouchableOpacity onPress={() => navigation.navigate('Profile')}>
  <Text>Go to Profile</Text>
</TouchableOpacity>
```

#### Step 5 — Test it on your device

Save all changed files. The app on your phone will reload automatically. Tap through to your new screen and make sure it looks right on a real device — **not just in your head**.

#### Step 6 — Clean up and commit

Once the screen looks correct on your phone, you're ready to commit. See the [Rules](#8-rules--please-read-carefully) section first.

---

## 6. API base URL and authenticated requests

### The base URL

All API calls go to:

```
http://31.97.140.85:8001
```

This is configured in `src/services/api.ts`. **Do not change this file** without checking with your team lead first (see [Rules](#8-rules--please-read-carefully)).

### Making a basic API call

Import the `api` instance and the `getToken` helper:

```ts
import api from '../services/api';
import { getToken } from '../services/auth';
```

Then call an endpoint like this:

```ts
async function fetchUserProfile() {
  const token = await getToken();

  const response = await api.get('/users/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
```

### Using it inside a screen

Here's a complete example of fetching data when a screen loads:

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import api from '../services/api';
import { getToken } from '../services/auth';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const response = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    }

    load();
  }, []);

  if (!profile) return <Text>Loading...</Text>;

  return (
    <View>
      <Text>Welcome, {profile.name}</Text>
    </View>
  );
}
```

### What endpoints are available?

Ask your team lead for the API documentation, or visit `http://31.97.140.85:8001/docs` in your browser — if the backend uses FastAPI (which it does), there will be an interactive API explorer there listing all available endpoints.

### Handling errors

Always wrap API calls in `try/catch`. If the token has expired, the server will return a `401` error and the user should be sent back to the Login screen:

```ts
} catch (err: any) {
  if (err?.response?.status === 401) {
    await logout();
    navigation.replace('Login');
  }
}
```

---

## 7. Folder structure explained

```
savr-expo/
│
├── App.tsx                        The app entry point. Loads the navigator.
│                                  Don't put screen logic here.
│
├── src/
│   │
│   ├── screens/                   One file per screen in the app.
│   │   ├── LoginScreen.tsx        The login form.
│   │   └── HomeScreen.tsx         The main screen after login.
│   │   └── YourNewScreen.tsx      ← You'll add files here
│   │
│   ├── components/                Reusable UI pieces used across multiple screens.
│   │   └── Button.tsx             A styled button with loading state.
│   │   └── YourComponent.tsx      ← Add shared components here
│   │
│   ├── services/                  All backend communication lives here.
│   │   ├── api.ts                 Axios instance with the base URL configured.
│   │   └── auth.ts                Login, logout, and token storage.
│   │                              ⚠️  Do not edit these without permission.
│   │
│   ├── navigation/
│   │   └── index.tsx              Defines all screens and the navigation stack.
│   │                              Edit this when adding new screens.
│   │
│   └── theme/
│       └── index.ts               Colours, fonts, spacing, and shadow values.
│                                  Always import from here instead of hardcoding.
│
├── STUDENT_SETUP.md               This file.
├── README.md                      Short setup reference.
├── package.json                   Lists all dependencies.
└── tsconfig.json                  TypeScript configuration.
```

### Key rules about structure

- **Screens** go in `src/screens/`. One file, one screen.
- **Components** go in `src/components/` only if they're used in more than one screen. If a component is only used in one screen, put it in the same file as that screen.
- **Never hardcode colours or spacing** — always use `colors.xxx`, `spacing.xxx` etc. from `src/theme/index.ts`.
- **Never put API calls directly in a component's JSX** — put them in a function and call that function from `useEffect`.

---

## 8. Rules — please read carefully

These rules exist to keep the codebase stable for everyone on the team. Breaking them creates bugs that are hard to track down.

### Do not touch `api.ts` or `auth.ts` without asking

`src/services/api.ts` and `src/services/auth.ts` are the foundation of how the entire app communicates with the backend. If they break, nothing works — not just your screen, but every screen.

**Before editing either of these files:**
1. Talk to your team lead and explain what you're trying to do
2. Get explicit approval
3. Make your change on a separate git branch

If you think you need to modify them to build your feature, there's probably another way — ask first.

### Always test on a real device before committing

Simulators and the web preview do not behave exactly like a real phone. Things that look fine in the simulator can be broken on a real device — keyboards overlapping inputs, fonts rendering differently, touch targets too small.

**Before you commit any code:**
1. Run the app on your phone via Expo Go
2. Navigate to every screen you changed
3. Test the actual interaction (tap buttons, fill forms, scroll lists)
4. Only commit if it looks and works correctly on the real device

### One screen per file

Don't put two screens in the same file. It makes the code hard to navigate and causes navigation bugs.

### Import from theme, never hardcode

Bad:
```ts
color: '#2ECC71'
fontSize: 15
paddingHorizontal: 16
```

Good:
```ts
color: colors.primary
fontSize: fonts.sizeMd
paddingHorizontal: spacing.md
```

### Commit messages should say what you did

Bad: `update`, `fix`, `changes`, `asdf`

Good: `add ProfileScreen with account settings`, `fix login error message layout`

---

## 9. Cursor workflow: converting web components to React Native

The frontend reference repo contains the web version of SAVR built in React (for the browser). Your job is to recreate the same visual design in React Native (for the phone). They use the same JavaScript language but different components — for example, web uses `<div>` and `<p>`, React Native uses `<View>` and `<Text>`.

This section shows you exactly how to use Cursor to do that translation.

### The core idea

You find the web component you want to recreate, paste it into Cursor's AI chat, describe what you want, and let Cursor convert it. Then you review, adjust, and drop it into your screen file.

### Step-by-step walkthrough

#### Step 1 — Find the component in the reference repo

In Cursor's file explorer, look in `savr-frontend-reference/src/components/` (or wherever components live in that repo). Find the component you want — for example, `SavingsCard.jsx`.

Click on it to open it and read through it briefly to understand what it does. You don't need to fully understand it — just know what it displays.

#### Step 2 — Open Cursor AI chat

Press `Cmd+L` to open the chat panel on the right side.

#### Step 3 — Paste the web component and write your prompt

Copy the entire contents of the web component file. Then paste this template into the chat, filling in the blanks:

```
I'm converting a web React component to React Native + Expo with TypeScript.

Here is the original web component:

[PASTE THE WEB COMPONENT CODE HERE]

Please convert it to a React Native component with these requirements:
- Replace all HTML elements: div → View, p/span/h1/h2 → Text, img → Image, button → TouchableOpacity
- Replace all CSS classes with a React Native StyleSheet at the bottom of the file
- Use colours and spacing from our theme file at src/theme/index.ts
  (colours: colors.primary=#2ECC71, colors.secondary=#1A1A2E, colors.background=#F8F9FA, etc.)
- Use TypeScript with proper prop types defined as an interface
- Keep the same visual layout and hierarchy as the original
- Do not use any web-only libraries or imports
- The component should be a default export

Name the component [YOUR COMPONENT NAME] and save it to src/components/[YourComponentName].tsx
```

#### Step 4 — Review what Cursor generates

Cursor will produce a React Native component. Before you use it, check:

- [ ] No `<div>`, `<p>`, `<span>`, `<button>` — these are web-only and will crash the app
- [ ] All styles are inside `StyleSheet.create({})` at the bottom
- [ ] Colors reference `colors.xxx` from the theme, not hardcoded hex values
- [ ] No CSS properties that don't exist in React Native (e.g. `display: flex` is fine, but `float`, `grid`, and `position: fixed` are not)
- [ ] The component has a `Props` interface defined with TypeScript

If something looks off, tell Cursor in the chat: "The button style uses a web-only property, please fix it" or "Replace the hardcoded colour #2ECC71 with colors.primary from the theme."

#### Step 5 — Drop it into your file

Once you're happy with the output:

1. Create the file in `src/components/` (right-click the folder → New File)
2. Paste the generated code in
3. Save the file

#### Step 6 — Use it in a screen

Import it at the top of your screen file:

```ts
import SavingsCard from '../components/SavingsCard';
```

Then use it in your JSX:

```tsx
<SavingsCard amount={250.00} label="Weekly savings" />
```

#### Step 7 — Test on device

Save everything and check your phone. Adjust any sizing, colours or spacing that doesn't look right.

---

### Common web → React Native translation reference

If Cursor misses something, here's the quick reference:

| Web (HTML/CSS) | React Native |
|---|---|
| `<div>` | `<View>` |
| `<p>`, `<span>`, `<h1>`–`<h6>` | `<Text>` |
| `<button>` | `<TouchableOpacity>` + `<Text>` |
| `<img src="...">` | `<Image source={require('...')} />` |
| `<input>` | `<TextInput>` |
| `<ul>` / `<li>` | `<FlatList>` or mapped `<View>` |
| `className="..."` | `style={styles.xxx}` |
| `display: flex` | default in React Native — no declaration needed |
| `flex-direction: row` | `flexDirection: 'row'` |
| `font-size: 16px` | `fontSize: 16` (no units) |
| `margin: 16px` | `margin: 16` (no units) |
| `border-radius: 8px` | `borderRadius: 8` |
| `background-color: red` | `backgroundColor: 'red'` |
| `onClick` | `onPress` |
| `:hover` styles | not supported — remove them |
| `position: fixed` | `position: 'absolute'` (different behaviour) |

---

### Tips for better Cursor results

- **Give Cursor context.** The more it knows, the better its output. Always mention that you're using Expo, TypeScript, and the theme file.
- **Point it at existing files.** If you say "follow the same pattern as HomeScreen.tsx", Cursor can read that file (since it's in the workspace) and match the style.
- **Iterate in the chat.** If the first result isn't right, don't start over — just tell Cursor what to fix. For example: "The card shadow isn't working on Android, use the shadows.card object from the theme instead."
- **Ask Cursor to explain things.** If you don't understand what a piece of code does, ask: "Explain what this useEffect is doing in plain English."
- **Use `@` references.** In Cursor chat, you can type `@HomeScreen.tsx` or `@theme/index.ts` to tell Cursor to read a specific file as context.

---

## Questions?

If something in this guide isn't working or isn't clear, reach out to your team lead before spending too long trying to fix it yourself. Everyone gets stuck — it's faster for everyone if you ask early.

Good luck, and welcome to the team.
