const EXCLUDED_SEND_WORDS = /\b(save|attach|upload|cancel|close)\b/i;
const SEND_WORDS = /\b(send|submit|post|reply)\b/i;

export type ComposerElement = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

export function isLikelySendLabel(label: string): boolean {
  const normalized = label.replace(/\s+/g, " ").trim();
  return Boolean(normalized) && !EXCLUDED_SEND_WORDS.test(normalized) && SEND_WORDS.test(normalized);
}

export function isComposerElement(element: Element | null): element is ComposerElement {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element instanceof HTMLTextAreaElement) {
    return true;
  }

  if (element instanceof HTMLInputElement) {
    return ["", "text", "search"].includes(element.type.toLowerCase());
  }

  return element.isContentEditable || element.getAttribute("role") === "textbox";
}

export function readComposer(composer: ComposerElement): string {
  if (composer instanceof HTMLInputElement || composer instanceof HTMLTextAreaElement) {
    return composer.value.trim();
  }

  return (composer.innerText || composer.textContent || "").trim();
}

export function labelForElement(element: Element): string {
  return [
    element.textContent,
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("data-testid"),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSendButton(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const candidate = element.closest("button, [role='button'], input[type='submit'], input[type='button']");
  return candidate instanceof HTMLElement && isLikelySendLabel(labelForElement(candidate));
}

export function findSendButton(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const candidate = target.closest("button, [role='button'], input[type='submit'], input[type='button']");
  return candidate instanceof HTMLElement && isLikelySendLabel(labelForElement(candidate))
    ? candidate
    : null;
}

export function findComposerForSendButton(button: HTMLElement): ComposerElement | null {
  const form = button.closest("form");
  const root: ParentNode = form ?? button.parentElement ?? document;
  const candidates = root.querySelectorAll(
    "textarea, input[type='text'], input[type='search'], input:not([type]), [contenteditable='true'], [role='textbox']",
  );

  for (const candidate of candidates) {
    if (isComposerElement(candidate)) {
      return candidate;
    }
  }

  return isComposerElement(document.activeElement) ? document.activeElement : null;
}
