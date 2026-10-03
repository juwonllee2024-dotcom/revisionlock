import { describe, expect, it } from "vitest";
import { isLikelySendLabel } from "../src/composer.js";

describe("send label detection", () => {
  it("recognizes common send controls", () => {
    expect(isLikelySendLabel("Send reply")).toBe(true);
    expect(isLikelySendLabel("Submit review")).toBe(true);
    expect(isLikelySendLabel("Post comment")).toBe(true);
  });

  it("does not treat non-send controls as send", () => {
    expect(isLikelySendLabel("Save draft")).toBe(false);
    expect(isLikelySendLabel("Upload file")).toBe(false);
    expect(isLikelySendLabel("Attach")).toBe(false);
  });
});
