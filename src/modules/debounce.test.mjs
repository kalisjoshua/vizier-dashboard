import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { debounce, DEFAULT_DELAY } from "./debounce.mjs";

const TIMEOUT = 999;

describe("debounce", () => {
  it("should only call once", (test) => {
    const subject = test.mock.fn();
    const fn = debounce(subject, TIMEOUT);

    test.mock.timers.enable({ apis: ["setTimeout"] });

    assert.equal(subject.mock.calls.length, 0);

    fn();

    assert.equal(subject.mock.calls.length, 0);

    fn();

    test.mock.timers.tick(1);

    assert.equal(subject.mock.calls.length, 0);

    fn();
    fn();
    fn();
    fn();

    test.mock.timers.tick(TIMEOUT - 1);

    assert.equal(subject.mock.calls.length, 0);

    fn();

    test.mock.timers.tick(TIMEOUT);

    assert.equal(subject.mock.calls.length, 1);

    fn();
    fn();
    fn();
    fn();
    fn();
    fn();

    test.mock.timers.tick(TIMEOUT);

    assert.equal(subject.mock.calls.length, 2);
  });

  it("should use the default delay", (test) => {
    const subject = test.mock.fn();
    const fn = debounce(subject);

    test.mock.timers.enable({ apis: ["setTimeout"] });

    fn();

    assert.equal(subject.mock.calls.length, 0);

    fn();
    fn();
    fn();
    fn();

    test.mock.timers.tick(DEFAULT_DELAY);

    assert.equal(subject.mock.calls.length, 1);
  });
});
