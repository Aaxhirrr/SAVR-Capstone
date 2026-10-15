# Run the focused sprint environment

Verified on this Apple Silicon Mac with Xcode 26.3 / iOS 26.2, Expo SDK 54, OpenJDK 17, Android Emulator 37.1.11 and Android API 35 ARM64. On an 8 GB Mac, run one mobile platform at a time and finish builds/video compression before Android interaction to avoid memory pressure.

## Native iOS

```sh
bash Sprint-Deliverables/shared/scripts/run-ios.sh
bash Sprint-Deliverables/shared/scripts/test-ios.sh
```

`run-ios.sh` builds a signed Simulator app, installs it and opens Simulator. It defaults to this machine's iPhone 17 Pro (`142415AD-EB6B-4D56-B728-0DB3BD121A77`). Override `SAVR_SIMULATOR_ID` for another device from `xcrun simctl list devices available`. The isolated iPhone 16e used for XCTest here is `F8EF679D-4C53-45D8-89F6-9D1A04D66E77`. Build products and `.xcresult` bundles stay in `/tmp`; compact evidence is in the sprint folders.

## Shared live backend testing screen

```sh
cd savr-react-native-demo
npm ci
npm start -- --port 8081
```

Keep Metro running in that terminal. Open Test → Aashir · Sprint 6 & 7 backend checks, or launch the deep link. Expo Go SDK 54 is required; Expo CLI downloads the matching official runtime. The pre-existing Expo demo is not a finished migration of the Swift app.

For iOS, `npm run ios -- --port 8081` opens Expo Go through Expo CLI. The precise screen deep link is:

```sh
xcrun simctl openurl booted 'exp://127.0.0.1:8081/--/backend-qa'
```

For Android on this configured Mac, from the repository root in another terminal:

```sh
bash Sprint-Deliverables/shared/scripts/run-android.sh
```

The script opens the official Android Emulator in a discoverable macOS app wrapper, installs the SDK-matched Expo Go runtime and opens the QA screen. Android screenshots come directly from `adb exec-out screencap -p`; recordings use `adb shell screenrecord`. UI interactions were performed in the visible emulator.

## Android installation on another Apple Silicon Mac

The following installs reputable vendor/registry packages and downloads an ARM64 system image. Review and accept the SDK licenses interactively when prompted.

```sh
brew install openjdk@17 android-commandlinetools
export JAVA_HOME="$(brew --prefix openjdk@17)/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
sdkmanager --sdk_root="$ANDROID_HOME" --licenses
sdkmanager --sdk_root="$ANDROID_HOME" 'platform-tools' 'emulator' 'platforms;android-35' 'system-images;android-35;google_apis;arm64-v8a'
mkdir -p "$ANDROID_HOME/cmdline-tools"
cp -R "$(brew --prefix)/share/android-commandlinetools/cmdline-tools/latest" "$ANDROID_HOME/cmdline-tools/latest"
"$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager" create avd --name SAVR_QA_API35 --package 'system-images;android-35;google_apis;arm64-v8a' --device pixel_7
```

Enable `hw.keyboard=yes` in the created AVD's `config.ini` before starting it. This allows normal physical keyboard input. No Android Studio project migration is required to run this Expo test screen. Official references: [Expo Android environment](https://docs.expo.dev/workflow/android-studio-emulator/) and [Expo environment setup](https://docs.expo.dev/get-started/set-up-your-environment/).

## Results and recording commands

After each complete shared run, Metro prints a `SAVR_BACKEND_QA` line containing only platform, time, status, counts and fingerprints. Save its JSON as `Sprint-7/test-results/cross-platform-ios.json` or `cross-platform-android.json`, then run:

```sh
python3 Sprint-Deliverables/shared/scripts/compare-platform-results.py
```

The comparison checks five endpoints, exceeding the four-endpoint minimum. Fingerprints compare stable returned fields (session IDs/times, list IDs/names/items/association, flyer IDs/names/prices/brands, selected-store IDs/names/addresses and profile preferences). They are simple comparison checksums, not security hashes. Login tokens and profile contact details are excluded from reports.

Native failure scenarios: `shared/scripts/qa-failure.sh offline|timeout|malformed|normal`. See Sprint 7's QA flows for what to inspect.

```sh
xcrun simctl io booted screenshot /tmp/savr-screen.png
xcrun simctl io booted recordVideo --codec=hevc /tmp/savr-recording.mp4
# Stop recording with Control-C.
```

Compress recordings before committing them. The supplied MP4s are genuine captures encoded at 12–15 fps and 1280px height for manageable repository size. The iOS cross-platform clip captures the completed result screen and its compact layout; the Android clip captures the live run and results. The other clips capture native UI walkthroughs.
