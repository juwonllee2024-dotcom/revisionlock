import {
  findComposerForSendButton,
  findSendButton,
  isComposerElement,
  readComposer,
} from "./composer.js";
import {
  createRevisionState,
  markDraftStarted,
  markMutation,
  markVisibility,
  shouldPauseSend,
  type RevisionState,
} from "./revision.js";

type ReviewMode = "warning" | "review";

interface RevisionUi {
  host: HTMLDivElement;
  show(mode: ReviewMode, state: RevisionState): void;
  hide(): void;
  setPendingSend(enabled: boolean): void;
}

const installedFlag = "revisionlockInstalled";
if (document.documentElement.dataset[installedFlag] !== "true") {
  document.documentElement.dataset[installedFlag] = "true";
  installRevisionLock();
}

function installRevisionLock(): void {
  let state = createRevisionState();
  let activeComposer: HTMLElement | null = null;
  let pendingButton: HTMLElement | null = null;
  let pendingComposer: HTMLElement | null = null;
  const approvedButtons = new WeakSet<HTMLElement>();
  const ui = createUi();

  const isExtensionUi = (node: Node | null): boolean =>
    Boolean(node && (node === ui.host || ui.host.contains(node)));

  const composerContains = (node: Node | null): boolean =>
    Boolean(node && activeComposer && (node === activeComposer || activeComposer.contains(node)));

  const refreshWarning = (): void => {
    if (shouldPauseSend(state) && activeComposer && readComposer(activeComposer).length > 0) {
      ui.show("warning", state);
    } else if (!pendingButton) {
      ui.hide();
    }
  };

  const rememberComposer = (target: EventTarget | null): void => {
    if (target instanceof Element && isComposerElement(target)) {
      activeComposer = target;
      state = markDraftStarted(state);
      refreshWarning();
    }
  };

  document.addEventListener("focusin", (event) => rememberComposer(event.target), true);
  document.addEventListener("input", (event) => rememberComposer(event.target), true);

  document.addEventListener(
    "click",
    (event) => {
      const button = findSendButton(event.target);
      if (!button || isExtensionUi(button)) {
        return;
      }

      if (approvedButtons.has(button)) {
        approvedButtons.delete(button);
        return;
      }

      const composer = findComposerForSendButton(button);
      if (!composer || readComposer(composer).length === 0) {
        return;
      }

      activeComposer = composer;
      state = markDraftStarted(state);
      if (!shouldPauseSend(state)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      pendingButton = button;
      pendingComposer = composer;
      ui.setPendingSend(true);
      ui.show("review", state);
    },
    true,
  );

  document.addEventListener("visibilitychange", () => {
    state = markVisibility(state, document.visibilityState === "hidden" ? "hidden" : "visible");
    if (document.visibilityState === "visible") {
      refreshWarning();
    }
  });

  const observer = new MutationObserver((records) => {
    if (!state.draftStarted) {
      return;
    }

    const changedOutsideComposer = records.some((record) => {
      const target = record.target;
      return !isExtensionUi(target) && !composerContains(target);
    });

    if (changedOutsideComposer) {
      state = markMutation(state, { insideComposer: false });
      refreshWarning();
    }
  });

  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });

  const resetPending = (): void => {
    pendingButton = null;
    pendingComposer = null;
    ui.setPendingSend(false);
  };

  ui.host.addEventListener("revisionlock:keep-editing", () => {
    pendingComposer?.focus();
    resetPending();
    ui.hide();
  });

  ui.host.addEventListener("revisionlock:send-anyway", () => {
    if (!pendingButton) {
      return;
    }

    const button = pendingButton;
    resetPending();
    ui.hide();
    approvedButtons.add(button);
    button.click();
  });

  ui.host.addEventListener("revisionlock:refresh", () => {
    window.location.reload();
  });
}

function createUi(): RevisionUi {
  const host = document.createElement("div");
  host.dataset.revisionlockUi = "true";
  host.style.all = "initial";
  const shadow = host.attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .panel {
        position: fixed;
        z-index: 2147483647;
        right: 20px;
        bottom: 20px;
        width: min(360px, calc(100vw - 40px));
        padding: 18px;
        border: 1px solid #8db8ff;
        border-radius: 16px;
        background: #0b1426;
        color: #edf4ff;
        box-shadow: 0 18px 50px rgba(0, 0, 0, .42);
        font: 14px/1.45 ui-sans-serif, system-ui, sans-serif;
      }
      .panel[hidden] { display: none; }
      .eyebrow { margin: 0 0 6px; color: #8db8ff; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
      h2 { margin: 0 0 8px; font-size: 19px; letter-spacing: -.02em; }
      p { margin: 0 0 10px; color: #c1cee2; }
      ul { margin: 0 0 14px; padding-left: 18px; color: #dbe7f8; }
      .actions { display: flex; flex-wrap: wrap; gap: 8px; }
      button { cursor: pointer; border: 1px solid #3d5e8d; border-radius: 999px; padding: 9px 12px; background: #152844; color: #edf4ff; font: inherit; }
      button.primary { border-color: #b8d4ff; background: #8db8ff; color: #071225; font-weight: 800; }
      button:hover { filter: brightness(1.12); }
    </style>
    <section class="panel" hidden role="alertdialog" aria-live="assertive" aria-label="RevisionLock review">
      <p class="eyebrow">RevisionLock</p>
      <h2 id="title">The page changed while you typed.</h2>
      <p id="copy">Review the current page before sending this message.</p>
      <ul id="reasons"></ul>
      <div class="actions">
        <button id="refresh" type="button">Refresh page</button>
        <button id="keep" type="button">Keep editing</button>
        <button id="send" class="primary" type="button" hidden>Send anyway once</button>
      </div>
    </section>
  `;
  document.documentElement.append(host);

  const panel = shadow.querySelector<HTMLElement>(".panel");
  const title = shadow.querySelector<HTMLElement>("#title");
  const copy = shadow.querySelector<HTMLElement>("#copy");
  const reasons = shadow.querySelector<HTMLUListElement>("#reasons");
  const send = shadow.querySelector<HTMLButtonElement>("#send");

  if (!panel || !title || !copy || !reasons || !send) {
    throw new Error("RevisionLock UI could not be created");
  }

  shadow.querySelector<HTMLButtonElement>("#refresh")?.addEventListener("click", () => {
    host.dispatchEvent(new CustomEvent("revisionlock:refresh"));
  });
  shadow.querySelector<HTMLButtonElement>("#keep")?.addEventListener("click", () => {
    host.dispatchEvent(new CustomEvent("revisionlock:keep-editing"));
  });
  send.addEventListener("click", () => {
    host.dispatchEvent(new CustomEvent("revisionlock:send-anyway"));
  });

  return {
    host,
    show(mode, state) {
      title.textContent = mode === "review" ? "This message may be out of date." : "The page changed while you typed.";
      copy.textContent = mode === "review"
        ? "Choose what should happen before the message leaves this page."
        : "RevisionLock paused sending so you can verify the current page.";
      reasons.replaceChildren();
      if (state.pageChanged) {
        const item = document.createElement("li");
        item.textContent = "Page content changed outside your message.";
        reasons.append(item);
      }
      if (state.returnedFromBackground) {
        const item = document.createElement("li");
        item.textContent = "This tab returned after being in the background.";
        reasons.append(item);
      }
      panel.hidden = false;
    },
    hide() {
      panel.hidden = true;
    },
    setPendingSend(enabled) {
      send.hidden = !enabled;
    },
  };
}

export {};
