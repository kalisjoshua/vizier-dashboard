import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { requiredArg } from "./requiredArgument.mjs";

describe("requiredArg", () => {
  it("should throw for missing arg: parent", () => {
    assert.throws(() => {
      requiredArg();
    }, /^Error: Argument "parent" must be provided for "requiredArg".$/);
  });

  it("should throw for missing arg: name", () => {
    assert.throws(() => {
      requiredArg("parent");
    }, /^Error: Argument "name" must be provided for "requiredArg".$/);
  });

  it("should throw an error", () => {
    assert.throws(() => {
      // even when everything is correct, a successful call results in a thrown error :)
      requiredArg("should", "throw");
    }, /^Error: Argument "throw" must be provided for "should".$/);
  });
});
