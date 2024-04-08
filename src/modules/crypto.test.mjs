import assert from "node:assert/strict";
import { describe, it } from "node:test";

import * as crypto from "./crypto.mjs";

describe("crypto", () => {
  it("should decrypt to the same thing", async () => {
    const phrase = "hello test";
    const expected = "this is only a test";
    const hidden = await crypto.encrypt(expected, phrase);
    const actual = await crypto.decrypt(hidden, phrase);

    assert.equal(actual, expected);
  });
});
