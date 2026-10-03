# Contributing

Thanks for helping make browser sending more deliberate.

## Before opening a change

1. Open an issue for a behavior change or a new detection rule.
2. Keep the extension local-first: no telemetry, remote service, or silent data collection.
3. Prefer a false negative over intercepting an unrelated control.
4. Do not add automatic reload or send behavior.

## Local checks

```powershell
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm audit
```

New behavior should have a test first. Run the failing test (RED), add the smallest implementation, then run the complete suite (GREEN). Keep user-facing claims and the verification record accurate.

## Pull requests

Describe the user problem, the smallest behavior change, safety implications, and a reproducible demo. Use fake page content and fake messages in tests and screenshots.
