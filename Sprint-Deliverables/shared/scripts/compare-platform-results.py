#!/usr/bin/env python3
"""Compare sanitized reports emitted by the mobile backend QA screen."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2] / 'Sprint-7' / 'test-results'
ios = json.loads((root / 'cross-platform-ios.json').read_text())
android = json.loads((root / 'cross-platform-android.json').read_text())
assert ios['platform'] == 'ios' and android['platform'] == 'android'
assert len(ios['results']) == len(android['results']) == 6
assert all(r['passed'] and r['status'] == 200 for report in (ios, android) for r in report['results'])
android_by_endpoint = {r['endpoint']: r for r in android['results']}
comparisons = []
for left in ios['results']:
    if 'fingerprint' not in left:
        continue
    right = android_by_endpoint[left['endpoint']]
    comparisons.append({'endpoint': left['endpoint'], 'ios': left['fingerprint'],
                        'android': right['fingerprint'],
                        'matches': left['fingerprint'] == right['fingerprint']})
report = {'ios_time': ios['timestamp'], 'android_time': android['timestamp'],
          'six_flows_passed_on_both': True, 'comparisons': comparisons,
          'all_match': len(comparisons) >= 4 and all(row['matches'] for row in comparisons)}
(root / 'cross-platform-comparison.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
raise SystemExit(0 if report['all_match'] else 1)
