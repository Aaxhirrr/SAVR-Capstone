#!/bin/bash
set -euo pipefail
DEVICE="${SAVR_SIMULATOR_ID:-142415AD-EB6B-4D56-B728-0DB3BD121A77}"
MODE="${1:-normal}"
xcrun simctl terminate "$DEVICE" com.savr.mobile 2>/dev/null || true
case "$MODE" in
  offline) FAILURE_PATH='chat/' ;;
  timeout) FAILURE_PATH='user/selected_stores' ;;
  malformed) FAILURE_PATH='grocery-lists/' ;;
  normal) xcrun simctl launch "$DEVICE" com.savr.mobile; exit 0 ;;
  *) echo 'Usage: qa-failure.sh offline|timeout|malformed|normal' >&2; exit 1 ;;
esac
SIMCTL_CHILD_SAVR_QA_FAILURE="$MODE" SIMCTL_CHILD_SAVR_QA_FAILURE_PATH="$FAILURE_PATH" xcrun simctl launch "$DEVICE" com.savr.mobile
