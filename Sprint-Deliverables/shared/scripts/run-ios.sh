#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/../../.."
DEVICE="${SAVR_SIMULATOR_ID:-142415AD-EB6B-4D56-B728-0DB3BD121A77}"
BUILD="${SAVR_BUILD_DIR:-/tmp/savr-capstone-build}"
xcrun simctl boot "$DEVICE" 2>/dev/null || true
xcrun simctl bootstatus "$DEVICE" -b
xcodebuild -project SavrMobile.xcodeproj -scheme SavrMobile -destination "platform=iOS Simulator,id=$DEVICE" -derivedDataPath "$BUILD" build
xcrun simctl install "$DEVICE" "$BUILD/Build/Products/Debug-iphonesimulator/SavrMobile.app"
xcrun simctl launch "$DEVICE" com.savr.mobile
open -a Simulator
