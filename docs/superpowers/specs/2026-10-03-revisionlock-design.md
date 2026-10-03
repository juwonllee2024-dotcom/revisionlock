# RevisionLock Design

## One-line value

RevisionLock pauses a browser message when the page changed underneath the draft.

## User and problem

First users are developers reviewing pull requests, support workers replying in web consoles, and AI users continuing long-running browser conversations. They write against a page, switch tabs or devices, the page becomes stale or changes, and the send box still accepts a message. The result can be a comment attached to an old diff or a continuation from an obsolete AI conversation.

Evidence includes [GitHub Community discussion #68448](https://github.com/orgs/community/discussions/68448) about losing review drafts during navigation, [Codex issue #48490](https://github.com/openai/codex/issues/48490) about stale cross-device conversations remaining sendable, and [Codex issue #42269](https://github.com/openai/codex/issues/42269) about older conversation branches hiding later turns.

## Innovation hypothesis

A generic, opt-in browser guard can detect page mutations and tab-background transitions while a user is drafting, then require an explicit refresh-or-send decision before the message leaves. It does not need service APIs, account access, or cloud data.

## Product boundary

- Chrome Manifest V3 extension.
- User enables it on the current tab with `activeTab` and `scripting`.
- It tracks only the active composer and page changes outside that composer.
- It marks a draft as stale after a non-composer DOM mutation or a background-to-visible transition.
- It pauses recognized send controls and offers `Refresh page`, `Send anyway once`, or `Keep editing`.
- No network, account, telemetry, clipboard history, or automatic send.
- Ambiguous composer or send button means no action.

## Architecture

`revision.ts` is a pure state machine. `composer.ts` finds a composer and a likely send button. `content.ts` attaches a capture-phase send guard, a MutationObserver, and a visibility listener. `review.ts` is an extension-owned Shadow DOM panel. `popup.ts` injects the content script only after the user enables the active tab. `examples/demo.html` simulates a page revision change.

## Safety and failure behavior

- Mutations inside the active composer do not mark the page stale.
- No text or page snapshot leaves the tab; the MVP stores only booleans in memory.
- Refresh is never automatic; it is a user-selected action.
- Send-anyway is explicit and one-time.
- Dynamic pages can create false positives; README documents the tradeoff.
- Chrome internal pages can reject injection.

## Candidate score

| Candidate | Pain | Novelty | Build today | Shareability | OSS fit | Total | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| RevisionLock | 5 | 4 | 5 | 5 | 5 | 24/25 | Select |
| Draft recovery | 5 | 2 | 5 | 4 | 5 | 21/25 | Reject: Form-Rescue, Unlose, DraftHarbor already cover it |
| Claim guard | 5 | 4 | 5 | 5 | 5 | 24/25 | Reject: overlaps the published PromiseLock |
| Local-path privacy guard | 4 | 3 | 5 | 4 | 5 | 21/25 | Reject: overlaps PasteHalo and AgentGuard |

## Seven-day experiment

Give the unpacked extension to five PR reviewers and AI-chat users. Each starts a draft, triggers a page update or switches away and back, then attempts to send. Measure stale-send blocks, false positives on normal dynamic pages, and whether users keep it enabled for seven days.

## Business hypothesis

Free local OSS earns trust and distribution. A later team edition could provide site-specific policies and audit counters without collecting message text. Revenue is unverified and no paid service is needed for MVP.
