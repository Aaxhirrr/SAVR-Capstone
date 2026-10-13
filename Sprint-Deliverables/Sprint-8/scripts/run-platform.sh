#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/../../../SavrExpo/SAVR"
PLATFORM="${1:-ios}"
PORT="${SAVR_EXPO_PORT:-8083}"
[[ "$PLATFORM" == ios || "$PLATFORM" == android ]] || { echo 'Usage: run-platform.sh ios|android'; exit 1; }
curl --fail --silent --max-time 5 "http://127.0.0.1:$PORT/status" >/dev/null || {
  echo "Start Metro first: cd SavrExpo/SAVR && npx expo start --go --port $PORT --max-workers 2" >&2
  exit 1
}
RUNTIME=$(node - "$PLATFORM" <<'JS'
const {downloadExpoGoAsync}=require('./node_modules/expo/node_modules/@expo/cli/build/src/utils/downloadExpoGoAsync.js');
downloadExpoGoAsync(process.argv[2],{sdkVersion:'57.0.0'}).then(p=>console.log(p)).catch(e=>{console.error(e.message);process.exit(1)});
JS
)
RUNTIME=$(echo "$RUNTIME" | tail -1)
if [[ "$PLATFORM" == ios ]]; then
  DEVICE="${SAVR_SIMULATOR_ID:-142415AD-EB6B-4D56-B728-0DB3BD121A77}"
  xcrun simctl boot "$DEVICE" 2>/dev/null || true
  open -a Simulator
  xcrun simctl bootstatus "$DEVICE" -b
  xcrun simctl install "$DEVICE" "$RUNTIME"
  xcrun simctl openurl "$DEVICE" "exp://127.0.0.1:$PORT"
else
  SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
  ADB="$SDK/platform-tools/adb"
  [[ -x "$ADB" ]] || { echo 'Android SDK platform-tools is required.' >&2; exit 1; }
  if ! "$ADB" devices | rg -q '^emulator-.*device$'; then
    echo 'Start the SAVR_QA_API35 emulator before running this script.' >&2
    exit 1
  fi
  "$ADB" install -r "$RUNTIME"
  "$ADB" reverse "tcp:$PORT" "tcp:$PORT"
  "$ADB" shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:$PORT" host.exp.exponent
fi
