#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/../../.."
DEVICE="${SAVR_SIMULATOR_ID:-142415AD-EB6B-4D56-B728-0DB3BD121A77}"
RESULT="${SAVR_TEST_RESULT:-/tmp/savr-tests-$(date +%Y%m%d-%H%M%S).xcresult}"
xcodebuild -project SavrMobile.xcodeproj -scheme SavrMobile -destination "platform=iOS Simulator,id=$DEVICE" -derivedDataPath /tmp/savr-capstone-tests -resultBundlePath "$RESULT" -parallel-testing-enabled NO test
