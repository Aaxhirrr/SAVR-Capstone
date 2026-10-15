#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/../../.."
SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
AVD="${SAVR_ANDROID_AVD:-SAVR_QA_API35}"
ADB="$SDK/platform-tools/adb"
[[ -x "$ADB" ]] || { echo 'Install Android SDK first; see shared/SETUP.md.' >&2; exit 1; }
# A .app wrapper makes the official emulator discoverable in macOS app controls.
APP="$HOME/Applications/SAVR Android Simulator.app"
python3 - "$APP" "$SDK" <<'PY'
import pathlib, plistlib, sys, os
p=pathlib.Path(sys.argv[1])/'Contents'; (p/'MacOS').mkdir(parents=True,exist_ok=True)
plistlib.dump({'CFBundleName':'SAVR Android Simulator','CFBundleDisplayName':'SAVR Android Simulator','CFBundleIdentifier':'local.savr.android-simulator','CFBundleExecutable':'AndroidEmulator','CFBundlePackageType':'APPL','CFBundleVersion':'1.0','NSHighResolutionCapable':True},open(p/'Info.plist','wb'))
f=p/'MacOS/AndroidEmulator'
if not f.exists(): os.symlink(str(pathlib.Path(sys.argv[2])/'emulator/qemu/darwin-aarch64/qemu-system-aarch64'),f)
PY
if ! "$ADB" devices | rg -q '^emulator-.*device$'; then
  nohup env DYLD_LIBRARY_PATH="$SDK/emulator/lib64:$SDK/emulator/lib64/qt/lib" QT_QPA_PLATFORM_PLUGIN_PATH="$SDK/emulator/lib64/qt/plugins" ANDROID_EMULATOR_LAUNCHER_DIR="$SDK/emulator" "$APP/Contents/MacOS/AndroidEmulator" -avd "$AVD" -no-audio -no-metrics -gpu host > /tmp/savr-android-emulator.log 2>&1 &
fi
"$ADB" wait-for-device
for attempt in {1..120}; do
  [[ "$("$ADB" shell getprop sys.boot_completed | tr -d '\r')" == "1" ]] && break
  sleep 1
done
[[ "$("$ADB" shell getprop sys.boot_completed | tr -d '\r')" == "1" ]] || { echo 'Android has not finished booting.' >&2; exit 1; }
"$ADB" reverse tcp:8081 tcp:8081
# Obtain the SDK-matched official Expo Go runtime using Expo's installed CLI.
cd savr-react-native-demo
EXPO_APK=$(node - <<'JS'
const {downloadExpoGoAsync}=require('./node_modules/expo/node_modules/@expo/cli/build/src/utils/downloadExpoGoAsync.js');
downloadExpoGoAsync('android',{sdkVersion:'54.0.0'}).then(path=>console.log(path)).catch(()=>process.exit(1));
JS
)
"$ADB" install -r "$(echo "$EXPO_APK" | tail -1)"
"$ADB" shell am start -a android.intent.action.VIEW -d 'exp://127.0.0.1:8081/--/backend-qa' host.exp.exponent
