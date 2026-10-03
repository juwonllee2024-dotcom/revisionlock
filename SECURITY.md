# Security Policy

## Scope

RevisionLock is a local Chrome extension and a local demo server. It is designed to reduce accidental sends caused by stale page state, not to provide a security boundary for a website or account.

## Data boundaries

- The extension makes no network requests.
- It does not send page text, drafts, URLs, credentials, or telemetry anywhere.
- It only runs after the user enables it on the current tab.
- It does not automatically reload a page or send a message.
- The demo server binds to `127.0.0.1` and blocks paths outside the repository.

## Reporting a vulnerability

Please do not open a public issue for a security-sensitive report. Use GitHub's private vulnerability reporting for this repository, or contact the maintainer through the GitHub account `juwonllee2024-dotcom` with:

1. A short description and impact.
2. A minimal reproduction that uses fake data.
3. The affected version and browser.
4. Any proposed mitigation.

Do not include passwords, tokens, private messages, or personal data in a report.
