import { describe, expect, it } from "vitest";
import {
  createRevisionState,
  markDraftStarted,
  markMutation,
  markVisibility,
  shouldPauseSend,
} from "../src/revision.js";

describe("RevisionLock state", () => {
  it("does not pause a send before drafting starts", () => {
    expect(shouldPauseSend(createRevisionState())).toBe(false);
  });

  it("pauses after a page mutation outside the composer", () => {
    const state = markDraftStarted(createRevisionState());
    const changed = markMutation(state, { insideComposer: false });

    expect(shouldPauseSend(changed)).toBe(true);
  });

  it("ignores mutations caused by the composer itself", () => {
    const state = markDraftStarted(createRevisionState());
    const unchanged = markMutation(state, { insideComposer: true });

    expect(shouldPauseSend(unchanged)).toBe(false);
  });

  it("pauses when a drafted tab returns from the background", () => {
    const state = markDraftStarted(createRevisionState());
    const hidden = markVisibility(state, "hidden");
    const visible = markVisibility(hidden, "visible");

    expect(shouldPauseSend(visible)).toBe(true);
  });
});
